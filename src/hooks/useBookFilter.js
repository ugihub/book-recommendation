// src/hooks/useBookFilter.js
import { useState, useMemo } from 'react';

// Custom hook adalah fungsi biasa yang namanya diawali 'use'
function useBookFilter(initialBooks, searchQuery, searchCategory) {
  // Semua state yang berhubungan dengan filter, sort, dan paginasi pindah ke sini
  const [activeGenre, setActiveGenre] = useState('Semua');
  const [sortMode, setSortMode] = useState('populer');
  const [currentPage, setCurrentPage] = useState(1);
  const [booksPerPage] = useState(8);

  // Ambil semua genre unik dari data
  const allGenres = useMemo(() => 
    ['Semua', ...new Set(initialBooks.flatMap(book => book.genres || []))]
  , [initialBooks]);

  // Gunakan useMemo untuk efisiensi. Logika ini hanya akan berjalan ulang
  // jika salah satu dari dependensinya (di array bawah) berubah.
  const filteredAndSortedBooks = useMemo(() => {
    return initialBooks
      .filter(book => {
        // Filter Genre
        if (activeGenre === 'Semua') return true;
        return book.genres && book.genres.includes(activeGenre);
      })
      .filter(book => {
        // Filter Pencarian
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        if (searchCategory === 'Judul') {
          return book.judul.toLowerCase().includes(query);
        } else if (searchCategory === 'Penulis') {
          return book.author.nama_author.toLowerCase().includes(query);
        } else {
          return book.judul.toLowerCase().includes(query) || 
                 book.author.nama_author.toLowerCase().includes(query);
        }
      })
      .sort((a, b) => {
        // Logika Pengurutan
        switch (sortMode) {
          case 'terbaru':
            return b.tahun_terbit - a.tahun_terbit;
          case 'judul-az':
            return a.judul.localeCompare(b.judul);
          case 'judul-za':
            return b.judul.localeCompare(a.judul);
          case 'populer':
          default:
            return b.avg_rating - a.avg_rating;
        }
      });
  }, [initialBooks, activeGenre, searchQuery, searchCategory, sortMode]);

  // Logika Paginasi
  const indexOfLastBook = currentPage * booksPerPage;
  const indexOfFirstBook = indexOfLastBook - booksPerPage;
  const paginatedBooks = filteredAndSortedBooks.slice(indexOfFirstBook, indexOfLastBook);

  // Fungsi-fungsi untuk mengubah state
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const handleFilterChange = (genre) => {
    setActiveGenre(genre);
    setCurrentPage(1);
  };
  const handleSortChange = (mode) => {
    setSortMode(mode);
    setCurrentPage(1);
  };

  // Kembalikan semua yang dibutuhkan oleh komponen UI
  return {
    paginatedBooks,
    allGenres,
    activeGenre,
    sortMode,
    currentPage,
    booksPerPage,
    totalBooks: filteredAndSortedBooks.length,
    handleFilterChange,
    handleSortChange,
    paginate
  };
}

export default useBookFilter;