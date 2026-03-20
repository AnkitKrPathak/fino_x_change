import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { repaymentsApi, paymentsApi, loansApi } from '../api/api';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate } from '../utils/format';
import { openRazorpayCheckout } from '../utils/razorpay';
import './Repayments.css';

export default function Repayments() {
  const [searchParams] = useSearchParams();
  const loanIdParam = searchParams.get('loan');
  const [fundedLoans, setFundedLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [history, setHistory] = useState([]);
  const [repayAmount, setRepayAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [repaying, setRepaying] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (loanIdParam && fundedLoans.length > 0) {
      const loan = fundedLoans.find((l) => (l.id || l.loan_id).toString() === loanIdParam);
      if (loan) setSelectedLoan(loan);
    }
  }, [loanIdParam, fundedLoans]);

  useEffect(() => {
    if (selectedLoan) {
      const loanId = selectedLoan.id || selectedLoan.loan_id;
      loadScheduleAndHistory(loanId);
    } else {
      setSchedule(null);
      setHistory([]);
    }
  }, [selectedLoan]);

  const loadData = async () => {
    try {
      const [borrowerFunded, lenderFunded, borrowerCompleted, lenderCompleted] = await Promise.all([
        loansApi.getFundedBorrower(),
        loansApi.getFundedLender(),
        loansApi.getCompletedBorrower(),
        loansApi.getCompletedLender(),
      ]);
      const fundedBorrower = borrowerFunded.fundedLoans || [];
      const fundedLender = lenderFunded.fundedLoans || [];
      const completedBorrower = (borrowerCompleted.completed_loans || []).map((l) => ({
        ...l,
        id: l.loan_id,
        lender_name: l.lender_name,
        remaining_balance: 0,
      }));
      const completedLender = (lenderCompleted.completed_loans || []).map((l) => ({
        ...l,
        id: l.loan_id,
        borrower_name: l.borrower_name,
        remaining_balance: 0,
      }));
      const allLoans = [...fundedBorrower, ...fundedLender, ...completedBorrower, ...completedLender];
      setFundedLoans(allLoans);
      if (loanIdParam) {
        const found = allLoans.find((l) => (l.id || l.loan_id).toString() === loanIdParam);
        if (found) setSelectedLoan(found);
      } else if (allLoans.length > 0) {
        setSelectedLoan(allLoans[0]);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const loadScheduleAndHistory = async (loanId) => {
    try {
      const [schedRes, histRes] = await Promise.all([
        repaymentsApi.getSchedule(loanId),
        repaymentsApi.getHistory(loanId),
      ]);
      setSchedule(schedRes);
      setHistory(histRes.history || []);
    } catch {
      setSchedule(null);
      setHistory([]);
    }
  };

  const handleRepay = async () => {
    if (!selectedLoan || !repayAmount) return;
    const amount = parseFloat(repayAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setRepaying(true);
    try {
      const { key } = await paymentsApi.getRazorpayKey();
      const loanId = selectedLoan.id || selectedLoan.loan_id;
      const { order } = await repaymentsApi.create(loanId, amount);
      if (!key) {
        toast.error('Razorpay is not configured.');
        return;
      }
      openRazorpayCheckout({
        key,
        order,
        onSuccess: async (payment) => {
          try {
            await repaymentsApi.verify(
              payment.razorpay_order_id,
              payment.razorpay_payment_id,
              payment.razorpay_signature
            );
            toast.success('Repayment successful!');
            setRepayAmount('');
            loadData();
            if (selectedLoan) loadScheduleAndHistory(selectedLoan.id || selectedLoan.loan_id);
          } catch (e) {
            toast.error(e.message || 'Verification failed');
          } finally {
            setRepaying(false);
          }
        },
        onDismiss: () => setRepaying(false),
      });
    } catch (err) {
      toast.error(err.message || 'Failed to create repayment');
      setRepaying(false);
    }
  };

  // Borrower can repay: funded loan (has lender_name, status funded, remaining > 0)
  const canRepay = selectedLoan && selectedLoan.lender_name && selectedLoan.status === 'funded' && (selectedLoan.remaining_balance || 0) > 0;

  if (loading) {
    return (
      <div className="page-header">
        <h1 className="page-title">Repayments</h1>
        <p className="loading-text">Loading...</p>
      </div>
    );
  }

  return (
    <div className="repayments-page">
      <div className="page-header">
        <h1 className="page-title">Repayments</h1>
        <p className="page-subtitle">Make payments and view schedule</p>
      </div>

      <div className="repayments-layout">
        <div className="repayments-sidebar">
          <h3 className="section-title">Select Loan</h3>
          {fundedLoans.length === 0 ? (
            <p className="empty-message">No loans with repayments.</p>
          ) : (
            <div className="loan-list">
              {fundedLoans.map((loan) => {
                const loanId = loan.id || loan.loan_id;
                return (
                  <button
                    key={loanId}
                    className={`loan-list-item ${(selectedLoan?.id || selectedLoan?.loan_id) === loanId ? 'active' : ''}`}
                    onClick={() => setSelectedLoan(loan)}
                  >
                    <span>{formatCurrency(loan.amount)}</span>
                    <span className="loan-list-meta">
                      {loan.borrower_name ? `Lent to ${loan.borrower_name}` : `From ${loan.lender_name}`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="repayments-main">
          {selectedLoan ? (
            <>
              <div className="schedule-card card">
                <h3 className="section-title">EMI Schedule</h3>
                {schedule ? (
                  <div className="schedule-info">
                    <div className="schedule-row">
                      <span>EMI per month</span>
                      <strong>{formatCurrency(schedule.EMI_per_month)}</strong>
                    </div>
                    <div className="schedule-row">
                      <span>Total payable</span>
                      <strong>{formatCurrency(schedule.total_payable)}</strong>
                    </div>
                    <div className="schedule-row">
                      <span>Duration</span>
                      <strong>{schedule.duration_months} months</strong>
                    </div>
                    <div className="schedule-row">
                      <span>Interest rate</span>
                      <strong>{schedule.interest_rate}% p.a.</strong>
                    </div>
                  </div>
                ) : (
                  <p className="empty-message">Loading schedule...</p>
                )}
              </div>

              {canRepay && (
                <div className="repay-card card">
                  <h3 className="section-title">Make Repayment</h3>
                  <p className="repay-hint">
                    Remaining: {formatCurrency(selectedLoan.remaining_balance)}
                  </p>
                  <div className="repay-form">
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Amount"
                      value={repayAmount}
                      onChange={(e) => setRepayAmount(e.target.value)}
                      min="1"
                      max={selectedLoan.remaining_balance}
                      step="1"
                    />
                    <button
                      className="btn btn-primary"
                      onClick={handleRepay}
                      disabled={repaying || !repayAmount}
                    >
                      {repaying ? 'Processing...' : 'Pay via Razorpay'}
                    </button>
                  </div>
                </div>
              )}

              <div className="history-card card">
                <h3 className="section-title">Repayment History</h3>
                {history.length === 0 ? (
                  <p className="empty-message">No repayments yet.</p>
                ) : (
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Amount</th>
                        <th>Type</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((r) => (
                        <tr key={r.repayment_id}>
                          <td>{formatCurrency(r.repayment_amount)}</td>
                          <td>{r.payment_type}</td>
                          <td>{formatDate(r.payment_date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <p className="empty-message">Select a loan to view details.</p>
          )}
        </div>
      </div>
    </div>
  );
}
