const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/profit', reportController.getTotalProfit);
router.get('/low-stock', reportController.getLowStockItems);
router.get('/top-brands', reportController.getTopBrands);
router.get('/brand-margins', reportController.getBrandProfitMargins);

module.exports = router;
