// controllers/authController.js
const db = require('../config/db');

const bcrypt = require('bcryptjs');

// Halaman Login
exports.getLogin = (req, res) => {
    res.render('login', {});
};

// Halaman Register
exports.getRegister = (req, res) => {
    res.render('register', {});
};

// Proses Register
exports.postRegister = async (req, res) => {
    const { nama, email, password } = req.body;

    try {
        const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            req.flash('error_msg', 'Email sudah terdaftar');
            return res.redirect('/register');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(
            'INSERT INTO users (nama, email, password_hash, role) VALUES ($1, $2, $3, $4)',
            [nama, email, hashedPassword, 'user']
        );

        req.flash('success_msg', 'Registrasi berhasil, silakan login');
        res.redirect('/login');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Terjadi kesalahan');
        res.redirect('/register');
    }
};

// Proses Login
exports.postLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            req.flash('error_msg', 'Email atau password salah');
            return res.redirect('/login');
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            req.flash('error_msg', 'Email atau password salah');
            return res.redirect('/login');
        }

        req.session.user = user;
        req.flash('success_msg', 'Login berhasil');
        res.redirect('/');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Terjadi kesalahan');
        res.redirect('/login');
    }
};

// Logout
exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/');
        }
        res.redirect('/');
    });
};