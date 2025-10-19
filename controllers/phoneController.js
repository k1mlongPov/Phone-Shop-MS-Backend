const asyncHandler = require('express-async-handler');
const Phone = require('../models/Phone');
const mongoose = require('mongoose');
const multer = require('multer');
const upload = multer();


// Create phone
exports.createPhone = asyncHandler(async (req, res) => {
    const payload = req.body || {};

    const brand = payload.brand?.trim();
    const model = payload.model?.trim();

    if (!brand || !model) {
        return res.status(400).json({ message: 'Brand and Model are required.' });
    }

    // ✅ Auto-generate slug
    const slug =
        !payload.slug || payload.slug.trim() === ''
            ? `${brand}-${model}`.toLowerCase().replace(/\s+/g, '-')
            : payload.slug.trim().toLowerCase().replace(/\s+/g, '-');

    // ✅ Parse pricing JSON string
    let pricing = {};
    if (typeof payload.pricing === 'string') {
        try {
            pricing = JSON.parse(payload.pricing);
        } catch (err) {
            console.warn('Invalid pricing JSON');
            pricing = {};
        }
    } else {
        pricing = payload.pricing || {};
    }

    // ✅ Parse specs JSON string
    if (typeof payload.specs === 'string') {
        try {
            payload.specs = JSON.parse(payload.specs);
        } catch (err) {
            payload.specs = {};
        }
    }

    // ✅ Handle uploaded images
    let images = [];
    if (req.files && req.files.length > 0) {
        images = req.files.map(
            (file) =>
                `${req.protocol}://${req.get('host')}/uploads/phones/${file.filename}`
        );
    }

    // ✅ Create phone
    const phone = await Phone.create({
        brand,
        model,
        slug,
        pricing,
        specs: payload.specs || {},
        category: payload.category,
        supplier: payload.supplier,
        stock: payload.stock || 0,
        images,
    });

    res.status(201).json({
        success: true,
        message: 'Phone created successfully!',
        data: phone,
    });
});

exports.listPhones = asyncHandler(async (req, res) => {
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
        filter.$or = [
            { category },
            { 'category._id': category },
            { 'category._id': new mongoose.Types.ObjectId(category) },
        ];
    }

    let searchQuery = { ...filter };
    if (q && q.trim() !== '') {
        const regex = new RegExp(q.trim(), 'i');
        searchQuery.$or = [
            { brand: regex },
            { model: regex },
            { 'specs.os': regex },
        ];
    }

    let query = Phone.find(searchQuery).populate('category');

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

    const [total, phones] = await Promise.all([
        Phone.countDocuments(searchQuery),
        query.skip(skip).limit(Number(limit)),
    ]);

    res.status(200).json({
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
        data: phones,
    });
});

// Get single phone
exports.getPhoneById = asyncHandler(async (req, res) => {
    const phone = await Phone.findById(req.params.id).populate('category');
    if (!phone) return res.status(404).json({ message: 'Phone not found' });
    res.json(phone);
});

// Update phone
exports.updatePhone = asyncHandler(async (req, res) => {
    const updated = await Phone.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Phone not found' });
    res.json(updated);
});

// Delete phone
exports.deletePhone = asyncHandler(async (req, res) => {
    const deleted = await Phone.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Phone not found' });
    res.json({ message: 'Phone deleted' });
});
