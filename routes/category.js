const express = require('express');
const router = express.Router();
const categoryCtrl = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware');
const uploadCategory = require('../middleware/uploadCategory');

router.get('/', authMiddleware, categoryCtrl.getRoot);

router.get('/sub', authMiddleware, categoryCtrl.listSubcategories);

router.get('/sub/:id', authMiddleware, categoryCtrl.getByParent);

router.delete('/:id', authMiddleware, categoryCtrl.delete);

router.post('/',
    authMiddleware,
    uploadCategory.single('image'),
    categoryCtrl.create
);

router.put('/:id',
    authMiddleware,
    uploadCategory.single('image'),
    categoryCtrl.update
);

module.exports = router;
