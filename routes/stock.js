const express = require('express');
const router = express.Router();
const stockCtrl = require('../controllers/stockController');
const authMiddleware = require('../middleware/authMiddleware');

router.post("/", authMiddleware, stockCtrl.restockMany);

module.exports = router;
