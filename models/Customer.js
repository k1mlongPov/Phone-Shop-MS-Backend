const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: String,
    email: String,
    address: String,
    notes: String,
    purchaseHistory: [
        {
            date: { type: Date, default: Date.now },
            productId: { type: mongoose.Schema.Types.ObjectId, refPath: 'purchaseHistory.modelType' },
            modelType: { type: String, enum: ['Phone', 'Accessory'] },
            quantity: Number,
            totalSpent: Number,
        },
    ],
}, { timestamps: true });

module.exports = mongoose.model('Customer', CustomerSchema);
