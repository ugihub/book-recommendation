const db = require('../config/db');

// Submit Rating
exports.submitRating = async (req, res) => {
    const { book_id, rating } = req.body;
    const user = req.session.user;

    if (!book_id || !rating) {
        req.flash('error_msg', 'Rating harus diisi.');
        return res.redirect(`/books/${book_id}`);
    }

    try {
        await db.query(
            `INSERT INTO reviews (user_id, book_id, rating, ulasan, status, reviewer_name, anonymous)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [user.id, book_id, rating, null, 'approved', user.nama, false]
        );
        req.flash('success_msg', 'Rating berhasil dikirim.');
    } catch (err) {
        req.flash('error_msg', 'Gagal mengirim rating.');
        console.error(err);
    }

    res.redirect(`/books/${book_id}`);
};

// Submit Komentar
exports.submitReview = async (req, res) => {
    const { book_id, ulasan, reviewer_name, anonymous } = req.body;
    const user = req.session.user;

    if (!book_id || !ulasan) {
        req.flash('error_msg', 'Komentar harus diisi.');
        return res.redirect(`/books/${book_id}`);
    }

    try {
        await db.query(
            `INSERT INTO reviews (user_id, book_id, rating, ulasan, status, reviewer_name, anonymous)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [user.id, book_id, null, ulasan, 'approved', reviewer_name || user.nama, anonymous === 'true']
        );
        req.flash('success_msg', 'Komentar berhasil dikirim.');
    } catch (err) {
        req.flash('error_msg', 'Gagal mengirim komentar.');
        console.error(err);
    }

    res.redirect(`/books/${book_id}`);
};