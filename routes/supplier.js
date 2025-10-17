const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');

router.post('/', supplierController.createSupplier);

router.get('/', supplierController.getAllSuppliers);

router.put('/update/:id', supplierController.updateSupplier);

router.delete('/delete/:id', supplierController.deleteSupplier);

module.exports = router;
