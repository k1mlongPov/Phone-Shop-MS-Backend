const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Folder: /uploads/categories
const CATEGORY_UPLOAD_PATH = path.join(__dirname, '..', 'uploads', 'categories');

if (!fs.existsSync(CATEGORY_UPLOAD_PATH)) {
    fs.mkdirSync(CATEGORY_UPLOAD_PATH, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, CATEGORY_UPLOAD_PATH);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const safeName =
            `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`;
        cb(null, safeName);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only jpeg, jpg, png, webp allowed.'));
    }
};

const limits = { fileSize: 5 * 1024 * 1024 }; // 5MB

const uploadCategoryImage = multer({
    storage,
    fileFilter,
    limits,
});

module.exports = uploadCategoryImage;
