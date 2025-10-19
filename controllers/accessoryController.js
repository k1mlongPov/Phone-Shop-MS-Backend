const asyncHandler = require('express-async-handler');
const Accessory = require('../models/Accessory');
const mongoose = require('mongoose');

exports.createAccessory = asyncHandler(async (req, res) => {
    const accessory = await Accessory.create(req.body);
    res.status(201).json(accessory);
});

exports.listAccessories = asyncHandler(async (req, res) => {
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
                { category: category },
                { 'category._id': category },
                { 'category._id': new mongoose.Types.ObjectId(category) },
            ];
        } else {
            filter.$or = [
                { category: category },
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
            { model: regex },
            { description: regex },
        ];
    }

    let query = Accessory.find(searchQuery).populate('category');
    if (sort) {
        const sortOptions = {
            name: { name: 1 },
            price: { 'pricing.sellingPrice': 1 },
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
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
        data: accessories,
    });
});



exports.getAccessoryById = asyncHandler(async (req, res) => {
    const accessory = await Accessory.findById(req.params.id).populate('category');
    if (!accessory) return res.status(404).json({ message: 'Accessory not found' });
    res.json(accessory);
});

exports.updateAccessory = asyncHandler(async (req, res) => {
    const updated = await Accessory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Accessory not found' });
    res.json(updated);
});

exports.deleteAccessory = asyncHandler(async (req, res) => {
    const deleted = await Accessory.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Accessory not found' });
    res.json({ message: 'Accessory deleted' });
});
