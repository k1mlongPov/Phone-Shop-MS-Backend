const express = require('express');
const router = express.Router();
const poCtrl = require('../controllers/purchaseOrderController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, poCtrl.create);

router.post('/:id/receive', authMiddleware, poCtrl.receive);

router.get('/', authMiddleware, poCtrl.list);

module.exports = router;