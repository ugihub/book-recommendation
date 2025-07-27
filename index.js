// index.js
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const db = require('./config/db');
const flash = require('connect-flash');
const path = require('path');

const app = express();

// 1. Konfigurasi view engine
app.engine('html', (filePath, options, callback) => {
  ejs.renderFile(filePath, options, { async: false }, callback);
});
app.set('view engine', 'html');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 2. Middleware dasar
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// 3. Konfigurasi session
app.use(session({
    secret: process.env.SESSION_SECRET || 'rahasia123456789',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 jam
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    }
}));

// 4. Middleware passport
app.use(passport.initialize());
app.use(passport.session());

// 5. Middleware flash messages
app.use(flash());

// 6. Middleware untuk melempar session dan flash ke view
app.use((req, res, next) => {
    res.locals.session = req.session;
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});

// 7. Passport Config
passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
        try {
            const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
            const user = result.rows[0];

            if (!user) {
                return done(null, false, { message: 'Email tidak ditemukan.' });
            }

            const isValid = await bcrypt.compare(password, user.password_hash);
            if (!isValid) {
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

// 8. Import routes
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const profileRoutes = require('./routes/profileRoutes');
const { ensureAuthenticated, ensureRole } = require('./middleware/authMiddleware');

// 9. Routes dengan handler yang benar
app.get('/', (req, res) => {
    res.render('index', { title: 'Beranda - AKSARARIA' });
});

app.use('/', authRoutes);
app.use('/books', bookRoutes);
app.use('/admin', ensureRole(['admin']), adminRoutes);
app.use('/reviews', ensureAuthenticated, reviewRoutes);
app.use('/profile', ensureAuthenticated, profileRoutes);

// 10. Error handling 404
app.use((req, res) => {
    res.status(404).render('404', {
        title: 'Halaman Tidak Ditemukan - AKSARARIA',
        session: req.session
    });
});

// 11. Jalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🟢 Server AKSARARIA berjalan di http://localhost:${PORT}`);
    console.log(`🔧 Lingkungan: ${process.env.NODE_ENV || 'development'}`);
});