const express = require('express');
const router = express.Router();
const accessoryController = require('../controllers/accessoryController');

router.post('/', accessoryController.createAccessory); //worked

router.get('/', accessoryController.listAccessories); //worked

router.get('/:id', accessoryController.getAccessory); //worked

router.put('/:id', accessoryController.updateAccessory); //worked

router.delete('/:id', accessoryController.deleteAccessory); //worked

router.get('/profit/total', accessoryController.getTotalProfit);

module.exports = router;
