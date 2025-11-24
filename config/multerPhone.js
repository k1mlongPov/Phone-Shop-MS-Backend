const multer = require('multer');
const path = require('path');
const fs = require('fs');

const PHONE_UPLOAD_PATH = path.join(__dirname, '..', 'uploads', 'phones');

if (!fs.existsSync(PHONE_UPLOAD_PATH)) {
    fs.mkdirSync(PHONE_UPLOAD_PATH, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, PHONE_UPLOAD_PATH);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`;
        cb(null, safeName);
    },
});

const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only jpeg, png, webp allowed.'));
    }
};

const limits = { fileSize: 6 * 1024 * 1024 };

const uploadPhoneImages = multer({
    storage,
    fileFilter,
    limits,
});

module.exports = uploadPhoneImages;