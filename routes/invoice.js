const express = require('express');
const router = express.Router();
const invoiceCtrl = require('../controllers/invoiceController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, invoiceCtrl.create);

router.get('/', authMiddleware, invoiceCtrl.list);
router.get('/:id', authMiddleware, invoiceCtrl.get);

module.exports = router;