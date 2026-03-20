import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { loansApi } from '../api/api';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate } from '../utils/format';
import CreateLoanModal from '../components/CreateLoanModal';
import './Loans.css';

export default function MyLoans() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchParams] = useSearchParams();
  const toast = useToast();

  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setShowCreate(true);
    }
    loadLoans();
  }, [searchParams]);

  const loadLoans = async () => {
    try {
      const data = await loansApi.getMy();
      setLoans(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message || 'Failed to load loans');
      setLoans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (form) => {
    try {
      await loansApi.create(form.amount, form.interestRate, form.durationMonths);
      toast.success('Loan request created');
      setShowCreate(false);
      loadLoans();
    } catch (err) {
      toast.error(err.message || 'Failed to create loan');
      throw err;
    }
  };

  const handleEdit = async (loanId, form) => {
    try {
      await loansApi.edit(loanId, form.amount, form.interestRate, form.durationMonths);
      toast.success('Loan updated');
      setEditing(null);
      loadLoans();
    } catch (err) {
      toast.error(err.message || 'Failed to update loan');
      throw err;
    }
  };

  const handleCancel = async (loanId) => {
    if (!confirm('Are you sure you want to cancel this loan request?')) return;
    try {
      await loansApi.cancel(loanId);
      toast.success('Loan cancelled');
      loadLoans();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel loan');
    }
  };

  if (loading) {
    return (
      <div className="page-header">
        <h1 className="page-title">My Loans</h1>
        <p className="loading-text">Loading...</p>
      </div>
    );
  }

  return (
    <div className="loans-page">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">My Loan Requests</h1>
          <p className="page-subtitle">Create and manage your loan requests</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + Create Request
        </button>
      </div>

      {loans.length === 0 ? (
        <div className="empty-state">
          <p>You haven't created any loan requests yet.</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            Create your first loan request
          </button>
        </div>
      ) : (
        <div className="loans-table-wrap">
          <table className="loans-table">
            <thead>
              <tr>
                <th>Amount</th>
                <th>Interest</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id}>
                  <td>{formatCurrency(loan.amount)}</td>
                  <td>{loan.interest_rate}% p.a.</td>
                  <td>{loan.duration_months} mo</td>
                  <td>
                    <span className={`loan-status status-${loan.status}`}>{loan.status}</span>
                  </td>
                  <td>{formatDate(loan.created_at)}</td>
                  <td>
                    {loan.status === 'pending' && (
                      <>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setEditing(loan)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleCancel(loan.id)}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateLoanModal
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      )}

      {editing && (
        <CreateLoanModal
          loan={editing}
          onClose={() => setEditing(null)}
          onSubmit={(form) => handleEdit(editing.id, form)}
        />
      )}
    </div>
  );
}
