// routes/bookRoutes.js
const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { ensureAuthenticated, ensureRole, ensureDailyBookLimit, ensureBookOwnership } = require('../middleware/authMiddleware');
const { upload, uploadErrorHandler } = require('../middleware/upload');

// Tampilkan form submit buku
router.get('/submit-book', ensureAuthenticated, ensureRole('member'), bookController.getSubmitBook);

// Proses submit buku dengan batas harian
router.post('/submit-book',
  ensureAuthenticated,
  ensureRole('member'),
  ensureDailyBookLimit,
  upload.single('sampul'),
  bookController.postSubmitBook,
  uploadErrorHandler
);

// Tampilkan buku yang disetujui milik member
router.get('/my-books', ensureAuthenticated, ensureRole('member'), bookController.getMyApprovedBooks);

// Detail buku
router.get('/:id', bookController.getBookDetail);

// Gunakan middleware di route edit
router.get('/edit/:id', ensureAuthenticated, ensureBookOwnership, bookController.getEditBookForm);
router.post('/edit/:id',
  ensureAuthenticated,
  ensureBookOwnership,
  upload.single('sampul'),
  bookController.postEditBook,
  uploadErrorHandler
);

module.exports = router;