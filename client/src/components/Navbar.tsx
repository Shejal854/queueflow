import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-ink/90 px-6 py-4 backdrop-blur">
      <Link to="/" className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-accent" />
        <span className="font-display text-lg font-semibold tracking-tight">QueueFlow</span>
      </Link>
      {user && (
        <div className="flex items-center gap-6 text-sm">
          <Link to="/dashboard" className="text-muted hover:text-white">Dashboard</Link>
          <Link to="/jobs" className="text-muted hover:text-white">Jobs</Link>
          <Link to="/jobs/new" className="rounded-lg bg-accent px-3 py-1.5 font-medium text-ink hover:bg-accent/90">
            + New Job
          </Link>
          <button
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            className="text-muted hover:text-danger"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
