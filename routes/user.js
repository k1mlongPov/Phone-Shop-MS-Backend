const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware'); // implement this

router.get('/', authMiddleware, userCtrl.list);
router.get('/:id', authMiddleware, userCtrl.get);
router.put('/:id', authMiddleware, userCtrl.update);
router.delete('/:id', authMiddleware, userCtrl.delete);

module.exports = router;