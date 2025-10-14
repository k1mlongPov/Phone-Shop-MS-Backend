const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

router.get('/', categoryController.getAllCategories); // worked

router.get('/with-children', categoryController.getCategoriesWithChildren);

router.get('/parent/:parentId', categoryController.getSubcategories);

router.get('/:id', categoryController.getCategoryById); // worked

router.post('/', categoryController.createCategory); // worked

router.put('/:id', categoryController.updateCategory); // worked

router.delete('/:id', categoryController.deleteCategory); // worked

module.exports = router;
