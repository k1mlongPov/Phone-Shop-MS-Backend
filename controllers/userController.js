const asyncHandler = require('../utils/asyncHandler');
const userService = require('../services/userService');

exports.list = asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await userService.list({}, { page, limit });
    res.json({ success: true, ...result });
});

exports.get = asyncHandler(async (req, res) => {
    const user = await userService.getById(req.params.id);
    res.json({ success: true, user });
});

exports.update = asyncHandler(async (req, res) => {
    const user = await userService.update(req.params.id, req.body);
    res.json({ success: true, user });
});

exports.delete = asyncHandler(async (req, res) => {
    await userService.remove(req.params.id);
    res.json({ success: true });
});