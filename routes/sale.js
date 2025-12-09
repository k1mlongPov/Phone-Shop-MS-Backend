const express = require('express');
const router = express.Router();
const saleCtrl = require('../controllers/saleController');
const auth = require('../middleware/authMiddleware');

router.post('/', auth, saleCtrl.createSale);
router.get('/', auth, saleCtrl.list);
router.get('/:id', auth, saleCtrl.getById);

module.exports = router;
