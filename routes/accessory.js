const express = require('express');
const router = express.Router();
const accessoryCtrl = require('../controllers/accessoryController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post(
    '/',
    authMiddleware,
    upload.array('images', 5),
    accessoryCtrl.create
);

router.get('/', authMiddleware, accessoryCtrl.list);

router.get('/:id', authMiddleware, accessoryCtrl.get);

router.put(
    '/:id',
    authMiddleware,
    upload.array('images', 5),
    accessoryCtrl.update
);

router.delete('/:id', authMiddleware, accessoryCtrl.delete);

router.post('/:id/restock', authMiddleware, accessoryCtrl.restock);

module.exports = router;
