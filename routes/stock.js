const express = require('express');
const router = express.Router();
const stockCtrl = require('../controllers/stockController');
const authMiddleware = require('../middleware/authMiddleware');

// List stock movements
router.get('/movements', authMiddleware, stockCtrl.list);

router.post('/movements', authMiddleware, stockCtrl.create);

module.exports = router;
