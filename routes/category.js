const express = require('express');
const router = express.Router();

const categoryCtrl = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware');
const uploadCategoryImage = require('../config/multerCategory');

router.post('/',
    authMiddleware,
    uploadCategoryImage.single('image'),
    categoryCtrl.create
);

router.get('/', authMiddleware, categoryCtrl.getRoot);

router.get('/sub', authMiddleware, categoryCtrl.listSubcategories);

router.get('/sub/:id', authMiddleware, categoryCtrl.getByParent);

router.put('/:id', authMiddleware, categoryCtrl.update);

router.delete('/:id', authMiddleware, categoryCtrl.delete);

module.exports = router;
