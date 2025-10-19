const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

router.post('/', categoryController.createCategory);

router.get('/', categoryController.getCategories);

router.get('/:id/subcategories', categoryController.getSubcategories);

router.get('/subcategories', categoryController.listSubcategories);

router.put('/update/:id', categoryController.updateCategory);

router.delete('/delete/:id', categoryController.deleteCategory);

module.exports = router;
