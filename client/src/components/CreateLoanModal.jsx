import { useState, useEffect } from 'react';
import './CreateLoanModal.css';

export default function CreateLoanModal({ loan, onClose, onSubmit }) {
  const [amount, setAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [durationMonths, setDurationMonths] = useState('');
  const [loading, setLoading] = useState(false);

  const isEdit = !!loan;

  useEffect(() => {
    if (loan) {
      setAmount(loan.amount?.toString() || '');
      setInterestRate(loan.interest_rate?.toString() || '');
      setDurationMonths(loan.duration_months?.toString() || '');
    }
  }, [loan]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    const rate = parseFloat(interestRate);
    const dur = parseInt(durationMonths, 10);
    if (isNaN(amt) || amt <= 0 || isNaN(rate) || rate < 0 || isNaN(dur) || dur < 1) {
      return;
    }
    setLoading(true);
    try {
      await onSubmit({ amount: amt, interestRate: rate, durationMonths: dur });
      onClose();
    } catch {
      // Error handled in parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Loan Request' : 'Create Loan Request'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            <input
              type="number"
              className="form-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10000"
              min="1"
              step="1"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Interest Rate (% p.a.)</label>
            <input
              type="number"
              className="form-input"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              placeholder="12"
              min="0"
              step="0.1"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Duration (months)</label>
            <input
              type="number"
              className="form-input"
              value={durationMonths}
              onChange={(e) => setDurationMonths(e.target.value)}
              placeholder="12"
              min="1"
              max="120"
              required
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
