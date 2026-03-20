import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { loansApi, ratingsApi } from '../api/api';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate } from '../utils/format';
import './Loans.css';

export default function CompletedLoans() {
  const [borrowerLoans, setBorrowerLoans] = useState([]);
  const [lenderLoans, setLenderLoans] = useState([]);
  const [ratedLoanIds, setRatedLoanIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('borrower');
  const [ratingModal, setRatingModal] = useState(null);
  const toast = useToast();

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    try {
      const [borrowerRes, lenderRes, ratedRes] = await Promise.all([
        loansApi.getCompletedBorrower(),
        loansApi.getCompletedLender(),
        ratingsApi.getRatedLoanIds(),
      ]);
      setBorrowerLoans(borrowerRes.completed_loans || []);
      setLenderLoans(lenderRes.completed_loans || []);
      setRatedLoanIds(ratedRes.loanIds || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async (loanId, role, rating, comment) => {
    try {
      await ratingsApi.add(loanId, role, rating, comment);
      toast.success('Rating submitted');
      setRatingModal(null);
      loadLoans();
    } catch (err) {
      toast.error(err.message || 'Failed to submit rating');
      throw err;
    }
  };

  const borrowerList = Array.isArray(borrowerLoans) ? borrowerLoans : [];
  const lenderList = Array.isArray(lenderLoans) ? lenderLoans : [];
  const hasRated = (loanId) => ratedLoanIds.some((id) => String(id) === String(loanId));

  if (loading) {
    return (
      <div className="page-header">
        <h1 className="page-title">Completed Loans</h1>
        <p className="loading-text">Loading...</p>
      </div>
    );
  }

  return (
    <div className="funded-page">
      <div className="page-header">
        <h1 className="page-title">Completed Loans</h1>
        <p className="page-subtitle">Rate your peers after completed loans</p>
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
          <h3 className="section-title">Completed loans (you borrowed)</h3>
          {borrowerList.length === 0 ? (
            <p className="empty-message">No completed loans.</p>
          ) : (
            <div className="loans-grid">
              {borrowerList.map((loan) => (
                <div key={loan.loan_id} className="loan-card">
                  <div className="loan-card-header">
                    <span className="loan-amount">{formatCurrency(loan.amount)}</span>
                    <span className="loan-status status-completed">Completed</span>
                  </div>
                  <div className="loan-details">
                    <div className="loan-detail">
                      <span className="label">Lender</span>
                      <span>{loan.lender_name}</span>
                    </div>
                    <div className="loan-detail">
                      <span className="label">Completed</span>
                      <span>{formatDate(loan.completed_at || loan.updated_at || loan.created_at)}</span>
                    </div>
                  </div>
                  <div className="loan-card-actions">
                    <Link to={`/repayments?loan=${loan.loan_id}`} className="btn btn-secondary btn-sm">
                      View Repayments
                    </Link>
                    {hasRated(loan.loan_id) ? (
                      <span className="rated-badge">Rated</span>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setRatingModal({ loanId: loan.loan_id, role: 'lender', name: loan.lender_name })}
                      >
                        Rate Lender
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'lender' && (
        <div className="section-card">
          <h3 className="section-title">Completed loans (you lent)</h3>
          {lenderList.length === 0 ? (
            <p className="empty-message">No completed loans.</p>
          ) : (
            <div className="loans-grid">
              {lenderList.map((loan) => (
                <div key={loan.loan_id} className="loan-card">
                  <div className="loan-card-header">
                    <span className="loan-amount">{formatCurrency(loan.amount)}</span>
                    <span className="loan-status status-completed">Completed</span>
                  </div>
                  <div className="loan-details">
                    <div className="loan-detail">
                      <span className="label">Borrower</span>
                      <span>{loan.borrower_name}</span>
                    </div>
                    <div className="loan-detail">
                      <span className="label">Completed</span>
                      <span>{formatDate(loan.completed_at || loan.updated_at || loan.created_at)}</span>
                    </div>
                  </div>
                  <div className="loan-card-actions">
                    <Link to={`/repayments?loan=${loan.loan_id}`} className="btn btn-secondary btn-sm">
                      View Repayments
                    </Link>
                    {hasRated(loan.loan_id) ? (
                      <span className="rated-badge">Rated</span>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setRatingModal({ loanId: loan.loan_id, role: 'borrower', name: loan.borrower_name })}
                      >
                        Rate Borrower
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {ratingModal && (
        <RatingModal
          {...ratingModal}
          onClose={() => setRatingModal(null)}
          onSubmit={(rating, comment) => handleRate(ratingModal.loanId, ratingModal.role, rating, comment)}
        />
      )}
    </div>
  );
}

function RatingModal({ name, onClose, onSubmit }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(rating, comment);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Rate {name}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Rating (1-5)</label>
            <select
              className="form-input"
              value={rating}
              onChange={(e) => setRating(parseInt(e.target.value, 10))}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Comment (optional)</label>
            <textarea
              className="form-input"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              rows={3}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
