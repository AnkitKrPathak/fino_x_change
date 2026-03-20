import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ratingsApi } from '../api/api';
import './Dashboard.css';

function TinyRatingCard({ label, value }) {
  return (
    <div className="rating-tiny-card">
      <span className="rating-tiny-star" aria-hidden="true">
        ★
      </span>
      <div className="rating-tiny-body">
        <div className="rating-tiny-label">{label}</div>
        <div className="rating-tiny-value">{value != null ? `${value.toFixed(2)}/5` : '—'}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();

  const [ratingLoading, setRatingLoading] = useState(true);
  const [borrowerRatingAvg, setBorrowerRatingAvg] = useState(null);
  const [lenderRatingAvg, setLenderRatingAvg] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function loadRatings() {
      if (!user?.id) return;
      setRatingLoading(true);
      try {
        const data = await ratingsApi.getUser(user.id);
        const summary = data?.summary || [];
        const borrowerRow = summary.find((r) => r.role === 'borrower');
        const lenderRow = summary.find((r) => r.role === 'lender');

        if (!mounted) return;
        setBorrowerRatingAvg(borrowerRow ? Number(borrowerRow.average_rating) : null);
        setLenderRatingAvg(lenderRow ? Number(lenderRow.average_rating) : null);
      } catch (err) {
        if (!mounted) return;
        toast.error(err.message || 'Failed to load rating');
        setBorrowerRatingAvg(null);
        setLenderRatingAvg(null);
      } finally {
        if (!mounted) return;
        setRatingLoading(false);
      }
    }
    loadRatings();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const actions = useMemo(
    () => [
      {
        title: 'Create Loan Request',
        desc: 'Request a loan as a borrower',
        to: '/my-loans?create=1',
        icon: '📤',
      },
      {
        title: 'Browse Loans',
        desc: 'Fund loan requests as a lender',
        to: '/loans',
        icon: '🔍',
      },
      {
        title: 'My Loan Requests',
        desc: 'View and manage your requests',
        to: '/my-loans',
        icon: '📋',
      },
      {
        title: 'Funded Loans',
        desc: "Active loans you've funded or received",
        to: '/funded',
        icon: '💰',
      },
      {
        title: 'Repayments',
        desc: 'Make or track repayments',
        to: '/repayments',
        icon: '📅',
      },
      {
        title: 'Completed Loans',
        desc: 'View completed loans and rate peers',
        to: '/completed',
        icon: '⭐',
      },
    ],
    []
  );

  return (
    <div className="dashboard">
      <div className="page-header">
        <div className="page-header-top">
          <div className="page-header-titles">
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Welcome back, {user?.name || 'User'}</p>
          </div>

          <div className="rating-tiny-row" aria-label="Your average ratings">
            {ratingLoading ? (
              <div className="rating-tiny-card rating-tiny-skeleton">Loading...</div>
            ) : (
              <>
                <TinyRatingCard label="Borrower" value={borrowerRatingAvg} />
                <TinyRatingCard label="Lender" value={lenderRatingAvg} />
              </>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {actions.map((a) => (
          <Link key={a.to} to={a.to} className="dashboard-card">
            <span className="dashboard-card-icon">{a.icon}</span>
            <h3>{a.title}</h3>
            <p>{a.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
