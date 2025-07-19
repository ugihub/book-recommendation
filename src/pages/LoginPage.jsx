import { Container, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // State untuk password
  const [error, setError] = useState(''); // State untuk pesan error
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError(''); // Reset error setiap kali submit

    // Validasi sederhana: pastikan tidak ada yang kosong
    if (!email || !password) {
      setError('Email dan password tidak boleh kosong.');
      return;
    }

    // Jika valid, lanjutkan simulasi login
    console.log('Mencoba login dengan:', { email, password });
    login({ name: 'User Keren', email: email });
    navigate('/');
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-md-center">
        <Col xs={12} md={6}>
          <h2 className="text-center mb-4">Login</h2>
          
          {/* Tampilkan pesan error jika ada */}
          {error && <Alert variant="danger">{error}</Alert>}

          <Form noValidate onSubmit={handleLogin}>
            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label>Alamat Email</Form.Label>
              <Form.Control 
                type="email" 
                placeholder="Masukkan email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                isInvalid={!!error} // Beri tanda error jika ada pesan
              />
            </Form.Group>

            {/* Input untuk Password */}
            <Form.Group className="mb-3" controlId="formBasicPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control 
                type="password" 
                placeholder="Password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                isInvalid={!!error} // Beri tanda error jika ada pesan
              />
              <Form.Control.Feedback type="invalid">
                Email atau password salah.
              </Form.Control.Feedback>
            </Form.Group>

            <div className="d-grid">
              <Button variant="primary" type="submit">Login</Button>
            </div>
          </Form>
          <div className="text-center mt-3">
            <p>Belum punya akun? <Link to="/register">Daftar di sini</Link></p>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default LoginPage;