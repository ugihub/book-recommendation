import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // 1. Impor useAuth

function BookCard({ book }) {
  // 2. Ambil data dan fungsi Booklist dari context
  const { booklist, toggleBooklist } = useAuth();
  
  // 3. Cek apakah buku ini ada di dalam Booklist
  const isBookInList = booklist.includes(book.id);

  return (
    <Card className="imdb-card h-100">
      <div style={{ position: 'relative' }}>
        <Card.Img variant="top" src={book.cover_url} style={{ height: '350px', objectFit: 'cover' }} />
        
        {/* 4. Tombol Bookmark */}
        <div 
          onClick={() => toggleBooklist(book.id)}
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: '10px', 
            cursor: 'pointer',
            fontSize: '3rem', // Ukuran ikon
            color: isBookInList ? '#F59E0B' : '#fff', // Warna berubah
            textShadow: '2px 2px 4px rgba(0,0,0,0.7)'
          }}
        >
          {isBookInList ? '🔖' : '➕'} 
        </div>
      </div>
      <Card.Body className="d-flex flex-column">
        <Card.Title>{book.judul}</Card.Title>
        <Card.Text>{book.author.nama_author}</Card.Text>
        <Link to={`/buku/${book.id}`} className="btn btn-primary mt-auto">
          Lihat Detail
        </Link>
      </Card.Body>
    </Card>
  );
}

export default BookCard;