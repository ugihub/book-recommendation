const db = require('../config/db');

function ensureAuthenticated(req, res, next) {
    if (req.session.user) return next();
    req.flash('error_msg', 'Silakan login terlebih dahulu');
    res.redirect('/login');
}

function ensureRole(role) {
    return async (req, res, next) => {
        const user = req.session.user;
        if (!user) {
            req.flash('error_msg', 'Silakan login terlebih dahulu');
            return res.redirect('/login');
        }

        if (user.role !== role) {
            req.flash('error_msg', 'Akses ditolak: Anda tidak memiliki izin.');
            return res.redirect('/');
        }

        // ✅ Cek apakah user ditangguhkan
        if (user.role === 'member' && user.suspended_until) {
            const now = new Date();
            const suspendedUntil = new Date(user.suspended_until);

            if (now < suspendedUntil) {
                req.flash('error_msg', `Anda sedang ditangguhkan sampai ${suspendedUntil.toLocaleString()}`);
                return res.redirect('/');
            } else {
                // ✅ Hilangkan status suspended jika sudah lewat durasi
                const db = require('../config/db');
                await db.query(
                    `UPDATE users SET suspended_until = $1, suspension_reason = $2 WHERE id = $3`,
                    [null, null, user.id]
                );
            }
        }

        next();
    };
}

async function ensureDailyBookLimit(req, res, next) {
    const user = req.session.user;
    const userResult = await db.query('SELECT suspended_until FROM users WHERE id = $1', [user.id]);
    const suspendedUntil = userResult.rows[0]?.suspended_until;

    // ✅ Cek apakah user sedang ditangguhkan
    if (suspendedUntil && new Date() < new Date(suspendedUntil)) {
        req.flash('error_msg', 'Anda sedang ditangguhkan dan tidak bisa submit buku.');
        return res.redirect('/');
    }

    // ✅ Cek jumlah submit buku per hari
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const result = await db.query(
        `SELECT COUNT(*) FROM book_submissions 
     WHERE submitter_id = $1 AND created_at BETWEEN $2 AND $3`,
        [user.id, todayStart, todayEnd]
    );

    const submissionCount = parseInt(result.rows[0].count, 10);
    if (submissionCount >= 5) {
        req.flash('error_msg', 'Batas maksimal 5 buku per hari telah tercapai.');
        return res.redirect('/submit-book');
    }

    next();
}

function ensureAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') return next();
    req.flash('error_msg', 'Akses ditolak: Anda bukan admin');
    res.redirect('/');
}

function preventLoggedInAccess(req, res, next) {
    if (req.session.user) {
        req.flash('error_msg', 'Anda sudah login');
        return res.redirect('/');
    }
    next();
}

// Middleware untuk memastikan buku milik member
async function ensureBookOwnership(req, res, next) {
    const bookId = req.params.id;
    const userId = req.session.user?.id;

    if (!userId) {
        req.flash('error_msg', 'Silakan login terlebih dahulu.');
        return res.redirect('/login');
    }

    try {
        const result = await db.query(`
      SELECT * FROM books 
      WHERE id = $1 AND submitter_id = $2
    `, [bookId, userId]);

        if (result.rows.length === 0) {
            req.flash('error_msg', 'Anda tidak memiliki akses ke buku ini.');
            return res.redirect('/books/my-books');
        }

        req.book = result.rows[0]; // Tambahkan data buku ke req
        next();
    } catch (err) {
        req.flash('error_msg', 'Terjadi kesalahan.');
        res.redirect('/');
    }
}

// Middleware untuk membatasi jumlah edit per hari (3x/hari)
async function ensureDailyEditLimit(req, res, next) {
    const userId = req.session.user.id;
    const bookId = req.params.id;

    try {
        // Hitung jumlah edit yang diajukan hari ini untuk buku ini
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const result = await db.query(`
      SELECT COUNT(*) FROM book_edits
      WHERE submitter_id = $1 AND book_id = $2 AND submitted_at >= $3
    `, [userId, bookId, todayStart]);

        const editCount = parseInt(result.rows[0].count, 10);

        if (editCount >= 3) {
            req.flash('error_msg', 'Anda hanya bisa mengajukan maksimal 3 perubahan per hari untuk buku ini.');
            return res.redirect(`/books/edit/${bookId}`);
        }

        next();
    } catch (err) {
        console.error('Error saat memeriksa batas edit:', err);
        req.flash('error_msg', 'Gagal memeriksa batas harian edit.');
        res.redirect(`/books/edit/${bookId}`);
    }
}

// Validasi rating wajib diisi
function validateRatingOrReview(req, res, next) {
    const { rating, ulasan } = req.body;
    if (!rating || rating < 1 || rating > 5) {
        req.flash('error_msg', 'Rating harus diisi dengan angka 1-5.');
        return res.redirect(`/books/${req.body.book_id}`);
    }

    // Jika tidak ada ulasan, pastikan rating ada
    if (!ulasan) {
        req.body.ulasan = null;
    }

    next();
}

function ensureProfileOwnership(req, res, next) {
    const userId = req.session.user.id;
    const profileId = req.params.id;

    if (userId != profileId) {
        req.flash('error_msg', 'Anda tidak memiliki akses ke profil ini.');
        return res.redirect('/');
    }

    next();
}

module.exports = {
    ensureAuthenticated,
    ensureAdmin,
    preventLoggedInAccess,
    ensureRole,
    ensureDailyBookLimit,
    ensureBookOwnership,
    ensureDailyEditLimit,
    validateRatingOrReview,
    ensureProfileOwnership
};
