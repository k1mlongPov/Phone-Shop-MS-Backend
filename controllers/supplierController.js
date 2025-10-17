const asyncHandler = require('express-async-handler');
const Supplier = require('../models/Supplier');

exports.createSupplier = asyncHandler(async (req, res) => {
    const supplier = await Supplier.create(req.body);
    res.status(201).json(supplier);
});

exports.getAllSuppliers = asyncHandler(async (req, res) => {
    const suppliers = await Supplier.find().lean();
    res.json(suppliers);
});

exports.updateSupplier = asyncHandler(async (req, res) => {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
    res.json(supplier);
});

exports.deleteSupplier = asyncHandler(async (req, res) => {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
    res.json({ message: 'Supplier deleted' });
});
