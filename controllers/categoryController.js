const asyncHandler = require('express-async-handler');
const Category = require('../models/Category');



exports.createCategory = asyncHandler(async (req, res) => {
    const category = await Category.create(req.body);
    res.status(201).json(category);
});

exports.getCategories = async (req, res) => {
    const categories = await Category.find({ parent: null }).lean();
    res.json(categories);
};

exports.listSubcategories = asyncHandler(async (req, res) => {
    const subcategories = await Category.find({ parent: { $ne: null } });
    res.status(200).json(subcategories);
});

exports.getSubcategories = async (req, res) => {
    const subcategories = await Category.find({ parent: req.params.id }).lean();
    res.json(subcategories);
};
// Update category
exports.updateCategory = asyncHandler(async (req, res) => {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
});

// Delete category
exports.deleteCategory = asyncHandler(async (req, res) => {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted' });
});
