const express = require('express');
const router = express.Router();

const supplierCtrl = require('../controllers/supplierController');
const auth = require('../middleware/authMiddleware');

router.post('/', auth, supplierCtrl.create);

router.get('/', auth, supplierCtrl.list);

router.get('/:id', auth, supplierCtrl.get);

router.put('/:id', auth, supplierCtrl.update);

router.delete('/:id', auth, supplierCtrl.delete);

module.exports = router;
