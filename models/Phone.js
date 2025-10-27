const mongoose = require('mongoose');

const VariantSchema = new mongoose.Schema({
    storage: { type: String, required: true }, // e.g., "64GB", "128GB"
    color: { type: String },                   // optional
    pricing: {
        purchasePrice: { type: Number, required: true },
        sellingPrice: { type: Number, required: true },
    },
    stock: { type: Number, default: 0 },
    sku: { type: String, unique: true, sparse: true },
});

const SpecSchema = new mongoose.Schema({
    chipset: { type: String },
    ram: { type: Number },
    storage: { type: Number },
    display: {
        sizeIn: { type: Number },
        resolution: { type: String },
        type: { type: String },
        refreshRate: { type: Number },
    },
    cameras: {
        main: { type: String },
        front: { type: String },
    },
    batteryHealth: { type: Number },
    chargingW: { type: Number },
    os: { type: String },
    colors: [String],
}, { _id: false });

const PhoneSchema = new mongoose.Schema({
    brand: { type: String, required: true, index: true },
    model: { type: String, required: true, index: true },
    slug: { type: String, required: true, unique: true },

    // Base pricing (for backward compatibility)
    pricing: {
        purchasePrice: { type: Number, required: true },
        sellingPrice: { type: Number, required: true },
    },

    currency: { type: String, default: 'USD' },
    specs: SpecSchema,

    // NEW VARIANTS ARRAY
    variants: [VariantSchema],

    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },

    stock: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },

    images: [String],
    sku: { type: String, unique: true, sparse: true },
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
}, { timestamps: true });

PhoneSchema.virtual('profitMargin').get(function () {
    if (!this.pricing?.purchasePrice || !this.pricing?.sellingPrice) return 0;
    const profit = this.pricing.sellingPrice - this.pricing.purchasePrice;
    return Number(((profit / this.pricing.sellingPrice) * 100).toFixed(2));
});

PhoneSchema.index({ brand: 'text', model: 'text', 'specs.os': 'text' });

module.exports = mongoose.model('Phone', PhoneSchema);
