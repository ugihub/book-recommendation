import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function ProtectedRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    // Jika tidak ada user yang login, arahkan ke halaman /login
    return <Navigate to="/login" />;
  }

  // Jika ada user, tampilkan komponen yang seharusnya
  return children;
}

// PASTIKAN BARIS INI ADA
export default ProtectedRoute;