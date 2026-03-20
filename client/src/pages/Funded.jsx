import { useState, useEffect } from 'react';
import { loansApi } from '../api/api';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate } from '../utils/format';
import { Link } from 'react-router-dom';
import './Loans.css';

export default function Funded() {
  const [borrowerLoans, setBorrowerLoans] = useState([]);
  const [lenderLoans, setLenderLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('borrower');
  const toast = useToast();

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    try {
      const [borrowerRes, lenderRes] = await Promise.all([
        loansApi.getFundedBorrower(),
        loansApi.getFundedLender(),
      ]);
      setBorrowerLoans(borrowerRes.fundedLoans || []);
      setLenderLoans(lenderRes.fundedLoans || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  const borrowerList = Array.isArray(borrowerLoans) ? borrowerLoans : [];
  const lenderList = Array.isArray(lenderLoans) ? lenderLoans : [];

  if (loading) {
    return (
      <div className="page-header">
        <h1 className="page-title">Funded Loans</h1>
        <p className="loading-text">Loading...</p>
      </div>
    );
  }

  return (
    <div className="funded-page">
      <div className="page-header">
        <h1 className="page-title">Funded Loans</h1>
        <p className="page-subtitle">Active loans you've funded or received</p>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'borrower' ? 'active' : ''}`}
          onClick={() => setActiveTab('borrower')}
        >
          As Borrower ({borrowerList.length})
        </button>
        <button
          className={`tab ${activeTab === 'lender' ? 'active' : ''}`}
          onClick={() => setActiveTab('lender')}
        >
          As Lender ({lenderList.length})
        </button>
      </div>

      {activeTab === 'borrower' && (
        <div className="section-card">
          <h3 className="section-title">Loans you received</h3>
          {borrowerList.length === 0 ? (
            <p className="empty-message">No funded loans as borrower.</p>
          ) : (
            <div className="loans-grid">
              {borrowerList.map((loan) => (
                <div key={loan.id} className="loan-card">
                  <div className="loan-card-header">
                    <span className="loan-amount">{formatCurrency(loan.amount)}</span>
                    <span className={`loan-status status-${loan.status}`}>{loan.status}</span>
                  </div>
                  <div className="loan-details">
                    <div className="loan-detail">
                      <span className="label">Lender</span>
                      <span>{loan.lender_name}</span>
                    </div>
                    <div className="loan-detail">
                      <span className="label">Remaining</span>
                      <span>{formatCurrency(loan.remaining_balance)}</span>
                    </div>
                    <div className="loan-detail">
                      <span className="label">Total Payable</span>
                      <span>{formatCurrency(loan.total_payable)}</span>
                    </div>
                  </div>
                  <div className="loan-card-actions">
                    <Link to={`/repayments?loan=${loan.id}`} className="btn btn-primary btn-sm">
                      Make Repayment
                    </Link>
                    <Link to={`/repayments?loan=${loan.id}`} className="btn btn-secondary btn-sm">
                      View Repayments
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'lender' && (
        <div className="section-card">
          <h3 className="section-title">Loans you funded</h3>
          {lenderList.length === 0 ? (
            <p className="empty-message">No funded loans as lender.</p>
          ) : (
            <div className="loans-grid">
              {lenderList.map((loan) => (
                <div key={loan.id} className="loan-card">
                  <div className="loan-card-header">
                    <span className="loan-amount">{formatCurrency(loan.amount)}</span>
                    <span className={`loan-status status-${loan.status}`}>{loan.status}</span>
                  </div>
                  <div className="loan-details">
                    <div className="loan-detail">
                      <span className="label">Borrower</span>
                      <span>{loan.borrower_name}</span>
                    </div>
                    <div className="loan-detail">
                      <span className="label">Remaining</span>
                      <span>{formatCurrency(loan.remaining_balance)}</span>
                    </div>
                  </div>
                  <Link to={`/repayments?loan=${loan.id}`} className="btn btn-secondary btn-sm btn-full">
                    View Repayments
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
