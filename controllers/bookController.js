const db = require('../config/db');
// Gunakan middleware upload yang sudah ada, bukan membuat instance multer baru
const { upload, uploadErrorHandler } = require('../middleware/upload');

exports.getBooks = async (req, res) => {
    const { search, sort } = req.query;

    // Query dasar
    let query = `
    SELECT b.id, b.judul, b.penulis, b.genre, b.tahun_terbit, b.sampul_url,
    ROUND((SELECT AVG(rating) FROM reviews WHERE book_id = b.id AND status = 'approved'), 1) AS avg_rating
    FROM books b
    WHERE TRUE
  `;

    const params = [];
    let paramIndex = 1;

    // Tambahkan pencarian
    if (search) {
        query += ` AND (b.judul ILIKE $${paramIndex} OR b.penulis ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
    }

    // Tambahkan sortir
    switch (sort) {
        case 'rating_desc':
            query += ` ORDER BY avg_rating DESC NULLS LAST`;
            break;
        case 'rating_asc':
            query += ` ORDER BY avg_rating ASC NULLS FIRST`;
            break;
        case 'judul_asc':
            query += ` ORDER BY b.judul ASC`;
            break;
        case 'judul_desc':
            query += ` ORDER BY b.judul DESC`;
            break;
        case 'penulis_asc':
            query += ` ORDER BY b.penulis ASC`;
            break;
        case 'penulis_desc':
            query += ` ORDER BY b.penulis DESC`;
            break;
        case 'tahun_desc':
            query += ` ORDER BY b.tahun_terbit DESC NULLS LAST`;
            break;
        case 'tahun_asc':
            query += ` ORDER BY b.tahun_terbit ASC NULLS FIRST`;
            break;
        default:
            query += ` ORDER BY avg_rating DESC NULLS LAST`;
    }

    try {
        const result = await db.query(query, params);

        // Proses avg_rating untuk memastikan tipe data yang benar
        const processedBooks = result.rows.map(book => ({
            ...book,
            avg_rating: book.avg_rating !== null ? parseFloat(book.avg_rating) : null
        }));

        res.render('index', { // Pastikan file view adalah index.html
            title: 'Beranda - AKSARARIA',
            books: processedBooks, // Gunakan array yang sudah diproses
            search: search || '',
            sort: sort || ''
        });
    } catch (err) {
        console.error("Error in getBooks:", err); // Log error detail
        req.flash('error_msg', 'Gagal memuat daftar buku.');
        res.redirect('/');
    }
};

exports.getBookDetail = async (req, res) => {
    const bookId = req.params.id;

    try {
        const bookResult = await db.query(`
      SELECT 
        b.id, b.judul, b.penulis, b.genre, b.tahun_terbit, b.deskripsi, b.sampul_url,
        b.link_baca_beli, b.awards,
        ROUND((SELECT AVG(rating) FROM reviews r WHERE r.book_id = b.id AND r.status = 'approved'), 1) AS avg_rating,
        (SELECT COUNT(*) FROM reviews r WHERE r.book_id = b.id AND r.status = 'approved') AS total_ratings
      FROM books b
      WHERE b.id = $1
    `, [bookId]);

        const book = bookResult.rows[0];

        if (!book) {
            req.flash('error_msg', 'Buku tidak ditemukan.');
            return res.redirect('/');
        }

        // Ambil semua review dengan rating dan ulasan
        const reviewsResult = await db.query(`
      SELECT reviewer_name, rating, ulasan, anonymous 
      FROM reviews 
      WHERE book_id = $1 AND status = 'approved'
      ORDER BY created_at DESC
    `, [bookId]);

        res.render('bookDetail', { // Pastikan file view adalah bookDetail.html
            book,
            reviews: reviewsResult.rows
        });
    } catch (err) {
        console.error("Error in getBookDetail:", err);
        req.flash('error_msg', 'Gagal memuat detail buku.');
        res.redirect('/'); // Redirect ke home jika error
    }
};

exports.getSubmitBook = (req, res) => {
    res.render('submitBook', {}); // Pastikan file view adalah submitBook.html
};

exports.postSubmitBook = async (req, res) => {
    // Pastikan req.file dihandle oleh middleware multer sebelum controller ini dijalankan
    const { judul, penulis, genre, tahun_terbit, deskripsi, link_baca_beli, awards } = req.body;
    const userId = req.session.user.id;

    // Tangani URL sampul dari middleware upload
    let sampul_url = null;
    if (req.file) {
        // Jika menggunakan upload lokal seperti di middleware/upload.js
        sampul_url = `/uploads/${req.file.filename}`;
        // Jika nanti menggunakan Cloudinary, ganti dengan URL dari Cloudinary
        // sampul_url = req.file.path; // atau hasil dari uploadToCloudinary
    }

    // Validasi input
    if (!judul || !penulis) {
        req.flash('error_msg', 'Judul dan penulis wajib diisi.');
        return res.redirect('/books/submit-book');
    }

    try {
        // Masukkan ke tabel book_submissions, bukan books langsung
        await db.query(
            `INSERT INTO book_submissions 
         (judul, penulis, deskripsi, genre, tahun_terbit, sampul_url, link_baca_beli, awards, submitter_id, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [judul, penulis, deskripsi || null, genre || null, tahun_terbit || null, sampul_url, link_baca_beli || null, awards || null, userId, 'pending']
        );

        req.flash('success_msg', 'Buku berhasil dikirim dan menunggu persetujuan admin.');
    } catch (err) {
        console.error("Error in postSubmitBook:", err);
        req.flash('error_msg', 'Gagal mengirim buku.');
        // Jangan redirect ke halaman yang sama jika error, atau pastikan error tetap ditampilkan
    }

    res.redirect('/books/submit-book');
};

