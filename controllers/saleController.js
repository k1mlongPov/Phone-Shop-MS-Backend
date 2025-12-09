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

exports.list = asyncHandler(async (req, res) => {
    const invoices = await saleService.listInvoices(req.query);
    res.json({ success: true, data: invoices });
});

// GET /api/invoices/:id
exports.getById = asyncHandler(async (req, res) => {
    const invoice = await saleService.getInvoiceById(req.params.id);
    if (!invoice) throw new AppError("Invoice not found", 404);

    res.json({ success: true, data: invoice });
});
