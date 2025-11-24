const mongoose = require('mongoose');

const InvoiceItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, refPath: 'items.modelType', required: true },
    modelType: { type: String, enum: ['Phone', 'Accessory'], required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, required: false }, // if using separate variants collection
    variantSku: { type: String, required: false }, // optional
    imei: { type: String, required: false }, // for IMEI-tracked phones (single-quantity items)
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    warrantyMonths: { type: Number, default: 0 }, // warranty given for this item
}, { _id: false });

const InvoiceSchema = new mongoose.Schema({
    invoiceNo: { type: String, required: true, unique: true },
    items: [InvoiceItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, default: 'cash' }, // cash, card, mobile, credit
    paymentDetails: { type: mongoose.Schema.Types.Mixed }, // optional extra data
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: false },
    cashier: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['paid', 'pending', 'refunded'], default: 'paid' },
    notes: String,
}, { timestamps: true });

InvoiceSchema.index({ date: -1 });

module.exports = mongoose.model('Invoice', InvoiceSchema);