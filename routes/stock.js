const express = require('express');
const router = express.Router();
const stockRoutes = require('../controllers/stockController');

router.post('/', stockRoutes.logMovement);
router.get('/', stockRoutes.listMovements);

module.exports = router;
