const mongoose = require('mongoose');

const StockMovementSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, refPath: 'modelType', required: true },
    modelType: { type: String, enum: ['Phone', 'Accessory'], required: true },
    type: { type: String, enum: ['restock', 'sale', 'adjustment'], required: true },
    quantity: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    reference: String, // e.g. supplier name, invoice ID
    handledBy: String,
    note: String,
}, { timestamps: true });

module.exports = mongoose.model('StockMovement', StockMovementSchema);
