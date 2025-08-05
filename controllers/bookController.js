const db = require('../config/db');

exports.getBooks = async (req, res) => {
    const { search, sort } = req.query;

    // Query dasar dengan filter status != 'deleted'
    let query = `SELECT 
        b.id, 
        b.judul, 
        b.penulis, 
        b.genre, 
        b.tahun_terbit, 
        b.sampul_url,
        ROUND((SELECT AVG(r.rating) FROM reviews r WHERE r.book_id = b.id AND r.status = 'approved'), 1) AS avg_rating
    FROM books b
    WHERE b.status != 'deleted'`; // Tambahkan filter ini

    const params = [];
    let paramIndex = 1;

    // Tambahkan pencarian
    if (search) {
        query += ` AND (b.judul ILIKE $${paramIndex} OR b.penulis ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
    }

    // Tambahkan sorting
    switch (sort) {
        case 'rating_desc':
            query += ' ORDER BY avg_rating DESC';
            break;
        case 'rating_asc':
            query += ' ORDER BY avg_rating ASC';
            break;
        case 'newest':
            query += ' ORDER BY b.created_at DESC';
            break;
        default:
            query += ' ORDER BY b.created_at DESC';
    }

    try {
        const result = await db.query(query, params);

        // Pastikan avg_rating dikonversi ke number dengan benar
        const books = result.rows.map(book => ({
            ...book,
            avg_rating: book.avg_rating !== null ? parseFloat(book.avg_rating) : null
        }));

        res.render('index', {
            books: books,
            search: search || '',
            sort: sort || 'newest',
            success_msg: req.flash('success_msg'),
            error_msg: req.flash('error_msg')
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
        b.id, b.judul, b.penulis, b.genre, b.tahun_terbit, b.deskripsi, b.sampul_url, b.link_baca_beli,
        ROUND((SELECT AVG(r.rating) FROM reviews r WHERE r.book_id = b.id AND r.status = 'approved'), 1) AS avg_rating,
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

exports.getSubmitBook = async (req, res) => {
    try {
        // Gunakan waktu server untuk menentukan rentang hari ini
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);

        // Hitung jumlah pengajuan hari ini
        const result = await db.query(
            'SELECT COUNT(*) FROM book_submissions ' +
            'WHERE submitter_id = $1 AND created_at >= $2 AND created_at <= $3',
            [req.session.user.id, todayStart.toISOString(), todayEnd.toISOString()]
        );

        const submissionCount = parseInt(result.rows[0].count, 10);
        const remainingSubmissions = Math.max(0, 5 - submissionCount);

        res.render('submitBook', {
            remainingSubmissions: remainingSubmissions,
            submissionCount: submissionCount,
            totalLimit: 5
        });
    } catch (err) {
        console.error('Error in getSubmitBook:', err);
        req.flash('error_msg', 'Terjadi kesalahan saat memuat halaman submit buku.');
        res.redirect('/books/my-books');
    }
};

exports.postSubmitBook = async (req, res) => {
    const { judul, penulis } = req.body;

    // Validasi input dasar
    if (!judul || !penulis) {
        req.flash('error_msg', 'Judul dan penulis wajib diisi.');
        // Redirect ke /books/submit-book (dengan prefix /books)
        return res.redirect('/books/submit-book');
    }

    const sampul_url = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        // Simpan ke database
        await db.query(
            `INSERT INTO book_submissions 
      (judul, penulis, deskripsi, genre, tahun_terbit, sampul_url, link_baca_beli, submitter_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                judul,
                penulis,
                req.body.deskripsi,
                req.body.genre,
                req.body.tahun_terbit,
                sampul_url,
                req.body.link_baca_beli,
                req.session.user.id
            ]
        );

        req.flash('success_msg', 'Buku berhasil dikirim dan menunggu persetujuan admin.');
        // Redirect ke halaman "Buku Saya" setelah berhasil submit
        res.redirect('/books/my-books');
    } catch (err) {
        console.error('Error in postSubmitBook:', err);
        req.flash('error_msg', 'Gagal mengirim buku. Silakan coba lagi.');
        // Redirect ke /books/submit-book (dengan prefix /books)
        res.redirect('/books/submit-book');
    }
};

