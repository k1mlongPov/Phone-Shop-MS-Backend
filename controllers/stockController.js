const asyncHandler = require('express-async-handler');
const StockMovement = require('../models/Stock');

exports.logMovement = asyncHandler(async (req, res) => {
    const movement = await StockMovement.create(req.body);
    res.status(201).json(movement);
});

exports.listMovements = asyncHandler(async (req, res) => {
    const { type, modelType } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (modelType) filter.modelType = modelType;
    const data = await StockMovement.find(filter)
        .populate('productId')
        .sort({ createdAt: -1 });
    res.json(data);
});
