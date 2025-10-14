const express = require('express');
const router = express.Router();
const phoneController = require('../controllers/phoneController');

router.post('/', phoneController.createPhone);

router.get('/', phoneController.listPhones);

router.get('/:id', phoneController.getPhones);

router.put('/:id', phoneController.updatePhone);

router.delete('/:id', phoneController.deletePhone);

router.patch('/:id/stock', phoneController.updateStock);

router.get('/profit/total', phoneController.getTotalProfit);

module.exports = router;
