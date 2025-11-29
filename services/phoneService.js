// services/phoneService.js
const Phone = require('../models/Phone');
const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

const PhoneService = {
    /**
     * Create phone document.
     * @param {Object} phoneData
     * @returns {Promise<Phone>}
     */
    async createPhone(phoneData) {
        if (!phoneData || !phoneData.brand || !phoneData.model) {
            throw new AppError('brand and model are required', 400);
        }
        const phone = await Phone.create(phoneData);
        return phone;
    },

    async listPhones(opts = {}) {
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

        if (category) {
            if (mongoose.Types.ObjectId.isValid(category)) {
                filter.category = category;
            } else {
                filter['category.name'] = { $regex: category, $options: 'i' };
            }
        }

        if (minPrice || maxPrice) {
            filter.$or = [
                { 'pricing.sellingPrice': {} },
                { 'variants.pricing.sellingPrice': {} },
            ];
            if (minPrice) {
                filter.$or[0]['pricing.sellingPrice'].$gte = Number(minPrice);
                filter.$or[1]['variants.pricing.sellingPrice'].$gte = Number(minPrice);
            }
            if (maxPrice) {
                filter.$or[0]['pricing.sellingPrice'].$lte = Number(maxPrice);
                filter.$or[1]['variants.pricing.sellingPrice'].$lte = Number(maxPrice);
            }
        }

        if (q && String(q).trim() !== '') {
            const regex = new RegExp(String(q).trim(), 'i');
            filter.$or = filter.$or || [];
            filter.$or.push(
                { brand: regex },
                { model: regex },
                { 'specs.os': regex },
                { 'variants.storage': regex }
            );
        }

        let query = Phone.find(filter).populate('category').populate('supplier');

        if (sort) {
            const sortOptions = {
                name: { brand: 1, model: 1 },
                price_asc: { 'pricing.sellingPrice': 1 },
                price_desc: { 'pricing.sellingPrice': -1 },
                stock_asc: { stock: 1 },
                stock_desc: { stock: -1 },
                latest: { createdAt: -1 },
                oldest: { createdAt: 1 },
            };
            query = query.sort(sortOptions[sort] || {});
        }

        const [total, data] = await Promise.all([
            Phone.countDocuments(filter),
            query.skip(skip).limit(Number(limit)),
        ]);

        return {
            status: true,
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / limit),
            data,
        };
    },

    async getPhoneById(id) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new AppError('Invalid phone id', 400);
        }
        const phone = await Phone.findById(id).populate('category').populate('supplier');
        if (!phone) throw new AppError('Phone not found', 404);
        return phone;
    },

    async updatePhone(id, payload) {
        const phone = await Phone.findByIdAndUpdate(id, payload, {
            new: true,
            runValidators: true,
        });

        if (!phone) throw new AppError("Phone not found", 404);

        return phone;
    },

    async deletePhone(id) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new AppError('Invalid phone id', 400);
        }
        const deleted = await Phone.findByIdAndDelete(id);
        if (!deleted) throw new AppError('Phone not found', 404);
        return deleted;
    },

    async adjustStock(id, { variantIndex, delta }) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new AppError('Invalid phone id', 400);
        }
        const phone = await Phone.findById(id);
        if (!phone) throw new AppError('Phone not found', 404);

        if (typeof variantIndex === 'number') {
            if (!phone.variants || !phone.variants[variantIndex]) {
                throw new AppError('Variant not found', 404);
            }
            phone.variants[variantIndex].stock = Math.max(0, (phone.variants[variantIndex].stock || 0) + Number(delta));
            // update denormalized stock if you want to keep in sync
            phone.stock = phone.variants.reduce((s, v) => s + (v.stock || 0), 0);
        } else {
            phone.stock = Math.max(0, (phone.stock || 0) + Number(delta));
        }

        await phone.save();
        return phone;
    },
};

module.exports = PhoneService;