// controllers/bookController.js
exports.getEditBookForm = async (req, res) => {
    const bookId = req.params.id;
    const userId = req.session.user.id;

    try {
        // Hanya periksa di tabel books (bukan book_submissions)
        const result = await db.query(`
            SELECT * FROM books 
            WHERE id = $1 AND submitter_id = $2
        `, [bookId, userId]);

        if (result.rows.length === 0) {
            req.flash('error_msg', 'Anda tidak memiliki akses ke buku ini.');
            return res.redirect('/books/my-books');
        }

        const book = result.rows[0];

        // Cek apakah buku dihapus oleh admin
        if (book.status === 'deleted') {
            req.flash('error_msg', 'Buku ini telah dihapus oleh admin dan tidak bisa diedit.');
            return res.redirect('/books/my-books');
        }

        // Cek apakah ada edit yang masih pending
        const editResult = await db.query(`
            SELECT status FROM book_edits 
            WHERE book_id = $1 AND submitter_id = $2 AND status = 'pending'
            ORDER BY submitted_at DESC LIMIT 1
        `, [bookId, userId]);

        if (editResult.rows.length > 0) {
            req.flash('error_msg', 'Anda masih memiliki edit yang menunggu persetujuan. Harap tunggu approval sebelum mengajukan perubahan baru.');
        }

        res.render('editBook', { book });
    } catch (err) {
        console.error('Error in getEditBookForm:', err);
        req.flash('error_msg', 'Gagal memuat form edit.');
        res.redirect('/books/my-books');
    }
};

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

        // Hanya periksa di tabel books (pastikan buku ada dan belum dihapus)
        const bookResult = await db.query(
            'SELECT * FROM books WHERE id = $1 AND submitter_id = $2 AND status != $3',
            [bookId, submitterId, 'deleted']
        );

        if (bookResult.rows.length === 0) {
            req.flash('error_msg', 'Buku tidak ditemukan atau telah dihapus oleh admin.');
            return res.redirect('/books/my-books');
        }

        const book = bookResult.rows[0];

        // Cek apakah ada perubahan
        const hasChanges =
            judul !== book.judul ||
            penulis !== book.penulis ||
            (genre && genre !== book.genre) ||
            (tahun_terbit && parseInt(tahun_terbit) !== book.tahun_terbit) ||
            (deskripsi && deskripsi !== book.deskripsi) ||
            (link_baca_beli && link_baca_beli !== book.link_baca_beli) ||
            (sampulUrl && sampulUrl !== book.sampul_url);

        if (!hasChanges) {
            req.flash('error_msg', 'Tidak ada perubahan yang diajukan.');
            return res.redirect(`/books/edit/${bookId}`);
        }

        // Simpan edit ke book_edits
        await db.query(
            `INSERT INTO book_edits 
            (book_id, submitter_id, judul, penulis, genre, tahun_terbit, deskripsi, link_baca_beli, sampul_url, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [bookId, submitterId, judul, penulis, genre, tahun_terbit, deskripsi, link_baca_beli, sampulUrl, 'pending']
        );

        req.flash('success_msg', 'Perubahan buku berhasil diajukan dan menunggu persetujuan admin.');
        res.redirect('/books/my-books');
    } catch (err) {
        console.error('Error in postEditBook:', err);
        req.flash('error_msg', 'Gagal mengajukan perubahan buku.');
        res.redirect(`/books/edit/${bookId}`);
    }
};

// Tampilkan buku yang disetujui milik member
exports.getMyApprovedBooks = async (req, res) => {
    const userId = req.session.user.id;
    try {
        // Ambil semua buku yang dimiliki oleh user dari tabel books (tanpa filter status)
        const allBooksResult = await db.query(`
            SELECT 
                b.id, 
                b.judul, 
                b.penulis, 
                b.created_at,
                b.status,
                (SELECT status FROM book_edits 
                 WHERE book_id = b.id AND submitter_id = $1 
                 ORDER BY submitted_at DESC LIMIT 1) AS edit_status
            FROM books b
            WHERE b.submitter_id = $1
            ORDER BY b.created_at DESC
        `, [userId]);

        // Pisahkan buku yang dihapus dan yang tidak dihapus
        const deletedBooks = allBooksResult.rows.filter(book => book.status === 'deleted');
        const activeBooks = allBooksResult.rows.filter(book => book.status !== 'deleted');

        // Jika ada buku yang dihapus, tambahkan pesan notifikasi
        if (deletedBooks.length > 0) {
            req.flash('info_msg', `${deletedBooks.length} buku Anda telah dihapus oleh admin.`);
        }

        // Format data untuk view (hanya tampilkan buku yang tidak dihapus)
        const books = activeBooks.map(book => ({
            id: book.id,
            judul: book.judul,
            penulis: book.penulis,
            created_at: book.created_at,
            status: 'approved', // Karena semua yang tampil di sini adalah buku yang tidak dihapus
            edit_status: book.edit_status
        }));

        res.render('myBooks', {
            books: books,
            success_msg: req.flash('success_msg'),
            error_msg: req.flash('error_msg'),
            info_msg: req.flash('info_msg')
        });
    } catch (err) {
        console.error('Error in getMyApprovedBooks:', err);
        req.flash('error_msg', 'Gagal memuat daftar buku Anda.');
        res.redirect('/');
    }
};