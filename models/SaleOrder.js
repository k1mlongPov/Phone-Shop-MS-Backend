const mongoose = require('mongoose');

const SaleItemSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'items.modelType',
            required: true,
        },
        modelType: {
            type: String,
            enum: ['Phone', 'Accessory'],
            required: true,
        },

        // For phones (variant-level stock)
        variantId: { type: mongoose.Schema.Types.ObjectId, required: false },

        // Snapshot fields (VERY important so invoice/history never break)
        productName: { type: String, required: true },      // e.g. "iPhone 14 Pro"
        variantLabel: { type: String },                     // e.g. "256 • Purple • New Import"
        sku: { type: String },

        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        totalPrice: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

const SaleOrderSchema = new mongoose.Schema(
    {
        saleNo: { type: String, unique: true }, // "SO-20251127-0001"
        customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },

        items: [SaleItemSchema],

        subtotal: { type: Number, required: true, min: 0 },
        discount: { type: Number, default: 0 },
        total: { type: Number, required: true, min: 0 },

        paymentMethod: {
            type: String,
            enum: ['cash', 'card', 'bank', 'other'],
            default: 'cash',
        },
        paidAmount: { type: Number, required: true, min: 0 },
        changeAmount: { type: Number, default: 0 },

        cashier: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note: String,
    },
    { timestamps: true }
);

module.exports = mongoose.model('SaleOrder', SaleOrderSchema);
