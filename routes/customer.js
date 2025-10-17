const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

router.post('/', customerController.createCustomer);

router.get('/', customerController.listCustomers);

router.put('/update/:id', customerController.updateCustomer);

router.delete('/delete/:id', customerController.deleteCustomer);

module.exports = router;
