// database/migrate.js
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Konfigurasi koneksi database
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Fungsi untuk menginisialisasi database
const initDB = async () => {
    try {
        // Baca file schema.sql
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('Menjalankan migrasi database...');

        // Jalankan skema SQL
        await pool.query(schema);

        console.log('✅ Database schema berhasil diinisialisasi');

        // Tambahkan akun admin pertama (opsional)
        try {
            // Cek apakah sudah ada admin
            const adminCheck = await pool.query(
                'SELECT * FROM users WHERE role = $1 LIMIT 1',
                ['admin']
            );

            if (adminCheck.rows.length === 0) {
                // Hash password untuk admin (gunakan bcrypt di aplikasi sebenarnya)
                const adminPassword = 'admin123'; // Hanya untuk development, ganti dengan hash yang aman
                await pool.query(
                    `INSERT INTO users (nama, email, password_hash, role, created_at) 
           VALUES ($1, $2, $3, $4, NOW())`,
                    ['Admin Utama', 'admin@example.com', adminPassword, 'admin']
                );
                console.log('✅ Akun admin pertama berhasil dibuat');
                console.log('   Email: admin@example.com');
                console.log('   Password: admin123 (HANYA UNTUK DEVELOPMENT)');
            } else {
                console.log('ℹ️ Akun admin sudah ada, tidak perlu membuat yang baru');
            }
        } catch (adminErr) {
            console.error('⚠️ Gagal membuat akun admin:', adminErr.message);
            // Lanjutkan eksekusi meskipun pembuatan admin gagal
        }

        // Tutup koneksi pool
        await pool.end();
        console.log('🔌 Koneksi database ditutup');

        // Keluar dengan kode sukses
        process.exit(0);
    } catch (err) {
        console.error('❌ Error menginisialisasi database schema:', err);

        // Coba tutup koneksi pool sebelum keluar
        try {
            await pool.end();
            console.log('🔌 Koneksi database ditutup');
        } catch (poolErr) {
            console.error('❌ Gagal menutup koneksi database:', poolErr);
        }

        // Keluar dengan kode error
        process.exit(1);
    }
};

// Jalankan fungsi inisialisasi
initDB();