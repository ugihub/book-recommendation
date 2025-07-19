module.exports = function (upload) {
  const express = require('express');
  const router = express.Router();
  const bookController = require('../controllers/bookController');
  const { ensureAuthenticated, ensureRole, ensureDailyBookLimit } = require('../middleware/authMiddleware');

  router.get('/submit-book', ensureAuthenticated, ensureRole('member'), bookController.getSubmitBook);
  router.post('/submit', ensureAuthenticated, ensureRole('member'), ensureDailyBookLimit, upload.single('sampul'), bookController.postSubmitBook);

  // Detail buku
  router.get('/:id', bookController.getBookDetail);

  return router;
};