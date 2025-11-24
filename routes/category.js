const express = require('express');
const router = express.Router();

const categoryCtrl = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/',
    authMiddleware,
    upload.single('image'),
    categoryCtrl.create
);

router.get('/', authMiddleware, categoryCtrl.getRoot);

router.get('/sub', authMiddleware, categoryCtrl.listSubcategories);

router.get('/sub/:id', authMiddleware, categoryCtrl.getByParent);

router.put('/:id', authMiddleware, categoryCtrl.update);

router.delete('/:id', authMiddleware, categoryCtrl.delete);

module.exports = router;
