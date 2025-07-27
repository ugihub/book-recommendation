const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const db = require('./config/db');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');
const profileRoutes = require('./routes/profileRoutes');
const authMiddleware = require('./middleware/authMiddleware');
const indexRoute = require('./routes/indexRoute');
const ejs = require('ejs');
const flash = require('connect-flash');
const authRoutes = require('./routes/authRoutes');
const multer = require('multer');
const path = require('path'); // Tambahkan ini untuk mengelola path
const fs = require('fs'); // Tambahkan ini untuk debugging

const app = express();

// 1. Konfigurasi view engine dengan benar
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 2. Middleware dasar
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(flash());

// 3. Session configuration - hanya satu kali
app.use(session({
    secret: process.env.SESSION_SECRET || 'rahasia123456789',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    }
}));

// 4. Passport setup
app.use(passport.initialize());
app.use(passport.session());

// 5. Middleware untuk melempar session ke view
app.use((req, res, next) => {
    res.locals.session = req.session;
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});

// 6. Passport Config
passport.use(new LocalStrategy(async (username, password, done) => {
    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [username]);
        const user = result.rows[0];
        if (!user) return done(null, false, { message: 'Incorrect email.' });

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) return done(null, false, { message: 'Incorrect password.' });

        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        done(null, result.rows[0]);
    } catch (err) {
        done(err);
    }
});

// 7. Konfigurasi penyimpanan gambar
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'public', 'uploads');

        // Pastikan direktori ada
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'sampul-' + uniqueSuffix + ext);
    }
});

// 8. Middleware upload
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Hanya file gambar yang diperbolehkan (jpeg, jpg, png, gif)'));
    }
});

// 9. Debugging middleware untuk view
app.use((req, res, next) => {
    const originalRender = res.render;

    res.render = function (view, options, callback) {
        const viewPath = path.join(app.get('views'), view + '.ejs');

        // Log untuk debugging
        console.log('Rendering view:', view);
        console.log('View path:', viewPath);
        console.log('File exists:', fs.existsSync(viewPath));

        // Cek apakah file ada
        if (!fs.existsSync(viewPath)) {
            try {
                // Coba cek struktur direktori
                const viewsDir = path.join(__dirname, 'views');
                const adminDir = fs.existsSync(path.join(viewsDir, 'admin')) ?
                    fs.readdirSync(path.join(viewsDir, 'admin')) : [];

                console.log('Views directory:', viewsDir);
                console.log('Admin directory contents:', adminDir);
            } catch (err) {
                console.error('Error checking directory:', err);
            }
        }

        return originalRender.call(this, view, options, callback);
    };

    next();
});

// 11. Admin routes harus didefinisikan setelah bookRoutes
const bookRoutes = require('./routes/bookRoutes')(upload);
app.use('/admin', authMiddleware.ensureRole('admin'), adminRoutes);

// 10. Routes
app.use('/', indexRoute);
app.use('/', authRoutes);
app.use('/', reviewRoutes);
app.use('/reviews', authMiddleware.ensureAuthenticated, reviewRoutes);
app.use('/books', bookRoutes);
app.use('/', profileRoutes);


// 12. Error handling untuk view tidak ditemukan
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    if (err.message.includes('Failed to lookup view')) {
        res.status(500).send(`
      <h1>Error: View tidak ditemukan</h1>
      <p>Harap pastikan:</p>
      <ul>
        <li>File view ada di direktori views/</li>
        <li>Ekstensi file adalah .ejs</li>
        <li>Struktur folder benar (misal: views/admin/bookEdits.ejs)</li>
        <li>Nama file tidak case-sensitive (Railway menggunakan Linux)</li>
      </ul>
      <p>Error detail: ${err.message}</p>
    `);
    } else {
        next(err);
    }
});

// 13. Error handling 404
app.use((req, res) => {
    res.status(404).render('404', { title: 'Halaman Tidak Ditemukan' });
});

// 14. Jalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
    console.log(`Lingkungan: ${process.env.NODE_ENV || 'development'}`);

    // Verifikasi struktur view
    const viewsDir = path.join(__dirname, 'views', 'admin');
    try {
        const adminViews = fs.readdirSync(viewsDir);
        console.log('Admin views:', adminViews);
    } catch (err) {
        console.error('Error membaca direktori views/admin:', err);
    }
});