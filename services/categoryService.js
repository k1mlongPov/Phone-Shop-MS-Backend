// controllers/categoryService.js  (or wherever your current module lives)
const Category = require('../models/Category');
const AppError = require('../utils/AppError');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 100;

module.exports = {

    async getRootCategories() {
        return await Category.find({ parent: null }).lean();
    },

    async getById(id) {
        return await Category.findById(id);
    },

    async listSubcategories(options = {}) {
        const page = Math.max(parseInt(options.page || DEFAULT_PAGE, 10), 1);
        const limit = Math.max(parseInt(options.limit || DEFAULT_LIMIT, 10), 1);
        const q = options.q ? String(options.q).trim() : null;
        const parentId = options.parentId || null;
        let sortBy = options.sort_by ? String(options.sort_by).trim() : null;
        const sortOrder = (options.sort_order || 'asc').toLowerCase() === 'desc' ? -1 : 1;

        // Build filter
        const filter = {};
        if (parentId) filter.parent = parentId;

        if (q) {
            const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); // escape + case-insensitive
            filter.$or = [{ name: re }, { description: re }];
        }

        // Build sort map. Accept only known fields to avoid injection.
        const sortMap = {};
        switch ((sortBy || 'name').toLowerCase()) {
            case 'createdat':
            case 'created_at':
            case 'created':
                sortMap.createdAt = sortOrder;
                break;
            case 'name':
            default:
                sortMap.name = sortOrder;
                break;
        }

        // total count for pagination
        const total = await Category.countDocuments(filter);
        const pages = Math.max(Math.ceil(total / limit), 1);

        // clamp page
        const safePage = Math.min(page, pages);

        const data = await Category.find(filter)
            .sort(sortMap)
            .skip((safePage - 1) * limit)
            .limit(limit)
            .lean();

        return {
            data,
            page: safePage,
            pages,
            total,
        };
    },

    async getSubcategoriesByParent(parentId) {
        // simple lookup without pagination
        return await Category.find({ parent: parentId }).lean();
    },

    async create(payload) {
        const category = await Category.create(payload);
        return category;
    },

    async update(id, payload) {
        const updated = await Category.findByIdAndUpdate(id, payload, {
            new: true,
            runValidators: true,
        });
        if (!updated) throw new AppError('Category not found', 404);
        return updated;
    },

    async delete(id) {
        const deleted = await Category.findByIdAndDelete(id);
        if (!deleted) throw new AppError('Category not found', 404);
        return true;
    }
};
