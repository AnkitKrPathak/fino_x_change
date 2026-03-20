import { useState, useEffect } from 'react';
import { loansApi, paymentsApi } from '../api/api';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/format';
import { openRazorpayCheckout } from '../utils/razorpay';
import './Loans.css';

export default function BrowseLoans() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fundingId, setFundingId] = useState(null);
  const toast = useToast();

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    try {
      const data = await loansApi.getAll();
      setLoans(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message || 'Failed to load loans');
      setLoans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFund = async (loan) => {
    setFundingId(loan.id);
    try {
      const { key } = await paymentsApi.getRazorpayKey();
      const { order } = await loansApi.fund(loan.id);
      if (!key) {
        toast.error('Razorpay is not configured. Please add RAZORPAY_KEY_ID to backend env.');
        return;
      }
      openRazorpayCheckout({
        key,
        order,
        onSuccess: async (payment) => {
          try {
            await loansApi.verifyFund(
              payment.razorpay_order_id,
              payment.razorpay_payment_id,
              payment.razorpay_signature
            );
            toast.success('Loan funded successfully!');
            loadLoans();
          } catch (e) {
            toast.error(e.message || 'Verification failed');
          } finally {
            setFundingId(null);
          }
        },
        onDismiss: () => setFundingId(null),
      });
    } catch (err) {
      toast.error(err.message || 'Failed to initiate funding');
      setFundingId(null);
    }
  };

  if (loading) {
    return (
      <div className="page-header">
        <h1 className="page-title">Browse Loans</h1>
        <p className="loading-text">Loading...</p>
      </div>
    );
  }

  return (
    <div className="loans-page">
      <div className="page-header">
        <h1 className="page-title">Browse Loan Requests</h1>
        <p className="page-subtitle">Fund loans as a lender</p>
      </div>

      {loans.length === 0 ? (
        <div className="empty-state">
          <p>No pending loan requests at the moment.</p>
          <p className="empty-sub">No loan requests from other users right now. Check back later to fund loans.</p>
        </div>
      ) : (
        <div className="loans-grid">
          {loans.map((loan) => (
            <div key={loan.id} className="loan-card">
              <div className="loan-card-header">
                <span className="loan-amount">{formatCurrency(Number(loan.amount))}</span>
                <span className={`loan-status status-${loan.status || 'pending'}`}>{loan.status || 'pending'}</span>
              </div>
              <div className="loan-details">
                <div className="loan-detail">
                  <span className="label">Borrower</span>
                  <span>{loan.borrower_name || 'Unknown'}</span>
                </div>
                <div className="loan-detail">
                  <span className="label">Avg Rating (Borrower)</span>
                  <span>
                    {loan.borrower_avg_rating != null ? `${Number(loan.borrower_avg_rating).toFixed(2)}/5` : '—'}
                  </span>
                </div>
                <div className="loan-detail">
                  <span className="label">Interest</span>
                  <span>{Number(loan.interest_rate)}% p.a.</span>
                </div>
                <div className="loan-detail">
                  <span className="label">Duration</span>
                  <span>{Number(loan.duration_months)} months</span>
                </div>
              </div>
              <button
                className="btn btn-primary btn-sm btn-full"
                onClick={() => handleFund(loan)}
                disabled={fundingId !== null}
              >
                {fundingId === loan.id ? 'Processing...' : 'Fund this loan'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
