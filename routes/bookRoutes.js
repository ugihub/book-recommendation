module.exports = function (upload) {
  const express = require('express');
  const router = express.Router();
  const bookController = require('../controllers/bookController');
  const { ensureAuthenticated, ensureRole, ensureDailyBookLimit, ensureBookOwnership, ensureDailyEditLimit } = require('../middleware/authMiddleware');
  // const uploadMiddleware = require('../middleware/uploadMiddleware'); // Removed duplicate, 'upload' is passed as argument

  router.get('/submit-book', ensureAuthenticated, ensureRole('member'), bookController.getSubmitBook);
  router.post('/submit', ensureAuthenticated, ensureRole('member'), ensureDailyBookLimit, upload.single('sampul'), bookController.postSubmitBook);

  // Tampilkan buku yang disetujui oleh member
  router.get('/my-books', ensureAuthenticated, ensureRole('member'), bookController.getMyApprovedBooks);

  // Detail buku
  router.get('/:id', bookController.getBookDetail);

  // Gunakan middleware di route edit
  router.get('/edit/:id', ensureAuthenticated, ensureBookOwnership, bookController.getEditBookForm);
  router.post('/edit/:id', ensureAuthenticated, ensureBookOwnership, ensureDailyEditLimit, upload.single('sampul'), bookController.postEditBook);
  
  return router;
};