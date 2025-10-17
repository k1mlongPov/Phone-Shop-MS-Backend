const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema({
    name: { type: String, required: true },
    contactName: String,
    phone: String,
    email: String,
    address: String,
    notes: String,
    active: { type: Boolean, default: true },
    suppliedProducts: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, refPath: 'suppliedProducts.modelType' },
            modelType: { type: String, enum: ['Phone', 'Accessory'] },
            lastRestockDate: Date,
        },
    ],
}, { timestamps: true });

module.exports = mongoose.model('Supplier', SupplierSchema);

