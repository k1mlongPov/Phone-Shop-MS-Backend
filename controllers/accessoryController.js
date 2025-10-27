const asyncHandler = require('express-async-handler');
const Accessory = require('../models/Accessory');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

module.exports = {
    createAccessory: asyncHandler(async (req, res) => {
        const payload = req.body || {};

        const name = payload.name?.trim();
        const type = payload.type?.trim();

        if (!name || !type) {
            return res.status(400).json({ message: 'Name and Type are required.' });
        }

        // Handle nested or JSON pricing
        let pricing = {};
        if (payload['pricing[purchasePrice]'] || payload['pricing[sellingPrice]']) {
            pricing = {
                purchasePrice: Number(payload['pricing[purchasePrice]']) || 0,
                sellingPrice: Number(payload['pricing[sellingPrice]']) || 0,
            };
        } else if (typeof payload.pricing === 'string') {
            try {
                pricing = JSON.parse(payload.pricing);
            } catch {
                pricing = {};
            }
        } else {
            pricing = payload.pricing || {};
        }

        // Handle attributes (JSON or bracketed fields)
        let attributes = {};
        if (Object.keys(payload).some((k) => k.startsWith('attributes['))) {
            attributes = {};
            for (const key in payload) {
                if (key.startsWith('attributes[')) {
                    const match = key.match(/attributes\[(.+?)\](?:\[(.+?)\])?/);
                    if (match) {
                        const [, parent, child] = match;
                        if (child) {
                            attributes[parent] ??= {};
                            attributes[parent][child] = payload[key];
                        } else {
                            attributes[parent] = payload[key];
                        }
                    }
                }
            }
        } else if (typeof payload.attributes === 'string') {
            try {
                attributes = JSON.parse(payload.attributes);
            } catch {
                attributes = {};
            }
        } else {
            attributes = payload.attributes || {};
        }

        // Handle uploaded images
        let images = [];
        if (req.files && req.files.length > 0) {
            images = req.files.map(
                (file) =>
                    `${req.protocol}://${req.get('host')}/uploads/accessories/${file.filename}`
            );
        }
        let compatibility = [];
        if (payload.compatibility) {
            if (Array.isArray(payload.compatibility)) {
                compatibility = payload.compatibility;
            } else if (typeof payload.compatibility === 'object') {
                compatibility = Object.values(payload.compatibility);
            }
        }
        // Create accessory
        const accessory = await Accessory.create({
            name,
            type,
            brand: payload.brand,
            pricing,
            currency: payload.currency || 'USD',
            sku: payload.sku,
            compatibility,
            stock: payload.stock || 0,
            lowStockThreshold: payload.lowStockThreshold || 10,
            attributes,
            category: payload.category,
            supplier: payload.supplier,
            isActive: payload.isActive ?? true,
            images,
        });

        res.status(201).json({
            status: true,
            message: 'Accessory created successfully!',
            data: accessory,
        });
    }),

    listAccessories: asyncHandler(async (req, res) => {
        const {
            page = 1,
            limit = 12,
            brand,
            category,
            minPrice,
            maxPrice,
            q,
            sort,
        } = req.query;

        const skip = (page - 1) * limit;
        const filter = {};

        if (brand) filter.brand = brand;

        if (minPrice || maxPrice) {
            filter['pricing.sellingPrice'] = {};
            if (minPrice) filter['pricing.sellingPrice'].$gte = Number(minPrice);
            if (maxPrice) filter['pricing.sellingPrice'].$lte = Number(maxPrice);
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

        res.status(200).json({
            status: true,
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / limit),
            data: accessories,
        });
    }),

    getAccessoryById: asyncHandler(async (req, res) => {
        const accessory = await Accessory.findById(req.params.id)
            .populate('category')
            .populate('supplier');
        if (!accessory)
            return res.status(404).json({ message: 'Accessory not found' });
        res.status(200).json(accessory);
    }),

    updateAccessory: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const payload = req.body;

        // Handle pricing
        if (payload['pricing[purchasePrice]'] || payload['pricing[sellingPrice]']) {
            payload.pricing = {
                purchasePrice: Number(payload['pricing[purchasePrice]']) || 0,
                sellingPrice: Number(payload['pricing[sellingPrice]']) || 0,
            };
        }

        // Handle new images
        let newImages = [];
        if (req.files && req.files.length > 0) {
            newImages = req.files.map(
                (file) =>
                    `${req.protocol}://${req.get('host')}/uploads/accessories/${file.filename}`
            );
        }

        const existing = await Accessory.findById(id);
        if (!existing) {
            return res.status(404).json({ message: 'Accessory not found' });
        }

        // Delete old images if new ones uploaded
        if (newImages.length > 0 && existing.images.length > 0) {
            existing.images.forEach((img) => {
                const relativePath = img.replace(`${req.protocol}://${req.get('host')}/`, '');
                const filePath = path.join(__dirname, '..', relativePath);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            });
        }

        // Apply update
        const accessory = await Accessory.findByIdAndUpdate(
            id,
            {
                ...payload,
                ...(newImages.length > 0 ? { images: newImages } : {}),
            },
            { new: true }
        );

        res.status(200).json({
            status: true,
            message: 'Accessory updated successfully!',
            data: accessory,
        });
    }),

    deleteAccessory: asyncHandler(async (req, res) => {
        const deleted = await Accessory.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Accessory not found' });
        res.json({ status: true, message: 'Accessory deleted' });
    }),
};
