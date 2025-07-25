const db = require('../config/db');

// Tambahkan validasi input
exports.submitReview = async (req, res) => {
    const { book_id, rating, ulasan, reviewer_name, anonymous } = req.body;
    const user = req.session.user;

    if (!book_id || !rating) {
        req.flash('error_msg', 'Rating harus diisi.');
        return res.redirect(`/books/${book_id}`);
    }

    try {
        await db.query(
            `INSERT INTO reviews (user_id, book_id, rating, ulasan, reviewer_name, anonymous, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [user.id, book_id, rating, ulasan || null, reviewer_name || user.nama, anonymous === 'true', 'approved']
        );

        req.flash('success_msg', 'Rating/ulasan berhasil dikirim.');
    } catch (err) {
        req.flash('error_msg', 'Gagal mengirim rating/ulasan.');
        console.error(err);
    }

    res.redirect(`/books/${book_id}`);
};