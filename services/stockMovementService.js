const StockMovement = require('../models/Stock');
const Phone = require('../models/Phone');
const Accessory = require('../models/Accessory');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');

async function list(q = {}, opts = {}) {
    const page = opts.page || 1, limit = opts.limit || 50;
    const movements = await StockMovement.find(q).sort({ date: -1 }).skip((page - 1) * limit).limit(limit);
    const total = await StockMovement.countDocuments(q);
    return { movements, total };
}

async function createMovement({ productId, modelType, type, quantity, reference, referenceId, handledBy, note }) {
    if (!productId || !modelType || !type) throw new AppError('Invalid payload', 400);
    const mv = await StockMovement.create({
        productId, modelType, type, quantity, reference, referenceId, handledBy, note
    });
    return mv;
}

module.exports = { list, createMovement };