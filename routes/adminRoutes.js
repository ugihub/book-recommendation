// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { ensureAuthenticated, ensureRole } = require('../middleware/authMiddleware');

// Panel Admin
router.get('/admin/pending-books', ensureAuthenticated, ensureRole('admin'), adminController.getPendingBooks);
router.get('/admin/approved-books', ensureAuthenticated, ensureRole('admin'), adminController.getApprovedBooks);
router.post('/admin/approve-book/:id', ensureAuthenticated, ensureRole('admin'), adminController.approveBook);
router.post('/admin/reject-book/:id', ensureAuthenticated, ensureRole('admin'), adminController.rejectBook);
router.post('/delete-book/:id', ensureAuthenticated, ensureRole('admin'), adminController.deleteBook);

// Kelola Pengguna
router.get('/admin/users', ensureAuthenticated, ensureRole('admin'), adminController.getManageUsers);
router.post('/admin/users/promote/:id', ensureAuthenticated, ensureRole('admin'), adminController.promoteToMember);

// Suspend dan Batalkan Suspend Anggota
router.post('/suspend-member/:id', ensureAuthenticated, ensureRole('admin'), adminController.suspendMember);
router.post('/demote-member/:id', ensureAuthenticated, ensureRole('admin'), adminController.demoteMember);

// Routes edit
router.get('/book-edits', ensureAuthenticated, ensureRole('admin'), adminController.getPendingEdits);
router.post('/book-edits/:id/approve', adminController.approveBookEdit);
router.post('/book-edits/:id/reject', adminController.rejectBookEdit);

module.exports = router;