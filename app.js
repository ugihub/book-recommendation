require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const db = require('./config/db');
const path = require('path');
const fs = require('fs');
const ejs = require('ejs');
const flash = require('connect-flash');
const upload = require('./middleware/uploadMiddleware');

const indexRoute = require('./routes/indexRoute');
const authRoutes = require('./routes/authRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'public/uploads';
const fullUploadPath = path.join(__dirname, UPLOAD_DIR);
if (!fs.existsSync(fullUploadPath)) {
    fs.mkdirSync(fullUploadPath, { recursive: true });
}

app.engine('html', ejs.renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_secret_for_development_only_change_this_in_production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.session = req.session;
    next();
});

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

// Routes
app.use('/', adminRoutes); // ✅ Pastikan route ini ada
app.use('/', indexRoute);
app.use('/', authRoutes);
app.use('/', reviewRoutes);
app.use('/reviews', authMiddleware.ensureAuthenticated, reviewRoutes);
app.use('/admin', authMiddleware.ensureRole('admin'), adminRoutes);

const bookRoutes = require('./routes/bookRoutes')(upload); // Kirim upload ke route
app.use('/books', bookRoutes);

const profileRoutes = require('./routes/profileRoutes');
app.use('/', profileRoutes);

app.listen(PORT, () => {
    console.log(`🟢 Server AKSARARIA berjalan di http://localhost:${PORT}`);
    console.log(`🔧 Lingkungan: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📂 Direktori kerja: ${__dirname}`);
    console.log(`📂 Direktori upload: ${fullUploadPath}`);
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