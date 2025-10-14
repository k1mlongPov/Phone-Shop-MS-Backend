const mongoose = require('mongoose');

const SpecSchema = new mongoose.Schema({
    chipset: { type: String },               // e.g. "Snapdragon 8 Gen 3"
    ram: { type: Number },                   // in GB
    storage: { type: Number },               // in GB
    display: {
        sizeIn: { type: Number },              // inches
        resolution: { type: String },          // e.g. "2400x1080"
        type: { type: String },                // e.g. "AMOLED", "LCD"
        refreshRate: { type: Number }          // e.g. 120
    },
    cameras: {
        main: { type: String },                // e.g. "108MP"
        front: { type: String }                // e.g. "32MP"
    },
    batteryMah: { type: Number },            // e.g. 5000
    chargingW: { type: Number },             // e.g. 65
    os: { type: String },                    // e.g. "Android 14"
    colors: [String]                         // ["Black", "Blue"]
}, { _id: false });


const PhoneSchema = new mongoose.Schema({
    brand: { type: String, required: true, index: true },
    model: { type: String, required: true, index: true },
    slug: { type: String, required: true, unique: true },
    pricing: {
        purchasePrice: { type: Number, required: true }, // cost when store buys it
        sellingPrice: { type: Number, required: true },  // price to customer
    },
    currency: { type: String, default: 'USD' },
    specs: SpecSchema,
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category', // link to Category
        required: false
    },
    images: [String],
    stock: { type: Number, default: 0 },
    sku: { type: String, unique: true, sparse: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

PhoneSchema.index({ brand: 'text', model: 'text', 'specs.other': 'text' });

PhoneSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

PhoneSchema.virtual('profit').get(function () {
    if (this.pricing?.purchasePrice && this.pricing?.sellingPrice) {
        return this.pricing.sellingPrice - this.pricing.purchasePrice;
    }
    return 0;
});


module.exports = mongoose.model('Phone', PhoneSchema);
