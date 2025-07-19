import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockBooks } from '../data/mockData';
import { Container, Row, Col, Image, ListGroup, Button, Form } from 'react-bootstrap';
import AddCommentForm from '../components/AddCommentForm';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';

function DetailPage() {
  const { id } = useParams();
  const { user, showToast } = useAuth();
  const [book, setBook] = useState(null);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State untuk mode edit komentar
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    setIsLoading(true); // Mulai loading setiap kali ID berubah
    
    // Simulasi jeda
    const timer = setTimeout(() => {
      const bookId = parseInt(id);
      const foundBook = mockBooks.find(b => b.id === bookId);
      
      if (foundBook) {
        setBook(foundBook);
        setComments(foundBook.comments || []);
      } else {
        setBook(null);
        setComments([]);
      }
      setIsLoading(false); // Selesai loading
    }, 500);

    return () => clearTimeout(timer);
  }, [id]);

  const handleAddComment = (text) => {
    const newComment = { id: Date.now(), user: { name: user.name }, text: text };
    setComments([newComment, ...comments]);
    showToast('Komentar berhasil ditambahkan!', 'success');
  };

  const handleDeleteComment = (commentId) => {
    setComments(comments.filter(comment => comment.id !== commentId));
    showToast('Komentar berhasil dihapus.', 'danger');
  };

  const handleEditClick = (comment) => {
    setEditingCommentId(comment.id);
    setEditingText(comment.text);
  };
  
  const handleUpdateComment = (e) => {
    e.preventDefault();
    const updatedComments = comments.map(comment => 
      comment.id === editingCommentId ? { ...comment, text: editingText } : comment
    );
    setComments(updatedComments);
    setEditingCommentId(null);
    setEditingText('');
    showToast('Komentar berhasil diperbarui.');
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!book) {
    return <Container><h2>Buku tidak ditemukan!</h2></Container>;
  }

  return (
    <Container>
      <Row className="my-4">
        <Col md={4}>
          <Image src={book.cover_url} fluid rounded />
        </Col>
        <Col md={8}>
          <h1>{book.judul}</h1>
          <h4 className="text-muted">oleh {book.author.nama_author}</h4>
          <hr />
          <h5>Sinopsis</h5>
          <p className="lead">{book.sinopsis || "Sinopsis tidak tersedia."}</p>
          <p><strong>Tahun Terbit:</strong> {book.tahun_terbit}</p>
          <p><strong>Genre:</strong> {(book.genres || []).join(', ')}</p>
          <p><strong>Rating:</strong> {book.avg_rating} ⭐</p>
        </Col>
      </Row>
      <hr className="my-5" />
      <Row>
        <Col>
          <h3>Komentar ({comments.length})</h3>
          <ListGroup variant="flush">
            {comments.map(comment => (
              <ListGroup.Item key={comment.id} className="ps-0">
                {editingCommentId === comment.id ? (
                  <Form onSubmit={handleUpdateComment} className="mt-2">
                    <Form.Control as="textarea" value={editingText} onChange={(e) => setEditingText(e.target.value)} rows={2}/>
                    <Button type="submit" size="sm" className="mt-2">Simpan</Button>
                    <Button variant="secondary" size="sm" className="mt-2 ms-2" onClick={() => setEditingCommentId(null)}>Batal</Button>
                  </Form>
                ) : (
                  <div className="d-flex justify-content-between align-items-start mt-1">
                    <div>
                      <strong>{comment.user.name}</strong>
                      <p className="mb-1">{comment.text}</p>
                    </div>
                    {user && user.name === comment.user.name && (
                      <div>
                        <Button variant="outline-secondary" size="sm" className="me-2" onClick={() => handleEditClick(comment)}>Edit</Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDeleteComment(comment.id)}>Hapus</Button>
                      </div>
                    )}
                  </div>
                )}
              </ListGroup.Item>
            ))}
          </ListGroup>
          <div className="mt-4">
            {user ? (
              <AddCommentForm onCommentSubmit={handleAddComment} />
            ) : (
              <p>Silakan <Link to="/login">login</Link> untuk memberi komentar.</p>
            )}
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default DetailPage;