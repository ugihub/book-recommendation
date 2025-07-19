const db = require('../config/db');

exports.getBooks = async (req, res) => {
    try {
        const result = await db.query(`
      SELECT b.id, b.judul, b.penulis, b.genre,
      ROUND((SELECT AVG(rating) FROM reviews WHERE book_id = b.id AND status = 'approved'), 1) AS avg_rating
      FROM books b
      ORDER BY avg_rating DESC NULLS LAST
    `);

        // Pastikan avg_rating adalah number
        const processedBooks = result.rows.map(book => ({
            ...book,
            avg_rating: book.avg_rating ? parseFloat(book.avg_rating) : null
        }));

        res.render('index', { books: processedBooks });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.getBookDetail = async (req, res) => {
    const bookId = req.params.id;

    try {
        const bookResult = await db.query(`
      SELECT 
        b.id, b.judul, b.penulis, b.genre, b.tahun_terbit, b.deskripsi, b.sampul_url,
        ROUND((SELECT AVG(r.rating) FROM reviews r WHERE r.book_id = b.id AND r.status = 'approved'), 1) AS avg_rating,
        (SELECT COUNT(*) FROM reviews r WHERE r.book_id = b.id AND r.status = 'approved') AS total_ratings
      FROM books b
      WHERE b.id = $1
    `, [bookId]);

        const book = bookResult.rows[0];

        // Query rating dan komentar
        const ratingsResult = await db.query(`
      SELECT reviewer_name, rating, anonymous 
      FROM reviews 
      WHERE book_id = $1 AND rating IS NOT NULL AND status = 'approved'
    `, [bookId]);

        const reviewsResult = await db.query(`
      SELECT reviewer_name, ulasan, anonymous 
      FROM reviews 
      WHERE book_id = $1 AND ulasan IS NOT NULL AND status = 'approved'
    `, [bookId]);

        res.render('bookDetail', {
            book,
            ratings: ratingsResult.rows,
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

exports.postSubmitBook = async (req, res) => {
    const { judul, penulis } = req.body;

    if (!judul || !penulis) {
        req.flash('error_msg', 'Judul dan penulis wajib diisi.');
        return res.redirect('/submit-book');
    }

    const sampul_url = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        await db.query(
            `INSERT INTO book_submissions 
        (judul, penulis, deskripsi, genre, tahun_terbit, sampul_url, link_baca_beli, submitter_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [judul, penulis, req.body.deskripsi, req.body.genre, req.body.tahun_terbit, sampul_url, req.body.link_baca_beli, req.session.user.id]
        );
        req.flash('success_msg', 'Buku berhasil dikirim.');
    } catch (err) {
        req.flash('error_msg', 'Gagal mengirim buku.');
        console.error(err);
    }

    res.redirect('/books/submit-book');
};