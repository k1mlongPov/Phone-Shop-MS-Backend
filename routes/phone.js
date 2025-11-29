const express = require('express');
const router = express.Router();
const phoneCtrl = require('../controllers/phoneController');
const authMiddleware = require('../middleware/authMiddleware');
const uploadPhone = require('../middleware/uploadPhone');

router.get('/', authMiddleware, phoneCtrl.listPhones);

router.get('/:id', authMiddleware, phoneCtrl.getPhoneById);

router.delete('/:id', authMiddleware, phoneCtrl.deletePhone);

router.get("/low-stock", authMiddleware, phoneCtrl.getLowStockPhones);

router.get("/out-of-stock", authMiddleware, phoneCtrl.getOutOfStockPhones);


router.post(
    '/',
    authMiddleware,
    uploadPhone.array('images', 5),
    phoneCtrl.createPhone
);

router.put(
    '/:id',
    authMiddleware,
    uploadPhone.array('images', 5),
    phoneCtrl.updatePhone
);


module.exports = router;
