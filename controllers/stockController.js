const asyncHandler = require('../utils/asyncHandler');
const stockService = require('../services/stockMovementService');

exports.list = asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const q = {}; // add filters
    const result = await stockService.list(q, { page, limit });
    res.json({ success: true, ...result });
});

exports.create = asyncHandler(async (req, res) => {
    const mv = await stockService.createMovement(req.body);
    res.status(201).json({ success: true, movement: mv });
});