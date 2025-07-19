import { useState } from 'react';
import { Form, Button } from 'react-bootstrap';

function AddCommentForm({ onCommentSubmit }) {
  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) {
      setError('Komentar tidak boleh kosong.');
      return;
    }

    // Jika valid, lanjutkan proses
    setError(''); // Bersihkan error
    onCommentSubmit(commentText);
    setCommentText('');
  };

  return (
    <Form onSubmit={handleSubmit} className="mt-4" noValidate>
      <Form.Group className="mb-3">
        <Form.Label>Tinggalkan Komentar</Form.Label>
        <Form.Control 
          as="textarea" 
          rows={3} 
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Tulis komentarmu di sini..."
          isInvalid={!!error}
        />
        <Form.Control.Feedback type="invalid">
          {error}
        </Form.Control.Feedback>
      </Form.Group>
      <Button variant="primary" type="submit">
        Kirim Komentar
      </Button>
    </Form>
  );
}

export default AddCommentForm;