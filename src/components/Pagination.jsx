// src/components/Pagination.jsx
import { Pagination } from 'react-bootstrap';

function PaginationComponent({ itemsPerPage, totalItems, paginate, currentPage }) {
  const pageNumbers = [];

  for (let i = 1; i <= Math.ceil(totalItems / itemsPerPage); i++) {
    pageNumbers.push(i);
  }

  // Jangan tampilkan paginasi jika hanya ada 1 halaman atau kurang
  if (pageNumbers.length <= 1) {
    return null;
  }

  return (
    <nav>
      <Pagination className="justify-content-center">
        {pageNumbers.map(number => (
          <Pagination.Item key={number} active={number === currentPage} onClick={() => paginate(number)}>
            {number}
          </Pagination.Item>
        ))}
      </Pagination>
    </nav>
  );
}

export default PaginationComponent;