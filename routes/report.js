const express = require('express');
const router = express.Router();
const reportCtrl = require('../controllers/reportController');

router.get('/profit/summary', reportCtrl.getTotalProfitSummary);
router.get('/monthly-profit', reportCtrl.getMonthlyProfit);

module.exports = router;
