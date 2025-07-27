// index.js - Versi Final untuk Railway

// 0. Muat environment variables terlebih dahulu
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const db = require('./config/db');
const path = require('path');
const fs = require('fs'); // Tambahkan fs untuk memastikan direktori ada
const ejs = require('ejs'); // Tambahkan ejs untuk konfigurasi engine

// --- Middleware ---
const flash = require('connect-flash');

// --- Routes ---
const indexRoute = require('./routes/indexRoute');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const bookRoutes = require('./routes/bookRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');

// --- Middleware Auth ---
const authMiddleware = require('./middleware/authMiddleware');

const app = express();

// --- 1. Konfigurasi Dasar dan Direktori ---
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'public/uploads';

// Pastikan direktori uploads ada (penting untuk Railway)
const fullUploadPath = path.join(__dirname, UPLOAD_DIR);
if (!fs.existsSync(fullUploadPath)) {
    console.log(`Membuat direktori upload: ${fullUploadPath}`);
    fs.mkdirSync(fullUploadPath, { recursive: true });
}

// --- 2. Konfigurasi View Engine untuk .html (Tanpa Layouts) ---
app.engine('html', ejs.renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));

// --- 3. Middleware dasar ---
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- 4. Konfigurasi Session ---
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_secret_for_development_only_change_this_in_production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 jam
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' // Hanya untuk HTTPS di produksi (Railway)
    }
}));

// --- 5. Middleware Passport ---
app.use(passport.initialize());
app.use(passport.session());

// --- 6. Middleware Flash Messages ---
app.use(flash());

// --- 7. Middleware untuk melempar data ke views ---
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.session = req.session;
    next();
});

// --- 8. Passport Config ---
passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
        try {
            const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
            const user = result.rows[0];

            if (!user) {
                return done(null, false, { message: 'Email tidak ditemukan.' });
            }

            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return done(null, false, { message: 'Password salah.' });
            }

            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        const user = result.rows[0];
        done(null, user);
    } catch (err) {
        done(err);
    }
});

// --- 9. Routes ---
// Route dasar
app.use('/', indexRoute);

// Route autentikasi
app.use('/', authRoutes);

// Route profil pengguna (harus login)
app.use('/', authMiddleware.ensureAuthenticated, profileRoutes);

// Route buku (HANYA route yang memerlukan login yang dilindungi)
app.use('/books', bookRoutes);

// Route ulasan (harus login)
app.use('/reviews', authMiddleware.ensureAuthenticated, reviewRoutes);

// Route admin (harus admin)
app.use('/admin', authMiddleware.ensureAuthenticated, authMiddleware.ensureRole('admin'), adminRoutes);

// --- 10. Error handling untuk route tidak ditemukan (404) ---
app.use((req, res) => {
    console.log(`404 Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).render('404', {
        title: 'Halaman Tidak Ditemukan - AKSARARIA',
        session: req.session
    });
});

// --- 11. Error handling untuk server error (500) ---
app.use((err, req, res, next) => {
    console.error('🚨 Server Error Middleware:', err.stack);
    req.flash('error_msg', 'Terjadi kesalahan pada server.');
    res.status(500).render('500', {
        title: 'Kesalahan Server - AKSARARIA',
        session: req.session
    });
});

// --- 12. Jalankan server ---
app.listen(PORT, () => {
    console.log(`🟢 Server AKSARARIA berjalan di http://localhost:${PORT}`);
    console.log(`🔧 Lingkungan: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📂 Direktori kerja: ${__dirname}`);
    console.log(`📂 Direktori upload: ${fullUploadPath}`);

    // Tes koneksi database sederhana saat startup
    db.pool.query('SELECT NOW()', (err, res) => {
        if (err) {
            console.error('❌ Gagal menghubungi database saat startup:', err.message);
        } else {
            console.log('✅ Koneksi database berhasil saat startup.');
        }
    });
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} sedang digunakan.`);
    } else {
        console.error(`❌ Gagal memulai server:`, err.message);
    }
});