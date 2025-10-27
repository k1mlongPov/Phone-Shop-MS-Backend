const asyncHandler = require('express-async-handler');
const Phone = require('../models/Phone');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

module.exports = {
    createPhone: asyncHandler(async (req, res) => {
        try {
            const data = req.body;
            console.log("Incoming body:", data);

            // ✅ Step 1: Build pricing (smart handling)
            let pricing = { purchasePrice: 0, sellingPrice: 0 };

            if (data.pricing && typeof data.pricing === 'object') {
                // Parsed nested object case
                pricing = {
                    purchasePrice: Number(data.pricing.purchasePrice) || 0,
                    sellingPrice: Number(data.pricing.sellingPrice) || 0,
                };
            } else if (data['pricing[purchasePrice]'] || data['pricing[sellingPrice]']) {
                // Flattened field case
                pricing = {
                    purchasePrice: Number(data['pricing[purchasePrice]']) || 0,
                    sellingPrice: Number(data['pricing[sellingPrice]']) || 0,
                };
            }

            // ✅ Step 2: Specs
            let specs = {};
            if (data.specs && typeof data.specs === 'object') {
                specs = {
                    os: data.specs.os || '',
                    chipset: data.specs.chipset || '',
                    batteryHealth: Number(data.specs.batteryHealth) || null,
                };
            } else {
                specs = {
                    os: data['specs[os]'] || '',
                    chipset: data['specs[chipset]'] || '',
                    batteryHealth: Number(data['specs[batteryHealth]']) || null,
                };
            }

            // ✅ Step 3: Variants (smart parse)
            let variants = [];
            if (Array.isArray(data.variants)) {
                variants = data.variants.map((v) => ({
                    storage: v.storage,
                    color: v.color,
                    pricing: {
                        purchasePrice: Number(v.pricing?.purchasePrice) || 0,
                        sellingPrice: Number(v.pricing?.sellingPrice) || 0,
                    },
                    stock: Number(v.stock) || 0,
                }));
            } else {
                // If flat fields
                Object.keys(data).forEach((key) => {
                    const match = key.match(/^variants\[(\d+)\]\[(.+)\]$/);
                    if (match) {
                        const index = match[1];
                        const field = match[2];

                        if (!variants[index]) variants[index] = { pricing: {} };

                        if (field.startsWith("pricing")) {
                            const priceField = field.match(/pricing\]\[(.+)\]/)[1];
                            variants[index].pricing[priceField] = Number(data[key]) || 0;
                        } else {
                            variants[index][field] = isNaN(Number(data[key]))
                                ? data[key]
                                : Number(data[key]);
                        }
                    }
                });
            }

            // ✅ Step 4: Build phone data
            const phoneData = {
                brand: data.brand,
                model: data.model,
                slug: data.slug || `${data.brand}-${data.model}`.toLowerCase(),
                pricing,
                specs,
                category: data.category,
                supplier: data.supplier,
                stock: Number(data.stock) || 0,
                lowStockThreshold: Number(data.lowStockThreshold) || 5,
                variants,
                images: req.files
                    ? req.files.map(
                        (f) => `${req.protocol}://${req.get('host')}/uploads/phones/${f.filename}`
                    )
                    : [],

            };

            console.log("🧩 Final phoneData:", phoneData);

            // ✅ Step 5: Save
            const phone = await Phone.create(phoneData);
            res.status(201).json(phone);
        } catch (err) {
            console.error("❌ Create phone error:", err);
            res.status(500).json({ message: err.message });
        }
    }),

    listPhones: asyncHandler(async (req, res) => {
        const {
            page = 1,
            limit = 12,
            brand,
            category,
            minPrice,
            maxPrice,
            q,
            sort,
        } = req.query;

        const skip = (page - 1) * limit;
        const filter = {};

        if (brand) filter.brand = brand;

        if (category) {
            if (mongoose.Types.ObjectId.isValid(category)) {
                filter.category = category;
            } else {
                filter['category.name'] = { $regex: category, $options: 'i' };
            }
        }

        if (minPrice || maxPrice) {
            filter.$or = [
                { 'pricing.sellingPrice': {} },
                { 'variants.pricing.sellingPrice': {} },
            ];
            if (minPrice) {
                filter.$or[0]['pricing.sellingPrice'].$gte = Number(minPrice);
                filter.$or[1]['variants.pricing.sellingPrice'].$gte = Number(minPrice);
            }
            if (maxPrice) {
                filter.$or[0]['pricing.sellingPrice'].$lte = Number(maxPrice);
                filter.$or[1]['variants.pricing.sellingPrice'].$lte = Number(maxPrice);
            }
        }

        let searchQuery = { ...filter };
        if (q && q.trim() !== '') {
            const regex = new RegExp(q.trim(), 'i');
            searchQuery.$or = [
                { brand: regex },
                { model: regex },
                { 'specs.os': regex },
                { 'variants.storage': regex },
            ];
        }

        let query = Phone.find(searchQuery).populate('category').populate('supplier');

        if (sort) {
            const sortOptions = {
                name: { brand: 1, model: 1 },
                price_asc: { 'pricing.sellingPrice': 1 },
                price_desc: { 'pricing.sellingPrice': -1 },
                stock_asc: { stock: 1 },
                stock_desc: { stock: -1 },
                latest: { createdAt: -1 },
                oldest: { createdAt: 1 },
            };
            query = query.sort(sortOptions[sort] || {});
        }

        const [total, phones] = await Promise.all([
            Phone.countDocuments(searchQuery),
            query.skip(skip).limit(Number(limit)),
        ]);

        res.status(200).json({
            status: true,
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / limit),
            data: phones,
        });
    }),

    getPhoneById: asyncHandler(async (req, res) => {
        const phone = await Phone.findById(req.params.id)
            .populate('category')
            .populate('supplier');
        if (!phone) return res.status(404).json({ message: 'Phone not found' });
        res.status(200).json(phone);
    }),

    updatePhone: asyncHandler(async (req, res) => {
        try {
            const { id } = req.params;
            const data = req.body;

            const existingPhone = await Phone.findById(id);
            if (!existingPhone) {
                return res.status(404).json({ message: 'Phone not found' });
            }

            // ✅ Smart parse pricing (works for both nested or flat data)
            let pricing = existingPhone.pricing;
            if (data.pricing && typeof data.pricing === 'object') {
                pricing = {
                    purchasePrice: Number(data.pricing.purchasePrice) || 0,
                    sellingPrice: Number(data.pricing.sellingPrice) || 0,
                };
            } else if (data['pricing[purchasePrice]'] || data['pricing[sellingPrice]']) {
                pricing = {
                    purchasePrice: Number(data['pricing[purchasePrice]']) || 0,
                    sellingPrice: Number(data['pricing[sellingPrice]']) || 0,
                };
            }

            // ✅ Parse specs (supports nested or bracketed)
            let specs = {};
            if (data.specs && typeof data.specs === 'object') {
                specs = {
                    os: data.specs.os || '',
                    chipset: data.specs.chipset || '',
                    batteryHealth: Number(data.specs.batteryHealth) || null,
                };
            } else {
                for (const key in data) {
                    if (key.startsWith('specs[')) {
                        const match = key.match(/specs\[(.+?)\](?:\[(.+?)\])?/);
                        if (match) {
                            const [, parent, child] = match;
                            if (child) {
                                specs[parent] ??= {};
                                specs[parent][child] = data[key];
                            } else {
                                specs[parent] = data[key];
                            }
                        }
                    }
                }
                if (data['specs[batteryHealth]']) {
                    specs.batteryHealth = Number(data['specs[batteryHealth]']);
                }
            }

            // ✅ Parse variants (smart)
            let variants = [];
            if (Array.isArray(data.variants)) {
                variants = data.variants.map((v) => ({
                    storage: v.storage,
                    color: v.color,
                    pricing: {
                        purchasePrice: Number(v.pricing?.purchasePrice) || 0,
                        sellingPrice: Number(v.pricing?.sellingPrice) || 0,
                    },
                    stock: Number(v.stock) || 0,
                }));
            } else {
                Object.keys(data).forEach((key) => {
                    const match = key.match(/^variants\[(\d+)\]\[(.+?)\](?:\[(.+?)\])?/);
                    if (match) {
                        const [_, index, field, subField] = match;
                        const i = parseInt(index, 10);
                        variants[i] ??= { pricing: {} };

                        if (subField) {
                            variants[i][field] ??= {};
                            variants[i][field][subField] = Number(data[key]) || 0;
                        } else {
                            variants[i][field] =
                                isNaN(Number(data[key])) ? data[key] : Number(data[key]);
                        }
                    }
                });
            }

            // ✅ Handle image uploads
            let newImages = existingPhone.images;
            if (req.files && req.files.length > 0) {
                newImages = req.files.map(
                    (file) =>
                        `${req.protocol}://${req.get('host')}/uploads/phones/${file.filename}`
                );
            }

            // ✅ Build update data
            const updatedData = {
                brand: data.brand || existingPhone.brand,
                model: data.model || existingPhone.model,
                slug:
                    data.slug && data.slug.trim() !== ''
                        ? data.slug
                        : `${data.brand}-${data.model}`.toLowerCase(),
                pricing,
                specs,
                category: data.category || existingPhone.category,
                supplier: data.supplier || existingPhone.supplier,
                stock: Number(data.stock) || existingPhone.stock,
                lowStockThreshold:
                    Number(data.lowStockThreshold) || existingPhone.lowStockThreshold,
                variants,
                images: newImages,
            };

            // ✅ Save update
            const updatedPhone = await Phone.findByIdAndUpdate(id, updatedData, {
                new: true,
            });

            res.status(200).json(updatedPhone);
        } catch (error) {
            console.error('❌ Update phone error:', error);
            res.status(500).json({
                message: error.message || 'Failed to update phone.',
            });
        }
    }),

    deletePhone: asyncHandler(async (req, res) => {
        try {
            const { id } = req.params;
            const phone = await Phone.findById(id);

            if (!phone) {
                return res.status(404).json({ message: "Phone not found" });
            }

            // ✅ Extract local file paths from the URLs
            if (phone.images && phone.images.length > 0) {
                phone.images.forEach((imgUrl) => {
                    try {
                        // Convert full URL -> local path
                        // Example: http://localhost:5000/uploads/phones/abc.jpg
                        const relativePath = imgUrl.replace(
                            `${req.protocol}://${req.get("host")}/`,
                            ""
                        );
                        const filePath = path.join(__dirname, "..", relativePath);

                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                            console.log(`🗑️ Deleted file: ${filePath}`);
                        } else {
                            console.warn(`⚠️ File not found: ${filePath}`);
                        }
                    } catch (err) {
                        console.error(`❌ Failed to delete file: ${err.message}`);
                    }
                });
            }

            // ✅ Remove the phone record
            await Phone.findByIdAndDelete(id);

            res.status(200).json({
                status: true,
                message: "Phone and its images deleted successfully",
            });
        } catch (error) {
            console.error("❌ Delete phone error:", error);
            res.status(500).json({
                status: false,
                message: error.message || "Failed to delete phone",
            });
        }
    }),

};
