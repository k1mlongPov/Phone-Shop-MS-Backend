const StockMovement = require('../models/Stock');
const AppError = require('../utils/AppError');

async function createMovement({
    productId,
    modelType,
    type,
    quantity,
    reference,
    referenceId,
    handledBy,
    note,
    variantId,
}) {
    if (!productId || !modelType || !type) {
        throw new AppError('Invalid payload for stock movement', 400);
    }

    const mv = await StockMovement.create({
        productId,
        modelType,
        type,
        quantity,
        reference,
        referenceId,
        handledBy,
        note,
        variantId,
    });

    return mv;
}

module.exports = { createMovement };
