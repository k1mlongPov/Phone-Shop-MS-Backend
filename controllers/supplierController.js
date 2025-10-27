const asyncHandler = require('../middleware/asyncHandler');
const Supplier = require('../models/Supplier');

// ✅ Create Supplier
exports.createSupplier = asyncHandler(async (req, res) => {
    const supplier = await Supplier.create(req.body);
    res.status(201).json({
        success: true,
        message: 'Supplier created successfully',
        data: supplier,
    });
});

// ✅ Get all suppliers
exports.getSuppliers = asyncHandler(async (req, res) => {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        total: suppliers.length,
        data: suppliers,
    });
});

// ✅ Get supplier by ID
exports.getSupplierById = asyncHandler(async (req, res) => {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier)
        return res.status(404).json({ message: 'Supplier not found' });
    res.status(200).json(supplier);
});

// ✅ Update Supplier
exports.updateSupplier = asyncHandler(async (req, res) => {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
    });
    if (!supplier)
        return res.status(404).json({ message: 'Supplier not found' });
    res.status(200).json({
        success: true,
        message: 'Supplier updated successfully',
        data: supplier,
    });
});

// ✅ Delete Supplier
exports.deleteSupplier = asyncHandler(async (req, res) => {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier)
        return res.status(404).json({ message: 'Supplier not found' });
    res.status(200).json({
        success: true,
        message: 'Supplier deleted successfully',
    });
});
