const mongoose = require('mongoose');

const CounterSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true }, // e.g. invoice:20250115
    seq: { type: Number, default: 0 },
});

module.exports = mongoose.model('Counter', CounterSchema);