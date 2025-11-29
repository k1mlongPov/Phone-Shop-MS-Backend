const mongoose = require('mongoose');

const AccessorySchema = new mongoose.Schema({
    name: { type: String, required: true, index: true },
    type: { type: String, required: true, index: true },
    brand: String,
    pricing: {
        purchasePrice: { type: Number, required: true },
        sellingPrice: { type: Number, required: true },
    },
    currency: { type: String, default: 'USD' },
    sku: { type: String, unique: true, sparse: true },
    images: [String],
    compatibility: [String],
    stock: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 10 },
    attributes: mongoose.Schema.Types.Mixed,
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    isActive: { type: Boolean, default: true },
    restockHistory: [
        {
            date: { type: Date, default: Date.now },
            quantity: Number,
            note: String,
            supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
        },
    ],
    saleHistory: [
        {
            date: { type: Date, default: Date.now },
            quantity: Number,
            soldPrice: Number,
            handledBy: String,
            customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
        },
    ],
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

AccessorySchema.virtual('profitMargin').get(function () {
    if (!this.pricing?.purchasePrice || !this.pricing?.sellingPrice) return 0;
    const profit = this.pricing.sellingPrice - this.pricing.purchasePrice;
    return Number(((profit / this.pricing.sellingPrice) * 100).toFixed(2));
});

AccessorySchema.virtual("isLowStock").get(function () {
    const stock = this.stock ?? 0;
    const threshold = this.lowStockThreshold ?? 0;

    return stock <= threshold && stock > 0;
});

AccessorySchema.virtual("isOutOfStock").get(function () {
    const stock = this.stock ?? 0;
    return stock <= 0;
});



AccessorySchema.index({ name: 'text', brand: 'text', type: 'text' });

module.exports = mongoose.model('Accessory', AccessorySchema);

