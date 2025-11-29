const mongoose = require('mongoose');

const PurchaseEntrySchema = new mongoose.Schema(
    {
        date: { type: Date, default: Date.now },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'purchaseHistory.modelType',
        },
        modelType: { type: String, enum: ['Phone', 'Accessory'] },
        variantId: { type: mongoose.Schema.Types.ObjectId },
        quantity: Number,
        totalSpent: Number,

        saleOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'SaleOrder' },
    },
    { _id: false }
);

const CustomerSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        phone: { type: String, unique: true, sparse: true },
        email: String,
        address: String,
        notes: String,
        purchaseHistory: [PurchaseEntrySchema],
    },
    { timestamps: true }
);

module.exports = mongoose.model('Customer', CustomerSchema);
