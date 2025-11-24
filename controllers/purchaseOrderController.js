const asyncHandler = require('../utils/asyncHandler');
const poService = require('../services/purchaseOrderService');

exports.create = asyncHandler(async (req, res) => {
    const po = await poService.createPO({ supplierId: req.body.supplier, items: req.body.items, notes: req.body.notes });
    res.status(201).json({ success: true, po });
});

exports.receive = asyncHandler(async (req, res) => {
    const receiverId = req.user && req.user.id;
    const po = await poService.receivePO({ poId: req.params.id, receiverId });
    res.json({ success: true, po });
});

exports.list = asyncHandler(async (req, res) => {
    const p = Number(req.query.page) || 1, l = Number(req.query.limit) || 30;
    const result = await poService.list({}, { page: p, limit: l });
    res.json({ success: true, ...result });
});