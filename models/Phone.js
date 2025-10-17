const mongoose = require('mongoose');

const SpecSchema = new mongoose.Schema({
    chipset: { type: String },
    ram: { type: Number },
    storage: { type: Number },
    display: {
        sizeIn: { type: Number },
        resolution: { type: String },
        type: { type: String },
        refreshRate: { type: Number }
    },
    cameras: {
        main: { type: String },
        front: { type: String }
    },
    batteryMah: { type: Number },
    chargingW: { type: Number },
    os: { type: String },
    colors: [String]
}, { _id: false });

const PhoneSchema = new mongoose.Schema({
    brand: { type: String, required: true, index: true },
    model: { type: String, required: true, index: true },
    slug: { type: String, required: true, unique: true },
    pricing: {
        purchasePrice: { type: Number, required: true },
        sellingPrice: { type: Number, required: true },
    },
    currency: { type: String, default: 'USD' },
    specs: SpecSchema,

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
            handledBy: String, // employee name or id
            customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
        },
    ],
}, { timestamps: true });




PhoneSchema.virtual('profitMargin').get(function () {
    if (!this.pricing?.purchasePrice || !this.pricing?.sellingPrice) return 0;
    const profit = this.pricing.sellingPrice - this.pricing.purchasePrice;
    return Number(((profit / this.pricing.sellingPrice) * 100).toFixed(2));
});

// Index for better search
PhoneSchema.index({ brand: 'text', model: 'text', 'specs.os': 'text' });

module.exports = mongoose.model('Phone', PhoneSchema);
