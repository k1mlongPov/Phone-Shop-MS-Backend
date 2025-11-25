const asyncHandler = require('../utils/asyncHandler');
const supplierService = require('../services/supplierService');

module.exports = {

    list: asyncHandler(async (req, res) => {
        const suppliers = await supplierService.list();
        res.status(200).json({
            success: true,
            total: suppliers.length,
            data: suppliers,
        });
    }),

    get: asyncHandler(async (req, res) => {
        const supplier = await supplierService.getById(req.params.id);
        res.status(200).json({
            success: true,
            data: supplier,
        });
    }),

    create: asyncHandler(async (req, res) => {
        const supplier = await supplierService.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Supplier created successfully',
            data: supplier,
        });
    }),

    update: asyncHandler(async (req, res) => {
        const supplier = await supplierService.update(req.params.id, req.body);
        res.status(200).json({
            success: true,
            message: 'Supplier updated successfully',
            data: supplier,
        });
    }),

    delete: asyncHandler(async (req, res) => {
        await supplierService.delete(req.params.id);
        res.status(200).json({
            success: true,
            message: 'Supplier deleted successfully',
        });
    }),
};
