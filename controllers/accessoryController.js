const asyncHandler = require('express-async-handler');
const Accessory = require('../models/Accessory');

// Create
exports.createAccessory = asyncHandler(async (req, res) => {
    const { pricing } = req.body;
    if (!pricing || !pricing.purchasePrice || !pricing.sellingPrice) {
        res.status(400);
        throw new Error('Both purchasePrice and sellingPrice are required');
    }

    const accessory = new Accessory(req.body);
    await accessory.save();

    res.status(201).json(accessory);
});

// Read single
exports.getAccessory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const acc = await Accessory.findById(id);
    if (!acc) {
        res.status(404);
        throw new Error('Accessory not found');
    }
    res.json(acc);
});

// List with filters/search/pagination
exports.listAccessories = asyncHandler(async (req, res) => {
    let { page = 1, limit = 20, type, brand, q, sort } = req.query;
    page = parseInt(page); limit = parseInt(limit);

    const filter = {};
    if (type) filter.type = type;
    if (brand) filter.brand = brand;

    let query = Accessory.find(filter);
    if (q) {
        query = Accessory.find({ $text: { $search: q }, ...filter })
            .select({ score: { $meta: "textScore" } })
            .sort({ score: { $meta: "textScore" } });
    }
    if (sort) {
        const [field, dir] = sort.split(':');
        const order = dir === 'desc' ? -1 : 1;
        query = query.sort({ [field]: order });
    }

    const total = await Accessory.countDocuments(filter);
    const accessories = await query.skip((page - 1) * limit).limit(limit).exec();

    res.json({ page, limit, total, pages: Math.ceil(total / limit), data: accessories });
});

// Update
exports.updateAccessory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const acc = await Accessory.findById(id);
    if (!acc) {
        res.status(404);
        throw new Error('Accessory not found');
    }

    Object.assign(acc, req.body);
    await acc.save();
    res.json(acc);
});

// Delete
exports.deleteAccessory = asyncHandler(async (req, res) => {
    const acc = await Accessory.findByIdAndDelete(req.params.id);
    if (!acc) {
        res.status(404);
        throw new Error('Accessory not found');
    }
    res.json({ message: 'Accessory removed' });
});

exports.getTotalProfit = asyncHandler(async (req, res) => {
    const accessories = await Accessory.find();
    const totalProfit = accessories.reduce((sum, a) => {
        if (a.pricing?.purchasePrice && a.pricing?.sellingPrice) {
            return sum + (a.pricing.sellingPrice - a.pricing.purchasePrice);
        }
        return sum;
    }, 0);

    res.json({ totalProfit });
});
