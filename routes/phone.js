const express = require('express');
const router = express.Router();
const phoneController = require('../controllers/phoneController');
const multer = require('multer');
const path = require('path');

// --- Multer setup ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads/phones'));
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    },
});

const upload = multer({ storage });

router.post('/', upload.array('images', 10), phoneController.createPhone);

router.put('/update/:id', upload.array('images', 10), phoneController.updatePhone);

router.delete('/delete/:id', phoneController.deletePhone);

router.get('/', phoneController.listPhones);

router.get('/byId/:id', phoneController.getPhoneById);

module.exports = router;
