const Phone = require("../models/Phone");
const Accessory = require("../models/Accessory");
const Supplier = require("../models/Supplier");
const Invoice = require("../models/Invoice");
const Customer = require("../models/Customer");

exports.getDashboardStats = async (req, res) => {
    try {
        let phones = await Phone.find().populate("category supplier");
        let accessories = await Accessory.find().populate("category supplier");

        phones = phones.map(normalizePhone);
        accessories = accessories.map(normalizeAccessory);

        const lowStockPhones = phones.filter(p => p.isLowStock === true);
        const outStockPhones = phones.filter(p => p.isOutOfStock === true);

        const lowStockAccessories = accessories.filter(a => a.isLowStock === true);
        const outStockAccessories = accessories.filter(a => a.isOutOfStock === true);

        const supplierCount = await Supplier.countDocuments();

        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const end = new Date();
        end.setHours(23, 59, 59, 999);

        const todayInvoices = await Invoice.countDocuments({
            createdAt: { $gte: start, $lte: end }
        });

        const todaySalesAgg = await Invoice.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end } } },
            { $group: { _id: null, total: { $sum: "$total" } } }
        ]);

        const todaySales = todaySalesAgg[0]?.total || 0;

        const todayQtyAgg = await Invoice.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end } } },
            { $unwind: "$items" },
            { $group: { _id: null, qty: { $sum: "$items.quantity" } } }
        ]);

        const todayQty = todayQtyAgg[0]?.qty || 0;


        const topSellingWeekly = await getTopSelling(7);
        const topSellingMonthly = await getTopSelling(30);


        const newCustomersToday = await Customer.countDocuments({
            createdAt: { $gte: start, $lte: end }
        });

        res.json({
            success: true,
            data: {
                stock: {
                    low: {
                        phones: lowStockPhones,
                        accessories: lowStockAccessories,
                        total: lowStockPhones.length + lowStockAccessories.length,
                    },
                    outOfStock: {
                        phones: outStockPhones,
                        accessories: outStockAccessories,
                        total: outStockPhones.length + outStockAccessories.length,
                    },
                },
                counts: {
                    phonesTotal: phones.length,
                    accessoriesTotal: accessories.length,
                    suppliersTotal: supplierCount,
                },
                today: {
                    invoices: todayInvoices,
                    sales: todaySales,
                    quantitySold: todayQty,
                    newCustomers: newCustomersToday,
                },
                topSelling: {
                    weekly: topSellingWeekly,
                    monthly: topSellingMonthly
                }
            }
        });

    } catch (err) {
        console.error("Dashboard error:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

async function getTopSelling(days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const result = await Invoice.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $unwind: "$items" },
        {
            $group: {
                _id: {
                    productId: "$items.productId",
                    productName: "$items.productName",
                    modelType: "$items.modelType"
                },
                totalQty: { $sum: "$items.quantity" }
            }
        },
        { $sort: { totalQty: -1 } },
        { $limit: 10 }
    ]);

    return result.map(r => ({
        productId: r._id.productId,
        name: r._id.productName,
        modelType: r._id.modelType,
        quantity: r.totalQty
    }));
}

exports.getSaleHistory = async (req, res) => {
    try {
        // --- Fetch Phones & Accessories with sale history ---
        const phones = await Phone.find()
            .populate("supplier", "name")
            .lean({ virtuals: true });

        const accessories = await Accessory.find()
            .populate("supplier", "name")
            .lean({ virtuals: true });

        const history = [];

        // ------------------------------
        // 📌 Phone sale history
        // ------------------------------
        phones.forEach(phone => {
            if (!phone.saleHistory || phone.saleHistory.length === 0) return;

            phone.saleHistory.forEach(entry => {
                history.push({
                    productId: phone._id,
                    productName: `${phone.brand} ${phone.model}`,
                    modelType: "Phone",
                    variantLabel: null, // (add variant info if you want)
                    quantity: entry.quantity,
                    soldPrice: entry.soldPrice,
                    handledBy: entry.handledBy,
                    customer: entry.customer,
                    supplier: phone.supplier?.name || "Unknown",
                    date: entry.date
                });
            });
        });

        // ------------------------------
        // 📌 Accessory sale history
        // ------------------------------
        accessories.forEach(acc => {
            if (!acc.saleHistory || acc.saleHistory.length === 0) return;

            acc.saleHistory.forEach(entry => {
                history.push({
                    productId: acc._id,
                    productName: acc.name,
                    modelType: "Accessory",
                    variantLabel: null,
                    quantity: entry.quantity,
                    soldPrice: entry.soldPrice,
                    handledBy: entry.handledBy,
                    customer: entry.customer,
                    supplier: acc.supplier?.name || "Unknown",
                    date: entry.date
                });
            });
        });

        // Sort newest → oldest
        history.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({
            success: true,
            count: history.length,
            data: history
        });

    } catch (err) {
        console.error("Sale history error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to load sale history"
        });
    }
};

