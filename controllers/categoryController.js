const asyncHandler = require('../utils/asyncHandler');
const categoryService = require('../services/categoryService');
const { deleteImage } = require('../utils/cloudinary');

module.exports = {

    create: asyncHandler(async (req, res) => {
        const payload = req.body || {};

        // If image uploaded, attach URL
        if (req.file) {
            payload.image = req.file.path;   // Cloudinary URL
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
        const id = req.params.id;

        // Fetch existing category
        const existing = await categoryService.getById(id);
        if (!existing) throw new AppError("Category not found", 404);

        const payload = { ...req.body };

        // If new image was uploaded → delete old Cloudinary image
        if (req.file) {
            // delete old image if exists
            if (existing.image) {
                await deleteImage(existing.image);  // Cloudinary delete function
            }

            // assign new Cloudinary URL
            payload.image = req.file.path;
        }
        const updated = await categoryService.update(id, payload);

        res.json({
            success: true,
            data: updated,
        });
    }),


    delete: asyncHandler(async (req, res) => {
        await categoryService.delete(req.params.id);
        res.json({ success: true, message: 'Category deleted' });
    })
};
