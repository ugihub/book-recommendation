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

module.exports = { ensureAuthenticated, ensureAdmin, preventLoggedInAccess, ensureRole, ensureDailyBookLimit };
