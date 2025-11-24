const express = require('express');
const router = express.Router();
const customerCtrl = require('../controllers/customerController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, customerCtrl.create);
router.get('/', authMiddleware, customerCtrl.list);
router.get('/:id', authMiddleware, customerCtrl.get);
router.put('/:id', authMiddleware, customerCtrl.update);
router.delete('/:id', authMiddleware, customerCtrl.delete);

module.exports = router;