const asyncHandler = require('express-async-handler');
const Customer = require('../models/Customer');

exports.createCustomer = asyncHandler(async (req, res) => {
    const customer = await Customer.create(req.body);
    res.status(201).json(customer);
});

exports.listCustomers = asyncHandler(async (req, res) => {
    const customers = await Customer.find().populate('purchaseHistory.productId');
    res.json(customers);
});

exports.updateCustomer = asyncHandler(async (req, res) => {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
});

exports.deleteCustomer = asyncHandler(async (req, res) => {
    const deleted = await Customer.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Customer not found' });
    res.json({ message: 'Customer deleted' });
});
