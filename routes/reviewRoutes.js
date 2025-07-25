const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { ensureAuthenticated, validateRatingOrReview } = require('../middleware/authMiddleware');

// Update route untuk menggunakan validasi
router.post('/reviews/submit', ensureAuthenticated, validateRatingOrReview, reviewController.submitReview);

module.exports = router;