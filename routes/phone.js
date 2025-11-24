const express = require('express');
const router = express.Router();
const phoneCtrl = require('../controllers/phoneController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', authMiddleware, phoneCtrl.listPhones);
router.get('/:id', authMiddleware, phoneCtrl.getPhoneById);

router.delete('/:id', authMiddleware, phoneCtrl.deletePhone);

router.post('/:id/restock', authMiddleware, phoneCtrl.adjustStock);

router.post(
    '/',
    authMiddleware,
    upload.array('images', 5),
    phoneCtrl.createPhone
);

router.put(
    '/:id',
    authMiddleware,
    upload.array('images', 5),
    phoneCtrl.updatePhone
);


module.exports = router;
