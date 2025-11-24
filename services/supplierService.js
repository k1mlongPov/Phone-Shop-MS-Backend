const Supplier = require('../models/Supplier');
const AppError = require('../utils/AppError');

module.exports = {
    async create(payload) {
        const supplier = await Supplier.create(payload);
        return supplier;
    },

    async list() {
        return await Supplier.find().sort({ createdAt: -1 }).lean();
    },

    async getById(id) {
        const supplier = await Supplier.findById(id);
        if (!supplier) throw new AppError('Supplier not found', 404);
        return supplier;
    },

    async update(id, payload) {
        const updated = await Supplier.findByIdAndUpdate(id, payload, {
            new: true,
        });
        if (!updated) throw new AppError('Supplier not found', 404);
        return updated;
    },

    async delete(id) {
        const deleted = await Supplier.findByIdAndDelete(id);
        if (!deleted) throw new AppError('Supplier not found', 404);
        return true;
    },
};
