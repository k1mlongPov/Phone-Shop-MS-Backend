// models/Phone.js
const mongoose = require('mongoose');
const slugify = require('slugify');

const PHONE_CONDITIONS = ['used_local', 'new_company', 'new_import'];

// A small helper (optional) to generate variant SKU if missing
function buildVariantSku(brand, model, v) {
    const brandCode = (brand || '').toString().trim().slice(0, 3).toUpperCase();
    const modelCode = (model || '').toString().trim().replace(/\s+/g, '').slice(0, 5).toUpperCase();
    const storageCode = (v.storage || '').toString().toUpperCase();   // e.g. '256GB'
    const colorCode = (v.color || '').toString().replace(/\s+/g, '').slice(0, 4).toUpperCase();
    let condCode = 'N';
    if (v.condition === 'used_local') condCode = 'UL';
    else if (v.condition === 'new_company') condCode = 'NC';
    else if (v.condition === 'new_import') condCode = 'NI';

    return [brandCode, modelCode, storageCode, colorCode, condCode]
        .filter(Boolean)
        .join('-');
}

const VariantSchema = new mongoose.Schema(
    {
        storage: { type: String, required: true },
        color: { type: String },
        condition: {
            type: String,
            enum: PHONE_CONDITIONS,
            required: true,
            default: 'new_company',
        },
        pricing: {
            purchasePrice: { type: Number, required: true, min: 0 },
            sellingPrice: { type: Number, required: true, min: 0 },
        },
        stock: { type: Number, default: 0, min: 0 },
        sku: { type: String },
    },
    { _id: true }
);

const SpecSchema = new mongoose.Schema(
    {
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
    },
    { _id: false }
);

const PhoneSchema = new mongoose.Schema(
    {
        brand: { type: String, required: true, index: true },
        model: { type: String, required: true, index: true },
        slug: { type: String, required: true, unique: true },

        pricing: {
            purchasePrice: { type: Number, required: true, min: 0 },
            sellingPrice: { type: Number, required: true, min: 0 },
        },

        currency: { type: String, default: 'USD' },
        specs: SpecSchema,

        variants: [VariantSchema],

        category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
        supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },

        stock: { type: Number, default: 0, min: 0 },

        lowStockThreshold: { type: Number, default: 5, min: 0 },

        images: [String],

        // Optional phone-level SKU (e.g. base model code)
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
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// compute profit margin from base pricing
PhoneSchema.virtual('profitMargin').get(function () {
    if (!this.pricing || !this.pricing.purchasePrice || !this.pricing.sellingPrice) return 0;
    const profit = this.pricing.sellingPrice - this.pricing.purchasePrice;
    return Number(((profit / this.pricing.sellingPrice) * 100).toFixed(2));
});

// total stock aggregated from variants (preferred source of truth)
PhoneSchema.virtual('totalStock').get(function () {
    if (!this.variants || this.variants.length === 0) return this.stock || 0;
    return this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
});

// ---- LOW STOCK & OUT OF STOCK -----
PhoneSchema.virtual("isLowStock").get(function () {
    const total = Array.isArray(this.variants)
        ? this.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
        : this.stock || 0;

    return total <= this.lowStockThreshold && total > 0;
});

PhoneSchema.virtual("isOutOfStock").get(function () {
    const total = Array.isArray(this.variants)
        ? this.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
        : this.stock || 0;

    return total <= 0;
});


// generate slug automatically if missing
PhoneSchema.pre('validate', function (next) {
    if (!this.slug) {
        const s = `${this.brand || ''} ${this.model || ''}`;
        this.slug = slugify(s, { lower: true, strict: true });
    }

    // Auto-generate variant SKU if missing
    if (Array.isArray(this.variants)) {
        this.variants = this.variants.map((v) => {
            if (!v.sku) {
                v.sku = buildVariantSku(this.brand, this.model, v);
            }
            return v;
        });
    }

    next();
});

// Indexes for common queries
PhoneSchema.index({ brand: 1, model: 1 });

module.exports = mongoose.model('Phone', PhoneSchema);
module.exports.PHONE_CONDITIONS = PHONE_CONDITIONS;
