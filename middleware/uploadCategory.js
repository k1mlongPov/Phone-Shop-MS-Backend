const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../utils/cloudinary');

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'phone_shop/categories',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    },
});

module.exports = multer({ storage });
