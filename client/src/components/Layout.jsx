import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLink = (to, label) => (
    <Link to={to} className={location.pathname === to ? 'nav-link active' : 'nav-link'}>
      {label}
    </Link>
  );

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <Link to="/dashboard" className="logo">
            <span className="logo-icon">F</span>
            <span>Fino X Change</span>
          </Link>

          <nav className="nav">
            {navLink('/dashboard', 'Dashboard')}
            {navLink('/loans', 'Browse Loans')}
            {navLink('/my-loans', 'My Loans')}
            {navLink('/funded', 'Funded')}
            {navLink('/repayments', 'Repayments')}
            {navLink('/completed', 'Completed')}
          </nav>

          <div className="header-actions">
            <span className="user-name">{user?.name || user?.email}</span>
            <button onClick={handleLogout} className="btn btn-ghost">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="main"><Outlet /></main>
    </div>
  );
}
