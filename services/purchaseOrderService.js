const mongoose = require('mongoose');
const PurchaseOrder = require('../models/PurchaseOrder');
const { generatePoNo } = require('../utils/numberHelpers');
const Phone = require('../models/Phone');
const Accessory = require('../models/Accessory');
const StockMovement = require('../models/Stock');
const AppError = require('../utils/AppError');

async function createPO({ supplierId, items, notes }) {
    const poNo = await generatePoNo();
    const po = await PurchaseOrder.create({ poNo, supplier: supplierId, items, notes });
    return po;
}

// receive PO -> update stocks + stock movements
async function receivePO({ poId, receiverId, receivedAt = new Date() }) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const po = await PurchaseOrder.findById(poId).session(session);
        if (!po) throw new AppError('PO not found', 404);
        if (po.status === 'received') throw new AppError('PO already received', 400);

        for (const item of po.items) {
            if (item.modelType === 'Phone') {
                const phone = await Phone.findById(item.productId).session(session);
                if (!phone) throw new AppError('Phone not found', 404);
                // update variant if sku provided
                if (phone.variants && phone.variants.length > 0 && item.variantSku) {
                    const variant = phone.variants.find(v => v.sku === item.variantSku);
                    if (!variant) throw new AppError('Variant not found', 404);
                    variant.stock = (variant.stock || 0) + item.quantity;
                    phone.stock = (phone.stock || 0) + item.quantity;
                    await phone.save({ session });
                } else {
                    phone.stock = (phone.stock || 0) + item.quantity;
                    await phone.save({ session });
                }

                await StockMovement.create([{
                    productId: phone._id,
                    modelType: 'Phone',
                    type: 'restock',
                    quantity: item.quantity,
                    reference: po.poNo,
                    referenceId: po._id,
                    handledBy: receiverId ? receiverId.toString() : undefined,
                }], { session });
            } else if (item.modelType === 'Accessory') {
                const acc = await Accessory.findById(item.productId).session(session);
                if (!acc) throw new AppError('Accessory not found', 404);
                acc.stock = (acc.stock || 0) + item.quantity;
                await acc.save({ session });

                await StockMovement.create([{
                    productId: acc._id,
                    modelType: 'Accessory',
                    type: 'restock',
                    quantity: item.quantity,
                    reference: po.poNo,
                    referenceId: po._id,
                    handledBy: receiverId ? receiverId.toString() : undefined,
                }], { session });
            }
        }

        po.status = 'received';
        po.receivedAt = receivedAt;
        po.receiver = receiverId;
        await po.save({ session });

        await session.commitTransaction();
        session.endSession();
        return po;
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
}

async function list(q = {}, opts = {}) {
    const page = opts.page || 1, limit = opts.limit || 30;
    const result = await PurchaseOrder.find(q).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
    const total = await PurchaseOrder.countDocuments(q);
    return { pos: result, total };
}

module.exports = { createPO, receivePO, list };