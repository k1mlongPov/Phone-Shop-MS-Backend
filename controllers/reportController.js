const asyncHandler = require('express-async-handler');
const Phone = require('../models/Phone');
const Accessory = require('../models/Accessory');

// Total profit (phones + accessories)
exports.getTotalProfit = asyncHandler(async (req, res) => {
    const phones = await Phone.find({}, 'pricing');
    const accessories = await Accessory.find({}, 'pricing');

    const totalPhoneProfit = phones.reduce((acc, p) => {
        if (p.pricing?.purchasePrice && p.pricing?.sellingPrice)
            acc += p.pricing.sellingPrice - p.pricing.purchasePrice;
        return acc;
    }, 0);

    const totalAccessoryProfit = accessories.reduce((acc, a) => {
        if (a.pricing?.purchasePrice && a.pricing?.sellingPrice)
            acc += a.pricing.sellingPrice - a.pricing.purchasePrice;
        return acc;
    }, 0);

    res.json({
        totalProfit: totalPhoneProfit + totalAccessoryProfit,
        phoneProfit: totalPhoneProfit,
        accessoryProfit: totalAccessoryProfit,
    });
});

// Low-stock report
exports.getLowStockItems = asyncHandler(async (req, res) => {
    const lowPhones = await Phone.find({ $expr: { $lte: ['$stock', '$lowStockThreshold'] } })
        .select('brand model stock lowStockThreshold');
    const lowAccessories = await Accessory.find({ $expr: { $lte: ['$stock', '$lowStockThreshold'] } })
        .select('name type stock lowStockThreshold');

    res.json({ lowPhones, lowAccessories });
});

// Top brands by inventory count
exports.getTopBrands = asyncHandler(async (req, res) => {
    const result = await Phone.aggregate([
        { $group: { _id: '$brand', totalStock: { $sum: '$stock' } } },
        { $sort: { totalStock: -1 } },
        { $limit: 5 },
    ]);
    res.json(result);
});

// Average profit margin by brand
exports.getBrandProfitMargins = asyncHandler(async (req, res) => {
    const result = await Phone.aggregate([
        {
            $group: {
                _id: '$brand',
                avgMargin: {
                    $avg: {
                        $multiply: [
                            {
                                $divide: [
                                    { $subtract: ['$pricing.sellingPrice', '$pricing.purchasePrice'] },
                                    '$pricing.sellingPrice',
                                ],
                            },
                            100,
                        ],
                    },
                },
            },
        },
        { $sort: { avgMargin: -1 } },
    ]);
    res.json(result);
});
