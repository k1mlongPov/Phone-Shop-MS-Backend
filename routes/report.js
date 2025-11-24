const express = require('express');
const router = express.Router();
const reportCtrl = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/today', authMiddleware, reportCtrl.today);

module.exports = router;