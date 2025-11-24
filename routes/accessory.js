const express = require('express');
const router = express.Router();

const accessoryCtrl = require('../controllers/accessoryController');
const authMiddleware = require('../middleware/authMiddleware');
const uploadAccessoryImages = require('../config/multerAccessory');

router.post(
    '/',
    authMiddleware,
    uploadAccessoryImages.array('images', 6),
    accessoryCtrl.create
);

router.get('/', authMiddleware, accessoryCtrl.list);

router.get('/:id', authMiddleware, accessoryCtrl.get);

router.put(
    '/:id',
    authMiddleware,
    uploadAccessoryImages.array('images', 6),
    accessoryCtrl.update
);

router.delete('/:id', authMiddleware, accessoryCtrl.delete);

router.post('/:id/restock', authMiddleware, accessoryCtrl.restock);

module.exports = router;
