// config/multerAccessory.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Upload directory
const ACCESSORY_UPLOAD_PATH = path.join(
    __dirname,
    '..',
    'uploads',
    'accessories'
);

// Ensure upload folder exists
if (!fs.existsSync(ACCESSORY_UPLOAD_PATH)) {
    fs.mkdirSync(ACCESSORY_UPLOAD_PATH, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, ACCESSORY_UPLOAD_PATH);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, unique + ext);
    },
});

// File filter (accept images only)
function fileFilter(req, file, cb) {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only jpeg, png, webp allowed.'));
    }
}

// Maximum file size: 5MB each
const limits = {
    fileSize: 5 * 1024 * 1024,
};

const uploadAccessoryImages = multer({
    storage,
    fileFilter,
    limits,
});

module.exports = uploadAccessoryImages;
