const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    connectionString: process.env.DATABASE_URL, // Railway akan menyediakannya
    ssl: {
        rejectUnauthorized: false // Penting untuk koneksi ke database di cloud
    }
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};