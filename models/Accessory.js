const mongoose = require('mongoose');

const AccessorySchema = new mongoose.Schema({
    name: { type: String, required: true, index: true },
    type: { type: String, required: true, index: true }, // e.g. case, charger, cable, headphones
    brand: String,
    pricing: {
        purchasePrice: { type: Number, required: true },
        sellingPrice: { type: Number, required: true }
    },
    currency: { type: String, default: 'USD' },

    sku: { type: String, unique: true, sparse: true },
    images: [String],
    compatibility: [String], // list of phone slugs/models this accessory supports
    stock: { type: Number, default: 0 },
    attributes: mongoose.Schema.Types.Mixed, // free-form attributes (e.g., material, length, connectors)
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

AccessorySchema.virtual('profit').get(function () {
    if (this.pricing?.purchasePrice && this.pricing?.sellingPrice) {
        return this.pricing.sellingPrice - this.pricing.purchasePrice;
    }
    return 0;
});

AccessorySchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Accessory', AccessorySchema);
