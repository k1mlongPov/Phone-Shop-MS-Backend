const asyncHandler = require('../utils/asyncHandler');
const invoiceService = require('../services/invoiceService');

exports.create = asyncHandler(async (req, res) => {
    const cashierId = req.user && req.user.id;
    const inv = await invoiceService.createInvoice({ ...req.body, cashierId });
    res.status(201).json({ success: true, invoice: inv });
});

exports.list = asyncHandler(async (req, res) => {
    const p = Number(req.query.page) || 1, l = Number(req.query.limit) || 30;
    const result = await invoiceService.list({}, { page: p, limit: l });
    res.json({ success: true, ...result });
});

exports.get = asyncHandler(async (req, res) => {
    const inv = await invoiceService.get(req.params.id);
    res.json({ success: true, invoice: inv });
});