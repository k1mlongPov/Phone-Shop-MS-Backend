const Accessory = require('../models/Accessory');
const mongoose = require('mongoose');
const AppError = require('../utils/AppError');


const AccessoryService = {
    async createAccessory(payload) {
        const name = payload.name?.trim();
        const type = payload.type?.trim();
        if (!name || !type) throw new AppError('Name and Type are required', 400);

        // sanitize/normalize pricing
        const pricing = payload.pricing || {};
        const purchasePrice = Number(pricing.purchasePrice) || 0;
        const sellingPrice = Number(pricing.sellingPrice) || 0;

        const accessoryData = {
            name,
            type,
            brand: payload.brand,
            pricing: {
                purchasePrice,
                sellingPrice,
            },
            currency: payload.currency || 'USD',
            sku: payload.sku,
            compatibility: payload.compatibility || [],
            stock: Number(payload.stock) || 0,
            lowStockThreshold: Number(payload.lowStockThreshold) || 10,
            attributes: payload.attributes || {},
            category: payload.category || undefined,
            supplier: payload.supplier || undefined,
            isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
            images: payload.images || [],
        };

        const accessory = await Accessory.create(accessoryData);
        return accessory;
    },

    async listAccessories(opts = {}) {
        const {
            page = 1,
            limit = 12,
            brand,
            category,
            minPrice,
            maxPrice,
            q,
            sort,
        } = opts;

        const skip = (Number(page) - 1) * Number(limit);
        const filter = {};

        if (brand) filter.brand = brand;

        if (minPrice != null || maxPrice != null) {
            filter['pricing.sellingPrice'] = {};
            if (minPrice != null) filter['pricing.sellingPrice'].$gte = Number(minPrice);
            if (maxPrice != null) filter['pricing.sellingPrice'].$lte = Number(maxPrice);
        }

        if (category) {
            if (mongoose.Types.ObjectId.isValid(category)) {
                filter.$or = [
                    { category },
                    { 'category._id': category },
                    { 'category._id': new mongoose.Types.ObjectId(category) },
                ];
            } else {
                filter.$or = [
                    { category },
                    { 'category.name': { $regex: category, $options: 'i' } },
                ];
            }
        }

        let searchQuery = { ...filter };
        if (q && q.trim() !== '') {
            const regex = new RegExp(q.trim(), 'i');
            searchQuery.$or = [
                { name: regex },
                { brand: regex },
                { type: regex },
                { 'attributes.color': regex },
            ];
        }

        let query = Accessory.find(searchQuery).populate('category').populate('supplier');

        if (sort) {
            const sortOptions = {
                name: { name: 1 },
                price_asc: { 'pricing.sellingPrice': 1 },
                price_desc: { 'pricing.sellingPrice': -1 },
                stock_asc: { stock: 1 },
                stock_desc: { stock: -1 },
                latest: { createdAt: -1 },
                oldest: { createdAt: 1 },
            };
            query = query.sort(sortOptions[sort] || {});
        }

        const [total, accessories] = await Promise.all([
            Accessory.countDocuments(searchQuery),
            query.skip(skip).limit(Number(limit)),
        ]);

        return {
            status: true,
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / limit),
            data: accessories,
        };
    },

    async getAccessoryById(id) {
        if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid id', 400);
        const accessory = await Accessory.findById(id).populate('category').populate('supplier');
        if (!accessory) throw new AppError('Accessory not found', 404);
        return accessory;
    },

    async updateAccessory(id, payload) {
        if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid id', 400);
        const existing = await Accessory.findById(id);
        if (!existing) throw new AppError('Accessory not found', 404);

        // Handle pricing normalization if provided
        if (payload.pricing) {
            payload.pricing = {
                purchasePrice: Number(payload.pricing.purchasePrice) || 0,
                sellingPrice: Number(payload.pricing.sellingPrice) || 0,
            };
        }

        // Merge arrays/fields carefully
        const updateData = { ...payload };
        const updated = await Accessory.findByIdAndUpdate(id, updateData, { new: true });
        return updated;
    },

    async deleteAccessory(id) {
        if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid id', 400);
        const deleted = await Accessory.findByIdAndDelete(id);
        if (!deleted) throw new AppError('Accessory not found', 404);
        return deleted;
    },

    async restockAccessory(id, { quantity = 0, note, supplier }) {
        if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid id', 400);
        const accessory = await Accessory.findById(id);
        if (!accessory) throw new AppError('Accessory not found', 404);

        const q = Number(quantity) || 0;
        accessory.stock = Math.max(0, (accessory.stock || 0) + q);
        accessory.restockHistory = accessory.restockHistory || [];
        accessory.restockHistory.push({
            date: new Date(),
            quantity: q,
            note: note || '',
            supplier: supplier || accessory.supplier,
        });
        await accessory.save();
        return accessory;
    },
};

module.exports = AccessoryService;