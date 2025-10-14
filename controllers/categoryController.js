const mongoose = require('mongoose');
const Category = require('../models/Category');

// GET /api/categories
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/categories/:id
exports.getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/categories
exports.createCategory = async (req, res) => {
    try {
        console.log('createCategory body:', req.body);

        const { name, description, image, parent } = req.body;

        let parentId = null;
        if (parent) {
            if (!mongoose.Types.ObjectId.isValid(parent)) {
                return res.status(400).json({ message: 'Invalid parent id' });
            }
            parentId = parent;
        }

        const category = new Category({
            name,
            description: description || '',
            image: image || '',
            parent: parentId
        });

        await category.save();

        // Optionally populate parent in response
        const populated = await Category.findById(category._id).populate('parent');
        return res.status(201).json(populated);
    } catch (err) {
        console.error('createCategory error:', err);
        return res.status(500).json({ message: err.message });
    }
};

// PUT /api/categories/:id
exports.updateCategory = async (req, res) => {
    try {
        const { name, description, image, parent } = req.body;
        const update = { name, description, image };
        if (parent !== undefined) {
            if (parent && !mongoose.Types.ObjectId.isValid(parent)) {
                return res.status(400).json({ message: 'Invalid parent id' });
            }
            update.parent = parent || null;
        }
        const category = await Category.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!category) return res.status(404).json({ message: 'Category not found' });
        res.json(category);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// DELETE /api/categories/:id
exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/categories/parent/:parentId  <- returns direct children of parentId
exports.getSubcategories = async (req, res) => {
    try {
        const parentId = req.params.parentId;
        if (!mongoose.Types.ObjectId.isValid(parentId)) {
            return res.status(400).json({ message: 'Invalid parent id' });
        }
        const children = await Category.find({ parent: parentId });
        res.json(children);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/categories/with-children  <- top-level categories populated with one-level subcategories
exports.getCategoriesWithChildren = async (req, res) => {
    try {
        const categories = await Category.find({ parent: null }).populate('subcategories').lean();
        res.json(categories);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};


