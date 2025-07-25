const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');

// Middleware validasi password
const validatePassword = [
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password minimal 6 karakter'),
  body('oldPassword').notEmpty().withMessage('Password lama harus diisi'),
];

// Route Profil
router.get('/profile', ensureAuthenticated, profileController.getProfile);
router.post('/profile/reset-password', ensureAuthenticated, validatePassword, profileController.resetPassword);
router.post('/profile/delete', ensureAuthenticated, profileController.deleteAccount);

module.exports = router;