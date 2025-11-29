const Phone = require("../models/Phone");
const Accessory = require("../models/Accessory");
const Supplier = require("../models/Supplier");

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

        res.json({
            success: true,
            data: {
                lowStock: {
                    phones: lowStockPhones,
                    accessories: lowStockAccessories,
                },
                outOfStock: {
                    phones: outStockPhones,
                    accessories: outStockAccessories,
                },
                counts: {
                    lowStockTotal: lowStockPhones.length + lowStockAccessories.length,
                    outOfStockTotal: outStockPhones.length + outStockAccessories.length,
                    phonesTotal: phones.length,
                    accessoriesTotal: accessories.length,
                    suppliersTotal: supplierCount,
                }
            }
        });
    } catch (err) {
        console.error("Dashboard error:", err);
        res.status(500).json({ success: false, message: "Server Error" });
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

