const express = require('express');
const router = express.Router();
const saleCtrl = require('../controllers/saleController');
const auth = require('../middleware/authMiddleware');

router.post('/', auth, saleCtrl.createSale);
router.get('/', auth, saleCtrl.listInvoices);
router.get('/:id', auth, saleCtrl.getInvoice);

module.exports = router;
