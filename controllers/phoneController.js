const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const Phone = require('../models/Phone');

// Create phone
exports.createPhone = asyncHandler(async (req, res) => {
    const payload = req.body;

    if (!payload.pricing || !payload.pricing.purchasePrice || !payload.pricing.sellingPrice) {
        res.status(400);
        throw new Error('Both purchasePrice and sellingPrice are required');
    }

    if (!payload.slug) {
        payload.slug = `${payload.brand}-${payload.model}`.toLowerCase().replace(/\s+/g, '-');
    }

    const phone = new Phone(payload);
    await phone.save();
    res.status(201).json(phone);
});


// Get phone by id or slug
// GET /api/phones?category=xxxx
exports.getPhones = async (req, res) => {
    try {
        const { category } = req.query;
        const query = {};

        // ✅ Filter by category if provided
        if (category) {
            query.category = category;
        }

        // Fetch phones with optional filter
        const phones = await Phone.find(query).populate('category');

        res.status(200).json({
            success: true,
            count: phones.length,
            data: phones,
        });
    } catch (error) {
        console.error('getPhones error:', error);
        res.status(500).json({ message: error.message });
    }
};


// List phones with filters, search, pagination
exports.listPhones = asyncHandler(async (req, res) => {
    let { page = 1, limit = 12, brand, minPrice, maxPrice, q, sort } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const filter = {};
    if (brand) filter.brand = brand;
    if (minPrice) filter.price = { ...filter.price, $gte: Number(minPrice) };
    if (maxPrice) filter.price = { ...filter.price, $lte: Number(maxPrice) };

    let query = Phone.find(filter);

    if (q) {
        query = Phone.find({ $text: { $search: q }, ...filter });
        // include textScore for sorting by relevance
        query = query.select({ score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } });
    } else if (sort) {
        // Example sort values: price:asc, price:desc, newest
        const [field, dir] = sort.split(':');
        const order = dir === 'desc' ? -1 : 1;
        if (field === 'newest') query = query.sort({ createdAt: -1 });
        else query = query.sort({ [field]: order });
    }

    const total = await Phone.countDocuments(filter);
    const phones = await query.skip((page - 1) * limit).limit(limit).exec();

    res.json({
        page, limit, total, pages: Math.ceil(total / limit), data: phones
    });
});

// Update phone
exports.updatePhone = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const phone = await Phone.findById(id);
    if (!phone) {
        res.status(404);
        throw new Error('Phone not found');
    }

    // ✅ merge updates
    Object.assign(phone, req.body);

    await phone.save();
    res.json(phone);
});

// Delete phone
exports.deletePhone = asyncHandler(async (req, res) => {
    const phone = await Phone.findByIdAndDelete(req.params.id);
    if (!phone) {
        res.status(404);
        throw new Error('Phone not found');
    }
    res.json({ message: 'Phone deleted successfully' });
});



// Change stock (increment or set)
exports.updateStock = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { delta, set } = req.body;
    const phone = await Phone.findById(id);
    if (!phone) { res.status(404); throw new Error('Phone not found'); }

    if (typeof set === 'number') phone.stock = set;
    else if (typeof delta === 'number') phone.stock = Math.max(0, phone.stock + delta);
    else { res.status(400); throw new Error('Provide delta or set in body'); }

    await phone.save();
    res.json(phone);
});

exports.getTotalProfit = asyncHandler(async (req, res) => {
    const phones = await Phone.find();
    const totalProfit = phones.reduce((acc, phone) => {
        if (phone.pricing?.purchasePrice && phone.pricing?.sellingPrice) {
            return acc + (phone.pricing.sellingPrice - phone.pricing.purchasePrice);
        }
        return acc;
    }, 0);

    res.json({ totalProfit });
});

