const express = require('express');
const router = express.Router();
const accessoryController = require('../controllers/accessoryController');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/accessories/');
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    },
});

const upload = multer({ storage });

router.post('/', upload.array('images', 10), accessoryController.createAccessory);
router.get('/', accessoryController.listAccessories);
router.get('/:id', accessoryController.getAccessoryById);
router.put('/update/:id', upload.array('images', 10), accessoryController.updateAccessory);
router.delete('/delete/:id', accessoryController.deleteAccessory);

module.exports = router;
