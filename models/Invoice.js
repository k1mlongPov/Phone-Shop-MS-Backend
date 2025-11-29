// models/Invoice.js
const mongoose = require('mongoose');

const InvoiceItemSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'items.modelType',
            required: true,
        },
        productName: { type: String, required: true }, // e.g. "iPhone 14 Pro" or "Sony WH-1000XM5"
        modelType: {
            type: String,
            enum: ['Phone', 'Accessory'],
            required: true,
        },

        // For phones (variants)
        variantId: { type: mongoose.Schema.Types.ObjectId, required: false },
        variantSku: { type: String },
        variantLabel: { type: String }, // e.g. "256GB · Purple · Used Local"

        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        totalPrice: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

const PaymentSchema = new mongoose.Schema(
    {
        method: {
            type: String,
            enum: ['cash', 'card', 'aba', 'wing', 'acleda'],
            default: 'cash',
        },
        paidAmount: { type: Number, required: true },
        change: { type: Number, default: 0 },
        status: {
            type: String,
            enum: ['paid', 'partial', 'unpaid'],
            default: 'paid',
        },
    },
    { _id: false }
);

const InvoiceSchema = new mongoose.Schema(
    {
        invoiceNo: { type: String, required: true, unique: true },

        customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
        customerName: String,
        customerPhone: String,

        items: [InvoiceItemSchema],

        subtotal: { type: Number, required: true },
        discount: { type: Number, default: 0 },
        tax: { type: Number, default: 0 },
        total: { type: Number, required: true },

        payment: PaymentSchema,

        status: {
            type: String,
            enum: ['draft', 'completed', 'cancelled'],
            default: 'completed',
        },

        seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // who created the sale
        notes: String,
    },
    { timestamps: true }
);

module.exports = mongoose.model('Invoice', InvoiceSchema);
