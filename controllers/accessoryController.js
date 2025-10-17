const asyncHandler = require('express-async-handler');
const Accessory = require('../models/Accessory');
const Category = require('../models/Category');

exports.createAccessory = asyncHandler(async (req, res) => {
    const accessory = await Accessory.create(req.body);
    res.status(201).json(accessory);
});

exports.listAccessories = asyncHandler(async (req, res) => {
    const { page = 1, limit = 12, brand, type, category } = req.query;
    const skip = (page - 1) * limit;
    const filter = {};

    if (brand) filter.brand = brand;
    if (type) filter.type = type;

    if (category) {
        const parent = await Category.findOne({ name: category });
        const subs = parent ? await Category.find({ parent: parent._id }) : [];
        const categoryIds = [parent?._id, ...subs.map((s) => s._id)];
        filter.category = { $in: categoryIds };
    }

    const total = await Accessory.countDocuments(filter);
    const data = await Accessory.find(filter)
        .populate('category')
        .skip(skip)
        .limit(Number(limit));

    res.json({ page, limit, total, pages: Math.ceil(total / limit), data });
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
