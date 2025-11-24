const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Phone = require('../models/Phone');
const Accessory = require('../models/Accessory');
const StockMovement = require('../models/Stock');
const AppError = require('../utils/AppError');
const { generateInvoiceNo } = require('../utils/numberHelpers');

async function createInvoice({ items, paymentMethod = 'cash', customerId = null, cashierId = null }) {
    if (!items || !Array.isArray(items) || items.length === 0) throw new AppError('Invoice items required', 400);

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // compute totals
        let subtotal = 0;
        for (const it of items) {
            it.total = Number(it.unitPrice) * Number(it.quantity);
            subtotal += it.total;
        }
        const tax = 0; const discount = 0; const total = subtotal + tax - discount;
        const invoiceNo = await generateInvoiceNo();

        const invoice = await Invoice.create([{ invoiceNo, items, subtotal, tax, discount, total, paymentMethod, customer: customerId, cashier: cashierId }], { session });
        const inv = invoice[0];

        // update stocks per item
        for (const it of items) {
            if (it.modelType === 'Phone') {
                const phone = await Phone.findById(it.productId).session(session);
                if (!phone) throw new AppError('Phone not found', 404);

                if (phone.variants && phone.variants.length > 0 && it.variantSku) {
                    const variant = phone.variants.find(v => v.sku === it.variantSku);
                    if (!variant) throw new AppError('Variant not found', 404);
                    if ((variant.stock || 0) < it.quantity) throw new AppError('Insufficient stock', 400);
                    variant.stock = variant.stock - it.quantity;
                    phone.stock = Math.max(0, (phone.stock || 0) - it.quantity);
                    await phone.save({ session });
                } else {
                    if ((phone.stock || 0) < it.quantity) throw new AppError('Insufficient stock', 400);
                    phone.stock = phone.stock - it.quantity;
                    await phone.save({ session });
                }

                await StockMovement.create([{
                    productId: phone._id,
                    modelType: 'Phone',
                    type: 'sale',
                    quantity: it.quantity,
                    reference: invoiceNo,
                    referenceId: inv._id,
                    handledBy: cashierId ? cashierId.toString() : undefined,
                }], { session });

                if (it.imei) {
                    // TODO: update IMEI model if you implement it
                }
            } else if (it.modelType === 'Accessory') {
                const acc = await Accessory.findById(it.productId).session(session);
                if (!acc) throw new AppError('Accessory not found', 404);
                if ((acc.stock || 0) < it.quantity) throw new AppError('Insufficient stock', 400);
                acc.stock = acc.stock - it.quantity;
                await acc.save({ session });

                await StockMovement.create([{
                    productId: acc._id,
                    modelType: 'Accessory',
                    type: 'sale',
                    quantity: it.quantity,
                    reference: invoiceNo,
                    referenceId: inv._id,
                    handledBy: cashierId ? cashierId.toString() : undefined,
                }], { session });
            } else {
                throw new AppError('Unknown item type', 400);
            }
        }

        await session.commitTransaction();
        session.endSession();
        return inv;
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
}

async function list(q = {}, opts = {}) {
    const page = opts.page || 1; const limit = opts.limit || 30;
    const invoices = await Invoice.find(q).sort({ date: -1 }).skip((page - 1) * limit).limit(limit);
    const total = await Invoice.countDocuments(q);
    return { invoices, total };
}

async function get(id) {
    const inv = await Invoice.findById(id);
    if (!inv) throw new AppError('Invoice not found', 404);
    return inv;
}

module.exports = { createInvoice, list, get };