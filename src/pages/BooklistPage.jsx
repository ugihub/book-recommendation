import { Container, Row, Col } from 'react-bootstrap';
import { useAuth } from '../hooks/useAuth';
import { mockBooks } from '../data/mockData';
import BookCard from '../components/BookCard';

function BooklistPage() {
  const { booklist } = useAuth();

  // Filter buku utama berdasarkan ID yang ada di booklist
  const booklistBooks = mockBooks.filter(book => booklist.includes(book.id));

  return (
    <Container>
      <h2 className="mb-4 border-start border-4 border-warning ps-2">Booklist Saya ({booklistBooks.length})</h2>
      <Row>
        {booklistBooks.length > 0 ? (
          booklistBooks.map(book => (
            <Col key={book.id} sm={6} md={4} lg={3} className="mb-4">
              <BookCard book={book} />
            </Col>
          ))
        ) : (
          <p className="text-muted">Booklist Anda masih kosong. Tambahkan buku favoritmu!</p>
        )}
      </Row>
    </Container>
  );
}

export default BooklistPage;