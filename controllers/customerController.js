const asyncHandler = require('../utils/asyncHandler');
const customerService = require('../services/customerService');

exports.create = asyncHandler(async (req, res) => {
    const c = await customerService.create(req.body);
    res.status(201).json({ success: true, customer: c });
});
exports.list = asyncHandler(async (req, res) => {
    const p = Number(req.query.page) || 1, l = Number(req.query.limit) || 30;
    const result = await customerService.list({}, { page: p, limit: l });
    res.json({ success: true, ...result });
});
exports.get = asyncHandler(async (req, res) => {
    const c = await customerService.getById(req.params.id);
    res.json({ success: true, customer: c });
});
exports.update = asyncHandler(async (req, res) => {
    const c = await customerService.update(req.params.id, req.body);
    res.json({ success: true, customer: c });
});
exports.delete = asyncHandler(async (req, res) => {
    await customerService.remove(req.params.id);
    res.json({ success: true });
});