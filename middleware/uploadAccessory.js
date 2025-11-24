const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../utils/cloudinary');

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'phone_shop/accessories',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    },
});

module.exports = multer({ storage });
