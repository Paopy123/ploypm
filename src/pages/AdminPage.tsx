import { AdminDashboard } from '../components/AdminDashboard';
import { AdminLogin } from '../components/AdminLogin';
import { useAuth } from '../context/AuthContext';

export function AdminPage() {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="admin-page">
        <p className="admin-loading">Loading…</p>
      </div>
    );
  }

  if (!isAdmin) return <AdminLogin />;
  return <AdminDashboard />;
}
