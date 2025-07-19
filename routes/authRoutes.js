const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { preventLoggedInAccess } = require('../middleware/authMiddleware');

router.get('/login', preventLoggedInAccess, authController.getLogin);
router.post('/login', preventLoggedInAccess, authController.postLogin);
router.get('/register', preventLoggedInAccess, authController.getRegister);
router.post('/register', preventLoggedInAccess, authController.postRegister);
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.redirect('/');
    res.redirect('/');
  });
});

module.exports = router;