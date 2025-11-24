const mongoose = require('mongoose');

const POItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, refPath: 'items.modelType', required: true },
    modelType: { type: String, enum: ['Phone', 'Accessory'], required: true },
    variantSku: { type: String, required: false },
    quantity: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, required: true, min: 0 },
    expectedDate: Date,
}, { _id: false });

const PurchaseOrderSchema = new mongoose.Schema({
    poNo: { type: String, required: true, unique: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    items: [POItemSchema],
    subtotal: Number,
    total: Number,
    status: { type: String, enum: ['created', 'ordered', 'received', 'cancelled'], default: 'created' },
    createdAt: { type: Date, default: Date.now },
    receivedAt: Date,
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String,
}, { timestamps: true });

module.exports = mongoose.model('PurchaseOrder', PurchaseOrderSchema);