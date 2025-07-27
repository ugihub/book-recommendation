// middleware/upload.js
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Konfigurasi storage untuk multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        const extname = path.extname(file.originalname);
        const uniqueName = `${uuidv4()}${extname}`;
        cb(null, uniqueName);
    }
});

// Filter file untuk memastikan hanya gambar yang diupload
const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Hanya file gambar yang diperbolehkan (jpeg, jpg, png, gif)'));
    }
};

// Konfigurasi multer dengan storage dan file filter
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Middleware untuk menangani error upload
const uploadErrorHandler = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        req.flash('error_msg', `Error upload: ${err.message}`);
    } else if (err) {
        req.flash('error_msg', err.message);
    }
    res.redirect(req.get('referer') || '/');
};

module.exports = {
    upload,
    uploadErrorHandler
};