// Tampilkan form edit buku
exports.getEditBookForm = async (req, res) => {
    const bookId = req.params.id;
    const userId = req.session.user.id;

    try {
        // Pastikan buku milik user
        const result = await db.query(`
      SELECT * FROM books 
      WHERE id = $1 AND submitter_id = $2
    `, [bookId, userId]);

        const book = result.rows[0];

        if (!book) {
            req.flash('error_msg', 'Buku tidak ditemukan atau Anda tidak memiliki akses.');
            return res.redirect('/books/my-books');
        }

        // Cek apakah ada edit yang masih pending untuk buku ini oleh user ini
        const editResult = await db.query(`
      SELECT status FROM book_edits 
      WHERE book_id = $1 AND submitter_id = $2 AND status = 'pending'
      ORDER BY created_at DESC LIMIT 1
    `, [bookId, userId]); // Gunakan created_at, bukan submitted_at yang mungkin typo

        if (editResult.rows.length > 0) {
            req.flash('error_msg', 'Anda masih memiliki edit yang menunggu persetujuan untuk buku ini. Harap tunggu approval sebelum mengajukan perubahan baru.');
            // Redirect ke detail buku atau halaman my-books
            return res.redirect(`/books/${bookId}`);
        }

        res.render('editBook', { book }); // Pastikan file view adalah editBook.html
    } catch (err) {
        console.error("Error in getEditBookForm:", err);
        req.flash('error_msg', 'Gagal memuat form edit.');
        res.redirect('/books/my-books');
    }
};

exports.postEditBook = async (req, res) => {
    const bookId = req.params.id;
    const submitterId = req.session.user.id;
    const { judul, penulis, genre, tahun_terbit, deskripsi, link_baca_beli, awards } = req.body;

    // Tangani URL sampul dari middleware upload
    let sampulUrl = null;
    if (req.file) {
        sampulUrl = `/uploads/${req.file.filename}`;
        // Jika menggunakan Cloudinary: sampulUrl = req.file.path;
    }

    try {
        // Cek apakah ada edit yang masih pending untuk buku ini oleh user ini
        const pendingEdit = await db.query(`
      SELECT id FROM book_edits
      WHERE book_id = $1 AND submitter_id = $2 AND status = 'pending'
      LIMIT 1
    `, [bookId, submitterId]);

        if (pendingEdit.rows.length > 0) {
            req.flash('error_msg', 'Anda masih memiliki edit yang menunggu persetujuan untuk buku ini. Harap tunggu approval sebelum mengajukan perubahan baru.');
            return res.redirect(`/books/edit/${bookId}`);
        }

        // Dapatkan data buku asli untuk perbandingan
        const bookResult = await db.query('SELECT * FROM books WHERE id = $1', [bookId]);
        const book = bookResult.rows[0];

        if (!book) {
            req.flash('error_msg', 'Buku tidak ditemukan.');
            return res.redirect('/books/my-books');
        }

        // Cek apakah ada perubahan yang signifikan
        const hasChanges =
            (judul && judul !== book.judul) ||
            (penulis && penulis !== book.penulis) ||
            (genre && genre !== book.genre) ||
            (tahun_terbit && tahun_terbit !== book.tahun_terbit) ||
            (deskripsi && deskripsi !== book.deskripsi) ||
            (link_baca_beli && link_baca_beli !== book.link_baca_beli) ||
            (awards && awards !== book.awards) || // Bandingkan string/array jika perlu
            (sampulUrl); // Jika ada file baru diupload

        if (!hasChanges) {
            req.flash('error_msg', 'Tidak ada perubahan yang diajukan.');
            return res.redirect(`/books/edit/${bookId}`);
        }

        // Simpan edit ke tabel book_edits
        await db.query(
            `INSERT INTO book_edits 
      (book_id, submitter_id, edit_judul, edit_penulis, genre, tahun_terbit, deskripsi, link_baca_beli, awards, sampul_url, status) -- Gunakan edit_judul, edit_penulis
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [bookId, submitterId, judul, penulis, genre, tahun_terbit, deskripsi, link_baca_beli, awards, sampulUrl, 'pending']
        );

        req.flash('success_msg', 'Perubahan buku berhasil diajukan dan menunggu persetujuan admin.');
    } catch (err) {
        console.error("Error in postEditBook:", err);
        req.flash('error_msg', 'Gagal mengajukan perubahan buku.');
        // Jangan redirect ke halaman yang sama jika error, atau pastikan error tetap ditampilkan
    }

    // Redirect ke detail buku setelah submit
    res.redirect(`/books/${bookId}`);
};

// Tampilkan buku yang disetujui milik member (dari tabel books)
exports.getMyApprovedBooks = async (req, res) => {
    const userId = req.session.user.id;
    try {
        const result = await db.query(`
      SELECT 
        b.id, 
        b.judul, 
        b.penulis, 
        b.created_at,
        (SELECT status FROM book_edits 
         WHERE book_id = b.id AND submitter_id = $1 
         ORDER BY created_at DESC LIMIT 1) AS edit_status
      FROM books b
      WHERE b.submitter_id = $1
      ORDER BY b.created_at DESC
    `, [userId]); // Tambahkan ORDER BY

        res.render('myBooks', { books: result.rows }); // Pastikan file view adalah myBooks.html
    } catch (err) {
        console.error("Error in getMyApprovedBooks:", err);
        req.flash('error_msg', 'Gagal memuat daftar buku Anda.');
        res.redirect('/');
    }
};