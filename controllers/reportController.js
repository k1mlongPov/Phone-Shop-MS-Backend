const Phone = require('../models/Phone');
const Accessory = require('../models/Accessory');

exports.getTotalProfitSummary = async (req, res) => {
    try {
        const phones = await Phone.find();
        const accessories = await Accessory.find();

        const phoneProfit = phones.reduce((acc, p) => acc + (p.pricing.sellingPrice - p.pricing.purchasePrice), 0);
        const accessoryProfit = accessories.reduce((acc, a) => acc + (a.pricing.sellingPrice - a.pricing.purchasePrice), 0);

        res.json({
            totalProfit: phoneProfit + accessoryProfit,
            details: {
                phones: phoneProfit,
                accessories: accessoryProfit
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

// GET /api/reports/monthly-profit
exports.getMonthlyProfit = async (req, res) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const phones = await Phone.aggregate([
        {
            $group: {
                _id: { $month: "$createdAt" },
                profit: { $sum: { $subtract: ["$pricing.sellingPrice", "$pricing.purchasePrice"] } }
            }
        },
        { $sort: { "_id": 1 } }
    ]);

    const accessories = await Accessory.aggregate([
        {
            $group: {
                _id: { $month: "$createdAt" },
                profit: { $sum: { $subtract: ["$pricing.sellingPrice", "$pricing.purchasePrice"] } }
            }
        },
        { $sort: { "_id": 1 } }
    ]);

    res.json({
        phones: phones.map(p => ({ month: months[p._id - 1], profit: p.profit })),
        accessories: accessories.map(a => ({ month: months[a._id - 1], profit: a.profit })),
    });
};

