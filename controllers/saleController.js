const asyncHandler = require('../utils/asyncHandler');
const saleService = require('../services/saleService');

exports.createSale = asyncHandler(async (req, res) => {
    const sellerId = req.user?.id; // from authMiddleware
    const invoice = await saleService.createSale(req.body, sellerId);

    res.status(201).json({
        success: true,
        data: invoice,
    });
});

exports.getInvoice = asyncHandler(async (req, res) => {
    const invoice = await saleService.getInvoiceById(req.params.id);

    res.json({
        success: true,
        data: invoice,
    });
});

exports.listInvoices = asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const result = await saleService.listInvoices({ page, limit });

    res.json({
        success: true,
        ...result,
    });
});
