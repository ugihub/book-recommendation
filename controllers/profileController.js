const db = require('../config/db');
const bcrypt = require('bcryptjs'); // ✅ Tambahkan ini

exports.getProfile = async (req, res) => {
    const userId = req.session.user.id;
    try {
        const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
        const user = result.rows[0];
        res.render('profile', { user });
    } catch (err) {
        req.flash('error_msg', 'Gagal memuat profil.');
        res.redirect('/');
    }
};

exports.resetPassword = async (req, res) => {
    const userId = req.session.user.id;
    const { oldPassword, newPassword } = req.body;

    try {
        const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
        const user = result.rows[0];
        const isMatch = await bcrypt.compare(oldPassword, user.password_hash);

        if (!isMatch) {
            req.flash('error_msg', 'Password lama salah.');
            return res.redirect('/profile');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, userId]);
        req.flash('success_msg', 'Password berhasil diubah.');
    } catch (err) {
        req.flash('error_msg', 'Gagal mengubah password.');
        console.error(err);
    }

    res.redirect('/profile');
};

exports.deleteAccount = async (req, res) => {
    const userId = req.session.user.id;

    try {
        await db.query('DELETE FROM users WHERE id = $1', [userId]);
        req.session.destroy(() => {
            req.flash('success_msg', 'Akun Anda berhasil dihapus.');
            res.redirect('/');
        });
    } catch (err) {
        req.flash('error_msg', 'Gagal menghapus akun.');
        console.error(err);
        res.redirect('/profile');
    }
};