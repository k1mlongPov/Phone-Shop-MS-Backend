const express = require('express');
const router = express.Router();
const dashboardCtrl = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

router.get("/stats", authMiddleware, dashboardCtrl.getDashboardStats);

router.get("/restock-history", authMiddleware, dashboardCtrl.getRestockHistory);

router.get("/revenue-7-days", dashboardCtrl.getSevenDayRevenue);

module.exports = router;
