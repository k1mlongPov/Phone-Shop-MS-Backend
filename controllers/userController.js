const asyncHandler = require('../utils/asyncHandler');
const userService = require('../services/userService');

exports.list = asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const role = req.query.role;
    const filter = {};

    if (role) {
        filter.roles = role; // matches if array contains the role
    }

    const result = await userService.list(filter, { page, limit });
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

exports.updateRoles = asyncHandler(async (req, res) => {
    const { roles } = req.body;

    if (!Array.isArray(roles)) {
        throw new AppError("Roles must be an array", 400);
    }

    const updated = await userService.setRoles(req.params.id, roles);

    res.json({
        success: true,
        user: updated,
    });
});

exports.delete = asyncHandler(async (req, res) => {
    await userService.remove(req.params.id);
    res.json({ success: true });
});