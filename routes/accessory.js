const express = require('express');
const router = express.Router();
const accessoryController = require('../controllers/accessoryController');

router.post('/', accessoryController.createAccessory);

router.get('/byId/:id', accessoryController.getAccessoryById);

router.get('/', accessoryController.listAccessories);

router.put('/update/:id', accessoryController.updateAccessory);

router.delete('/delete/:id', accessoryController.deleteAccessory);

module.exports = router;
