import { Container } from 'react-bootstrap';
import { useAuth } from '../hooks/useAuth';

function DashboardPage() {
  const { user } = useAuth();

  return (
    <Container>
      <h1>Dashboard Pengguna</h1>
      <hr />
      {user ? (
        <div>
          <h3>Selamat Datang, {user.name}!</h3>
          <p>Ini adalah halaman pribadi Anda. Di sini Anda bisa melihat riwayat rating dan komentar Anda nanti.</p>
        </div>
      ) : (
        <p>Silakan login untuk melihat halaman ini.</p>
      )}
    </Container>
  );
}

// PASTIKAN BARIS INI ADA
export default DashboardPage;