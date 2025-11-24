const asyncHandler = require('../utils/asyncHandler');
const categoryService = require('../services/categoryService');

module.exports = {

    create: asyncHandler(async (req, res) => {
        const payload = req.body || {};

        // If image uploaded, attach URL
        if (req.file) {
            payload.image = `${req.protocol}://${req.get('host')}/uploads/categories/${req.file.filename}`;
        }

        const category = await categoryService.create(payload);

        res.status(201).json({
            success: true,
            data: category,
        });
    }),


    getRoot: asyncHandler(async (req, res) => {
        const categories = await categoryService.getRootCategories();
        res.json({ success: true, data: categories });
    }),

    listSubcategories: asyncHandler(async (req, res) => {
        const subcategories = await categoryService.listAllSubcategories();
        res.json({ success: true, data: subcategories });
    }),

    getByParent: asyncHandler(async (req, res) => {
        const parentId = req.params.id;
        const subcategories = await categoryService.getSubcategoriesByParent(parentId);
        res.json({ success: true, data: subcategories });
    }),

    update: asyncHandler(async (req, res) => {
        const updated = await categoryService.update(req.params.id, req.body);
        res.json({ success: true, data: updated });
    }),

    delete: asyncHandler(async (req, res) => {
        await categoryService.delete(req.params.id);
        res.json({ success: true, message: 'Category deleted' });
    })
};
