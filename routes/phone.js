const express = require('express');
const router = express.Router();
const phoneCtrl = require('../controllers/phoneController');
const authMiddleware = require('../middleware/authMiddleware');
const uploadPhoneImages = require('../config/multerPhone');

// Create phone (supports multiple images)
router.post('/', authMiddleware, uploadPhoneImages.array('images', 8), phoneCtrl.createPhone);

// Update phone (replace/add images)
router.put('/:id', authMiddleware, uploadPhoneImages.array('images', 8), phoneCtrl.updatePhone);

// other routes...
router.get('/', authMiddleware, phoneCtrl.listPhones);
router.get('/:id', authMiddleware, phoneCtrl.getPhoneById);
router.delete('/:id', authMiddleware, phoneCtrl.deletePhone);
router.post('/:id/restock', authMiddleware, phoneCtrl.adjustStock);

module.exports = router;