exports.getSevenDayRevenue = async (req, res) => {
    try {
        const since = new Date();
        since.setDate(since.getDate() - 6);
        since.setHours(0, 0, 0, 0);

        const invoices = await Invoice.find({
            createdAt: { $gte: since.toISOString() }
        }).lean();

        const phoneRevenue = [0, 0, 0, 0, 0, 0, 0];
        const accessoryRevenue = [0, 0, 0, 0, 0, 0, 0];

        invoices.forEach(inv => {
            const created = new Date(inv.createdAt);

            // Map weekday: Mon=0 ... Sun=6
            let dayIndex = created.getDay();
            dayIndex = (dayIndex + 6) % 7;

            inv.items.forEach(item => {
                const model = item.modelType?.toLowerCase();

                // FIXED: Correct revenue calculation
                const revenue = item.totalPrice || 0;

                if (model === "phone") {
                    phoneRevenue[dayIndex] += revenue;
                } else if (model === "accessory") {
                    accessoryRevenue[dayIndex] += revenue;
                }
            });
        });

        res.json({
            success: true,
            phone: phoneRevenue,
            accessory: accessoryRevenue,
        });

    } catch (err) {
        console.error("7-day revenue error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to load 7-day revenue"
        });
    }
};

function normalizePhone(p) {
    if (p.category && typeof p.category === "object") {
        p.category = p.category._id?.toString() ?? null;
    }
    if (p.supplier && typeof p.supplier === "object") {
        p.supplier = p.supplier._id?.toString() ?? null;
    }
    return p;
}

function normalizeAccessory(a) {
    if (a.category && typeof a.category === "object") {
        a.category = a.category._id?.toString() ?? null;
    }
    if (a.supplier && typeof a.supplier === "object") {
        a.supplier = a.supplier._id?.toString() ?? null;
    }
    return a;
}

exports.getRestockHistory = async (req, res) => {
    try {
        // --- Fetch Phones & Accessories with restock history populated ---
        const phones = await Phone.find()
            .populate("supplier", "name")
            .lean({ virtuals: true });

        const accessories = await Accessory.find()
            .populate("supplier", "name")
            .lean({ virtuals: true });

        const history = [];

        // ------------------------------
        // 📌 Extract phone restock entries
        // ------------------------------
        phones.forEach(phone => {
            if (!phone.restockHistory || phone.restockHistory.length === 0) return;

            phone.restockHistory.forEach(entry => {
                history.push({
                    productId: phone._id,
                    productName: `${phone.brand} ${phone.model}`,
                    modelType: "Phone",
                    variantLabel: null, // phone-level restock (not variant)
                    quantity: entry.quantity,
                    note: entry.note || "",
                    supplier: {
                        id: entry.supplier?._id || entry.supplier,
                        name: entry.supplier?.name || phone.supplier?.name || "Unknown"
                    },
                    date: entry.date
                });
            });
        });

        // --------------------------------
        // 📌 Extract accessory restock entries
        // --------------------------------
        accessories.forEach(acc => {
            if (!acc.restockHistory || acc.restockHistory.length === 0) return;

            acc.restockHistory.forEach(entry => {
                history.push({
                    productId: acc._id,
                    productName: acc.name,
                    modelType: "Accessory",
                    variantLabel: null,
                    quantity: entry.quantity,
                    note: entry.note || "",
                    supplier: {
                        id: entry.supplier?._id || entry.supplier,
                        name: entry.supplier?.name || acc.supplier?.name || "Unknown"
                    },
                    date: entry.date
                });
            });
        });

        // Sort newest → oldest
        history.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({
            success: true,
            count: history.length,
            data: history
        });

    } catch (err) {
        console.error("Restock history error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to load restock history"
        });
    }
};

