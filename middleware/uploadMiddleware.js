const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('../config/cloudinary');

// Middleware untuk upload ke Cloudinary
const uploadToCloudinary = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    // Upload ke Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'aksararia' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });

    // Simpan URL Cloudinary ke req.body
    req.body.sampulUrl = result.secure_url;
    
    // Hapus file sementara
    req.file = null;
    
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadToCloudinary
};