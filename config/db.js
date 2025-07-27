const { Pool } = require('pg');

// Periksa apakah kita berada di lingkungan Railway
const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT !== undefined;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Tambahkan event listener untuk error koneksi
pool.on('error', (err, client) => {
    console.error('Kesalahan koneksi database:', err);
});

// Fungsi untuk inisialisasi database (opsional)
const initDB = async () => {
    try {
        console.log('Koneksi database berhasil');
    } catch (err) {
        console.error('Gagal menginisialisasi database:', err);
        throw err;
    }
};

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
    initDB
};