const db = require('../config/db');
const { uploadToCloudinary } = require('../middleware/upload');

exports.getBooks = async (req, res) => {
    const { search, sort } = req.query;

    // Query dasar
    let query = `
    SELECT b.id, b.judul, b.penulis, b.genre, b.tahun_terbit, b.sampul_url,
    ROUND((SELECT AVG(rating) FROM reviews WHERE book_id = b.id), 1) AS avg_rating
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
        const processedBooks = result.rows.map(book => ({
            ...book,
            avg_rating: book.avg_rating ? parseFloat(book.avg_rating) : null
        }));

        res.render('index', {
            books: processedBooks,
            search: search || '',  // ✅ Tambahkan ini
            sort: sort || ''      // ✅ Tambahkan ini
        });
    } catch (err) {
        console.error(err);
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
        b.link_baca_beli, -- ✅ Pastikan kolom ini diambil
        ROUND((SELECT AVG(rating) FROM reviews r WHERE r.book_id = b.id AND r.status = 'approved'), 1) AS avg_rating,
        (SELECT COUNT(*) FROM reviews r WHERE r.book_id = b.id AND r.status = 'approved') AS total_ratings
      FROM books b
      WHERE b.id = $1
    `, [bookId]);

        const book = bookResult.rows[0];

        // Ambil semua review dengan rating dan ulasan
        const reviewsResult = await db.query(`
      SELECT reviewer_name, rating, ulasan, anonymous 
      FROM reviews 
      WHERE book_id = $1 AND status = 'approved'
      ORDER BY created_at DESC
    `, [bookId]);

        res.render('bookDetail', {
            book,
            reviews: reviewsResult.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.getSubmitBook = (req, res) => {
    res.render('submitBook', {});
};

exports.postSubmitBook = [
    upload.single('sampul'),
    async (req, res) => {
        try {
            const { judul, penulis, genre, tahun_terbit, deskripsi, link_baca_beli, awards } = req.body;
            const userId = req.session.user.id;

            // Validasi input
            if (!judul || !penulis) {
                req.flash('error_msg', 'Judul dan penulis harus diisi');
                return res.redirect('/books/submit-book');
            }

            // Simpan ke database (termasuk awards)
            await db.query(
                `INSERT INTO book_submissions 
         (judul, penulis, deskripsi, genre, tahun_terbit, sampul_url, link_baca_beli, awards, submitter_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [judul, penulis, deskripsi, genre, tahun_terbit, req.file ? req.file.path : null, link_baca_beli, awards, userId]
            );

            req.flash('success_msg', 'Buku berhasil diajukan. Menunggu persetujuan admin.');
            res.redirect('/books/my-books');
        } catch (err) {
            console.error(err);
            req.flash('error_msg', 'Gagal mengirim buku');
            res.redirect('/books/submit-book');
        }
    },
    uploadErrorHandler
];

// Tampilkan form edit buku
exports.getEditBookForm = async (req, res) => {
    const bookId = req.params.id;
    const userId = req.session.user.id;

    try {
        const result = await db.query(`
      SELECT * FROM books 
      WHERE id = $1 AND submitter_id = $2
    `, [bookId, userId]);

        if (result.rows.length === 0) {
            req.flash('error_msg', 'Anda tidak memiliki akses ke buku ini.');
            return res.redirect('/books/my-books');
        }

        // Cek apakah ada edit yang masih pending
        const editResult = await db.query(`
      SELECT status FROM book_edits 
      WHERE book_id = $1 AND submitter_id = $2 AND status = 'pending'
      ORDER BY submitted_at DESC LIMIT 1
    `, [bookId, userId]);

        const book = result.rows[0];
        if (editResult.rows.length > 0) {
            req.flash('error_msg', 'Anda masih memiliki edit yang menunggu persetujuan. Harap tunggu approval sebelum mengajukan perubahan baru.');
        }

        res.render('editBook', { book });
    } catch (err) {
        req.flash('error_msg', 'Gagal memuat form edit.');
        console.error(err);
        res.redirect('/books/my-books');
    }
};

// Tambahkan validasi jumlah edit per hari
exports.postEditBook = async (req, res) => {
    const bookId = req.params.id;
    const submitterId = req.session.user.id;
    const { judul, penulis, genre, tahun_terbit, deskripsi, link_baca_beli } = req.body;
    const sampulUrl = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        // Cek apakah ada edit yang masih pending
        const pendingEdit = await db.query(`
      SELECT status FROM book_edits
      WHERE book_id = $1 AND submitter_id = $2 AND status = 'pending'
      LIMIT 1
    `, [bookId, submitterId]);

        if (pendingEdit.rows.length > 0) {
            req.flash('error_msg', 'Anda masih memiliki edit yang menunggu persetujuan. Harap tunggu approval sebelum mengajukan perubahan baru.');
            return res.redirect(`/books/edit/${bookId}`);
        }

        // Cek apakah ada perubahan
        const book = await db.query('SELECT * FROM books WHERE id = $1', [bookId]);

        const hasChanges =
            judul !== book.rows[0].judul ||
            penulis !== book.rows[0].penulis ||
            (genre && genre !== book.rows[0].genre) ||
            (tahun_terbit && tahun_terbit !== book.rows[0].tahun_terbit) ||
            (deskripsi && deskripsi !== book.rows[0].deskripsi) ||
            (link_baca_beli && link_baca_beli !== book.rows[0].link_baca_beli) ||
            sampulUrl;

        if (!hasChanges) {
            req.flash('error_msg', 'Tidak ada perubahan yang diajukan.');
            return res.redirect(`/books/edit/${bookId}`);
        }

        // Simpan edit
        await db.query(
            `INSERT INTO book_edits 
      (book_id, submitter_id, judul, penulis, genre, tahun_terbit, deskripsi, link_baca_beli, sampul_url, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [bookId, submitterId, judul, penulis, genre, tahun_terbit, deskripsi, link_baca_beli, sampulUrl, 'pending']
        );

        req.flash('success_msg', 'Perubahan buku berhasil diajukan dan menunggu persetujuan admin.');
    } catch (err) {
        req.flash('error_msg', 'Gagal mengajukan perubahan buku.');
        console.error(err);
    }

    res.redirect('/books/' + bookId);
};

// Tampilkan buku yang disetujui milik member
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
         ORDER BY submitted_at DESC LIMIT 1) AS edit_status
      FROM books b
      WHERE b.submitter_id = $1
    `, [userId]);

        res.render('myBooks', { books: result.rows });
    } catch (err) {
        req.flash('error_msg', 'Gagal memuat daftar buku Anda.');
        console.error(err);
        res.redirect('/');
    }
};