const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { ensureAuthenticated, ensureRole, ensureDailyBookLimit, ensureBookOwnership } = require('../middleware/authMiddleware');
const { upload, uploadErrorHandler } = require('../middleware/upload');

// --- Route yang BISA diakses TANPA login ---
// Detail buku - TIDAK memerlukan autentikasi
router.get('/:id', bookController.getBookDetail);

// --- Route yang HARUS LOGIN dan memiliki role 'member' ---
// Tampilkan form submit buku
router.get('/submit-book', ensureAuthenticated, ensureRole('member'), bookController.getSubmitBook);

// Proses submit buku dengan batas harian
router.post('/submit-book',
  ensureAuthenticated,
  ensureRole('member'),
  ensureDailyBookLimit,
  upload.single('sampul'),
  uploadErrorHandler,
  bookController.postSubmitBook
);

// Tampilkan buku yang disetujui milik member
router.get('/my-books', ensureAuthenticated, ensureRole('member'), bookController.getMyApprovedBooks);

// --- Route untuk Edit Buku (Harus login dan memiliki akses) ---
// Tampilkan form edit buku
router.get('/edit/:id', ensureAuthenticated, ensureBookOwnership, bookController.getEditBookForm);

// Proses edit buku
router.post('/edit/:id',
  ensureAuthenticated,
  ensureBookOwnership,
  upload.single('sampul'),
  uploadErrorHandler,
  bookController.postEditBook
);

module.exports = router;