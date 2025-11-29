const express = require('express');
const router = express.Router();
const accessoryCtrl = require('../controllers/accessoryController');
const authMiddleware = require('../middleware/authMiddleware');
const uploadAccessory = require('../middleware/uploadAccessory');

router.get('/', authMiddleware, accessoryCtrl.list);

router.get('/:id', authMiddleware, accessoryCtrl.get);

router.delete('/:id', authMiddleware, accessoryCtrl.delete);

router.post('/:id/restock', authMiddleware, accessoryCtrl.restock);

router.get("/low-stock", authMiddleware, accessoryCtrl.getLowStockAccessories);

router.get("/out-of-stock", authMiddleware, accessoryCtrl.getOutOfStockAccessories);

router.post(
    '/',
    authMiddleware,
    uploadAccessory.array('images', 5),
    accessoryCtrl.create
);

router.put(
    '/:id',
    authMiddleware,
    uploadAccessory.array('images', 5),
    accessoryCtrl.update
);

module.exports = router;
