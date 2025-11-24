const asyncHandler = require('../utils/asyncHandler');
const reportService = require('../services/reportService');

exports.today = asyncHandler(async (req, res) => {
    const data = await reportService.todaySummary();
    res.json({ success: true, data });
});