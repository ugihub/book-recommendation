const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');

// Halaman utama
router.get('/', bookController.getBooks);

module.exports = router;