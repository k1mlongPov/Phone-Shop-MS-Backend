const Customer = require('../models/Customer');
const AppError = require('../utils/AppError');

async function create(data) { return Customer.create(data); }
async function list(q = {}, opts = {}) {
    const page = opts.page || 1, limit = opts.limit || 30;
    const customers = await Customer.find(q).skip((page - 1) * limit).limit(limit);
    const total = await Customer.countDocuments(q);
    return { customers, total };
}
async function getById(id) {
    const c = await Customer.findById(id);
    if (!c) throw new AppError('Customer not found', 404);
    return c;
}
async function update(id, data) {
    const c = await Customer.findByIdAndUpdate(id, data, { new: true });
    if (!c) throw new AppError('Customer not found', 404);
    return c;
}
async function remove(id) {
    const c = await Customer.findByIdAndDelete(id);
    if (!c) throw new AppError('Customer not found', 404);
    return c;
}
module.exports = { create, list, getById, update, remove };