import { Container, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({}); // Gunakan objek untuk menampung beberapa error
  
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    if (!name) newErrors.name = 'Nama lengkap tidak boleh kosong.';
    if (!email) newErrors.email = 'Email tidak boleh kosong.';
    if (password.length < 8) newErrors.password = 'Password minimal 8 karakter.';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Konfirmasi password tidak cocok.';

    setErrors(newErrors);
    // Jika objek 'newErrors' kosong, berarti form valid
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Jika validasi berhasil
      console.log('Mendaftarkan user:', { name, email, password });
      alert('Registrasi berhasil! Silakan login.');
      navigate('/login');
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-md-center">
        <Col xs={12} md={6}>
          <h2 className="text-center mb-4">Buat Akun Baru</h2>
          <Form noValidate onSubmit={handleRegister}>
            <Form.Group className="mb-3" controlId="formBasicName">
              <Form.Label>Nama Lengkap</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Masukkan nama lengkap" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                isInvalid={!!errors.name}
              />
              <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label>Alamat Email</Form.Label>
              <Form.Control 
                type="email" 
                placeholder="Masukkan email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                isInvalid={!!errors.email}
              />
              <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBasicPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control 
                type="password" 
                placeholder="Buat password (min. 8 karakter)" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                isInvalid={!!errors.password}
              />
              <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formConfirmPassword">
              <Form.Label>Konfirmasi Password</Form.Label>
              <Form.Control 
                type="password" 
                placeholder="Ketik ulang password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                isInvalid={!!errors.confirmPassword}
              />
              <Form.Control.Feedback type="invalid">{errors.confirmPassword}</Form.Control.Feedback>
            </Form.Group>

            <div className="d-grid">
              <Button variant="primary" type="submit">Daftar</Button>
            </div>
          </Form>
          <div className="text-center mt-3">
            <p>Sudah punya akun? <Link to="/login">Login di sini</Link></p>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default RegisterPage;