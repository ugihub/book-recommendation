import { useState, useEffect } from 'react'; // Tambahkan useState
import { mockBooks } from '../data/mockData';
import BookCard from '../components/BookCard';
import PaginationComponent from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import { Row, Col, Container, Button, Dropdown, DropdownButton } from 'react-bootstrap';
import useBookFilter from '../hooks/useBookFilter'; // 1. Impor custom hook kita

// Terima prop searchQuery dan searchCategory dari App.jsx
function HomePage({ searchQuery, searchCategory }) {

  // 2. Panggil hook kita dalam satu baris untuk mendapatkan semua data dan fungsi!
  const {
    paginatedBooks,
    allGenres,
    activeGenre,
    sortMode,
    currentPage,
    booksPerPage,
    totalBooks,
    handleFilterChange,
    handleSortChange,
    paginate
  } = useBookFilter(mockBooks, searchQuery, searchCategory);

  // Logika loading tetap di sini karena ini berhubungan dengan UI
  // Anda bisa menghapusnya jika tidak ingin menggunakan fitur loading lagi
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500); // Waktu loading lebih cepat
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Bagian return JSX tetap sama persis, tidak ada yang berubah!
  return (
    <Container fluid>
      <div className="mb-5">
        <h2 className="mb-3 border-start border-4 border-warning ps-2">Jelajahi Genre</h2>
        {allGenres.map(genre => (
          <Button 
            key={genre}
            variant={activeGenre === genre ? "warning" : "outline-warning"}
            className="me-2 mb-2"
            onClick={() => handleFilterChange(genre)}
          >
            {genre}
          </Button>
        ))}
      </div>
      
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="border-start border-4 border-warning ps-2 mb-0">
          Hasil Pencarian ({totalBooks})
        </h2>
        <DropdownButton
          id="dropdown-sort"
          title={`Urutkan: ${sortMode.charAt(0).toUpperCase() + sortMode.slice(1)}`}
          variant="outline-warning"
          onSelect={handleSortChange}
        >
          <Dropdown.Item eventKey="populer">Populer (Rating)</Dropdown.Item>
          <Dropdown.Item eventKey="terbaru">Terbaru</Dropdown.Item>
          <Dropdown.Item eventKey="judul-az">Judul (A-Z)</Dropdown.Item>
          <Dropdown.Item eventKey="judul-za">Judul (Z-A)</Dropdown.Item>
        </DropdownButton>
      </div>
      
      <Row>
        {paginatedBooks.length > 0 ? (
          paginatedBooks.map(book => (
            <Col key={book.id} sm={6} md={4} lg={3} className="mb-4">
              <BookCard book={book} />
            </Col>
          ))
        ) : (
          <p className="text-muted">Tidak ada buku yang cocok dengan kriteria Anda.</p>
        )}
      </Row>

      <PaginationComponent 
        itemsPerPage={booksPerPage}
        totalItems={totalBooks}
        paginate={paginate}
        currentPage={currentPage}
      />
    </Container>
  );
}

export default HomePage;