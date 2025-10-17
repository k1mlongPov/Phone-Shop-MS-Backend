const asyncHandler = require('express-async-handler');
const Phone = require('../models/Phone');
const mongoose = require('mongoose');

// Create phone
exports.createPhone = asyncHandler(async (req, res) => {
    const payload = req.body;
    if (!payload.slug) {
        payload.slug = `${payload.brand}-${payload.model}`.toLowerCase().replace(/\s+/g, '-');
    }
    const phone = await Phone.create(payload);
    res.status(201).json(phone);
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
    } = req.query;

    const skip = (page - 1) * limit;
    const filter = {};

    // ✅ Apply filters safely
    if (brand) filter.brand = brand;

    if (minPrice || maxPrice) {
        filter['pricing.sellingPrice'] = {};
        if (minPrice) filter['pricing.sellingPrice'].$gte = Number(minPrice);
        if (maxPrice) filter['pricing.sellingPrice'].$lte = Number(maxPrice);
    }

    // ✅ Category filtering
    if (category) {
        filter.$or = [
            { category: category },
            { 'category._id': category },
            { 'category._id': new mongoose.Types.ObjectId(category) },
        ];
    }

    // ✅ Base query
    let query = Phone.find(filter).populate('category');

    // ✅ Text search (combine properly)
    if (q) {
        query = Phone.find({
            $and: [
                { ...filter },
                { $text: { $search: q } },
            ],
        }).populate('category');
    }

    const total = await Phone.countDocuments(filter);
    const phones = await query.skip(skip).limit(Number(limit));

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
