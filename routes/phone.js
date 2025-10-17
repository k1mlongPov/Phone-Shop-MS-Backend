const express = require('express');
const router = express.Router();
const phoneController = require('../controllers/phoneController');

router.get('/byId/:id', phoneController.getPhoneById);

router.get('/', phoneController.listPhones);

router.post('/', phoneController.createPhone);

router.put('/update/:id', phoneController.updatePhone);

router.delete('/delete/:id', phoneController.deletePhone);

module.exports = router;
