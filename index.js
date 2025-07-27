const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const db = require('./config/db');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');
const authMiddleware = require('./middleware/authMiddleware');
const indexRoute = require('./routes/indexRoute');
const ejs = require('ejs');
const flash = require('connect-flash');
const authRoutes = require('./routes/authRoutes');
const multer = require('multer');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(express.urlencoded({ extended: false }));

// 2. Konfigurasi penyimpanan gambar
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/'); // Folder tujuan upload
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = file.originalname.split('.').pop();
        cb(null, 'sampul-' + uniqueSuffix + '.' + ext);
    }
});

// 3. Middleware upload
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(file.originalname.toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Hanya file gambar yang diperbolehkan!'));
    }
});

// Session
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false
}));

// Middleware untuk melempar session ke view
app.use((req, res, next) => {
    res.locals.session = req.session; // Sekarang bisa akses `session.user` di EJS
    next();
});

// Flash Message
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});

// Passport Config
passport.use(new LocalStrategy(async (username, password, done) => {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [username]);
    const user = result.rows[0];
    if (!user) return done(null, false, { message: 'Incorrect email.' });
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return done(null, false, { message: 'Incorrect password.' });
    return done(null, user);
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
});

// Gunakan EJS sebagai engine untuk file .html
app.engine('html', (filePath, options, callback) => {
    ejs.renderFile(filePath, options, { async: false }, callback);
});
app.set('view engine', 'html');
app.set('views', __dirname + '/views'); // Pastikan path benar

// Middleware lainnya (urlencoded, session, dll)
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

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

try {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
} catch (err) {
  console.error("Error starting server:", err);
  process.exit(1);
}