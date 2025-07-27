const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'AKUN_CLOUDINARY_ANDA',
  api_key: 'API_KEY_ANDA',
  api_secret: 'API_SECRET_ANDA'
});

module.exports = cloudinary;