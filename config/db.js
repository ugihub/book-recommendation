const { Pool } = require('pg');

// Periksa apakah kita berada di lingkungan Railway
const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT !== undefined;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    } : false, // Nonaktifkan SSL di lingkungan development
    max: 20, // Jumlah koneksi maksimum
    idleTimeoutMillis: 30000, // Timeout untuk koneksi idle
    connectionTimeoutMillis: 5000, // Timeout koneksi
});

// Tambahkan event listener untuk error koneksi
pool.on('error', (err, client) => {
    console.error('Kesalahan koneksi database:', err);
    // Di Railway, jangan gunakan process.exit(-1) karena Railway akan merestart aplikasi
});

// Fungsi untuk inisialisasi database (opsional)
const initDB = async () => {
    try {
        // Di sini Anda bisa menambahkan skema database jika diperlukan
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