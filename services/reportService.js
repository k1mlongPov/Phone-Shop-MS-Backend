const Invoice = require('../models/Invoice');
const StockMovement = require('../models/Stock');
const Phone = require('../models/Phone');
const Accessory = require('../models/Accessory');
const mongoose = require('mongoose');

async function todaySummary() {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);

    const salesAgg = await Invoice.aggregate([
        { $match: { date: { $gte: start, $lte: end }, status: 'paid' } },
        { $group: { _id: null, totalSales: { $sum: '$total' }, invoices: { $sum: 1 } } }
    ]);

    const lowStockPhones = await Phone.find({ $expr: { $lt: ['$stock', '$lowStockThreshold'] } }).limit(10);
    const lowStockAccessories = await Accessory.find({ $expr: { $lt: ['$stock', '$lowStockThreshold'] } }).limit(10);

    return {
        sales: salesAgg[0] || { totalSales: 0, invoices: 0 },
        lowStock: [...lowStockPhones, ...lowStockAccessories]
    };
}

module.exports = { todaySummary };