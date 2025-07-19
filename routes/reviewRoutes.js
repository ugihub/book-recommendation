const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

// Submit rating
router.post('/ratings/submit', ensureAuthenticated, reviewController.submitRating);

// Submit komentar
router.post('/reviews/submit', ensureAuthenticated, reviewController.submitReview);

module.exports = router;