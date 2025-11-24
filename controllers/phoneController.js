const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const PhoneService = require('../services/phoneService');
const { PHONE_CONDITIONS } = require('../models/Phone');
const Phone = require('../models/Phone');
const path = require('path');
const fs = require('fs');
const stockService = require('../services/stockMovementService');
const Supplier = require('../models/Supplier');
const { deleteImage } = require('../utils/cloudinary');


function parsePricing(data) {
    let pricing = { purchasePrice: 0, sellingPrice: 0 };
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
    return pricing;
}

function parseSpecs(data) {
    let specs = {};
    if (data.specs && typeof data.specs === 'object') {
        specs = { ...data.specs };
        if (specs.ram) specs.ram = Number(specs.ram);
        if (specs.storage) specs.storage = Number(specs.storage);
        if (specs.display) {
            if (specs.display.sizeIn) specs.display.sizeIn = Number(specs.display.sizeIn);
            if (specs.display.refreshRate) specs.display.refreshRate = Number(specs.display.refreshRate);
        }
    } else {
        Object.keys(data).forEach((key) => {
            if (key.startsWith('specs[')) {
                const match = key.match(/specs\[(.+?)\](?:\[(.+?)\])?(?:\[(.+?)\])?/);
                if (match) {
                    const [, a, b, c] = match;
                    if (b && c) {
                        specs[a] ??= {};
                        specs[a][b] ??= {};
                        specs[a][b][c] = data[key];
                    } else if (b) {
                        specs[a] ??= {};
                        specs[a][b] = data[key];
                    } else {
                        specs[a] = data[key];
                    }
                }
            }
        });

        if (specs.ram) specs.ram = Number(specs.ram);
        if (specs.storage) specs.storage = Number(specs.storage);
    }
    return specs;
}

function normalizeCondition(val) {
    if (!val) return 'new_company'; // default

    const s = String(val).toLowerCase().trim();

    // Allow some friendly aliases from frontend (if you want)
    if (s === 'used_from_customer' || s === 'used_local' || s === 'local_used') {
        return 'used_local';
    }
    if (s === 'new_company' || s === 'brand_new' || s === 'new_from_company') {
        return 'new_company';
    }
    if (s === 'new_import' || s === 'import_new' || s === 'new_from_outside') {
        return 'new_import';
    }

    // fallback: if client sends exact enum
    if (PHONE_CONDITIONS.includes(s)) return s;

    // final fallback
    return 'new_company';
}

function parseVariants(data) {
    let variants = [];

    // Case 1: Client sends array of variants
    if (Array.isArray(data.variants)) {
        variants = data.variants.map((v) => ({
            storage: v.storage,
            color: v.color,
            condition: normalizeCondition(v.condition),
            pricing: {
                purchasePrice: Number(v.pricing?.purchasePrice) || 0,
                sellingPrice: Number(v.pricing?.sellingPrice) || 0,
            },
            stock: Number(v.stock) || 0,
            sku: v.sku || undefined,
        }));
    } else {
        // Case 2: Flat form-data: variants[0][storage], variants[0][condition], ...
        Object.keys(data).forEach((key) => {
            const match = key.match(/^variants\[(\d+)\]\[(.+?)\](?:\[(.+?)\])?/);
            if (match) {
                const [, index, field, subField] = match;
                const i = parseInt(index, 10);
                variants[i] ??= { pricing: {} };

                if (subField) {
                    variants[i][field] ??= {};
                    variants[i][field][subField] = isNaN(Number(data[key]))
                        ? data[key]
                        : Number(data[key]);
                } else {
                    variants[i][field] = isNaN(Number(data[key]))
                        ? data[key]
                        : Number(data[key]);
                }
            }
        });

        variants = variants
            .filter(Boolean)
            .map((v) => ({
                storage: v.storage,
                color: v.color,
                condition: normalizeCondition(v.condition),
                pricing: {
                    purchasePrice: Number(v.pricing?.purchasePrice) || 0,
                    sellingPrice: Number(v.pricing?.sellingPrice) || 0,
                },
                stock: Number(v.stock) || 0,
                sku: v.sku || undefined,
            }));
    }

    return variants;
}

module.exports = {
    createPhone: asyncHandler(async (req, res) => {
        const data = req.body || {};
        if (!data.brand || !data.model)
            throw new AppError('brand and model are required', 400);

        const pricing = parsePricing(data);
        const specs = parseSpecs(data);
        const variants = parseVariants(data);

        const images = req.files?.length
            ? req.files.map(f => f.path)   // Cloudinary URL
            : [];

        const totalStock = Array.isArray(variants)
            ? variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
            : 0;

        const phoneData = {
            brand: data.brand,
            model: data.model,
            slug: (data.brand + "-" + data.model).toLowerCase(),
            pricing,
            currency: data.currency || 'USD',
            specs,
            variants,
            category: data.category || undefined,
            supplier: data.supplier || undefined,
            stock: totalStock,
            lowStockThreshold: Number(data.lowStockThreshold) || 5,
            images,
            sku: data.sku || undefined,
            isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
        };

        const phone = await PhoneService.createPhone(phoneData);

        await stockService.createMovement({
            productId: phone._id,
            modelType: 'Phone',
            type: 'initial',
            quantity: totalStock,
            reference: 'product_create',
            referenceId: phone._id,
            handledBy: req.user?.id,
            note: 'Initial stock on creation',
        });

        if (phone.supplier) {
            await Supplier.findByIdAndUpdate(
                phone.supplier,
                {
                    $addToSet: {
                        suppliedProducts: {
                            productId: phone._id,
                            modelType: 'Phone',
                            lastRestockDate: new Date(),
                        }
                    }
                }
            );
        }
        res.status(201).json({ success: true, phone });
    }),



    listPhones: asyncHandler(async (req, res) => {
        // forward query params directly; service validates/uses them
        const result = await PhoneService.listPhones(req.query);
        res.json({ success: true, ...result });
    }),

    getPhoneById: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const phone = await PhoneService.getPhoneById(id);
        res.json({ success: true, phone });
    }),

    updatePhone: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const body = req.body || {};

        const phone = await Phone.findById(id);
        if (!phone) throw new AppError("Phone not found", 404);

        const pricing = parsePricing(body);
        const specs = parseSpecs(body);
        const variants = parseVariants(body);

        const newTotalStock = Array.isArray(variants)
            ? variants.reduce((s, v) => s + (Number(v.stock) || 0), 0)
            : phone.stock;

        // 1. Build new image URLs from Cloudinary
        let newImages = req.files?.map(f => f.path) || [];

        // 2. If new images were uploaded, delete old Cloudinary images
        if (newImages.length > 0 && phone.images?.length > 0) {
            for (const imgUrl of phone.images) {
                await deleteImage(imgUrl);
            }
        }

        // 3. Only replace images if new ones were uploaded
        if (newImages.length > 0) {
            images = newImages;
        }


        const newSupplier = body.supplier || null;
        const oldSupplier = phone.supplier?.toString();

        if (oldSupplier && oldSupplier !== newSupplier) {
            // remove link from old supplier
            await Supplier.findByIdAndUpdate(oldSupplier, {
                $pull: { suppliedProducts: { productId: phone._id } }
            });
        }

        if (newSupplier) {
            // add/update link for new supplier
            await Supplier.findByIdAndUpdate(newSupplier, {
                $addToSet: {
                    suppliedProducts: {
                        productId: phone._id,
                        modelType: "Phone",
                        lastRestockDate: new Date()
                    }
                }
            });
        }

        if (newTotalStock !== phone.stock) {
            await stockService.createMovement({
                productId: phone._id,
                modelType: "Phone",
                type: newTotalStock > phone.stock ? "in" : "out",
                quantity: Math.abs(newTotalStock - phone.stock),
                reference: "product_update",
                referenceId: phone._id,
                handledBy: req.user?.id,
                note: "Stock updated via phone edit",
            });
        }

        // ------------------------------------------------
        // UPDATE PHONE
        // ------------------------------------------------
        const updated = await PhoneService.updatePhone(id, {
            brand: body.brand,
            model: body.model,
            slug: (body.brand + "-" + body.model).toLowerCase(),
            pricing,
            currency: body.currency,
            specs,
            variants,
            stock: newTotalStock,
            category: body.category,
            supplier: newSupplier,
            lowStockThreshold: Number(body.lowStockThreshold) || 5,
            isActive: body.isActive !== undefined ? Boolean(body.isActive) : phone.isActive,
            images,
        });

        res.json({
            success: true,
            message: "Phone updated successfully",
            phone: updated,
        });
    }),

    deletePhone: async (req, res, next) => {
        const { id } = req.params;

        const phone = await Phone.findById(id);
        if (!phone) return next(new AppError("Phone not found", 404));

        // Delete each image
        if (Array.isArray(phone.images)) {
            phone.images.forEach(imgUrl => {
                try {
                    // Extract filename from URL
                    const filename = imgUrl.split('/').pop();

                    const filePath = path.join(__dirname, '..', 'uploads', 'phones', filename);

                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        console.log("Deleted:", filePath);
                    }
                } catch (err) {
                    console.error("Error deleting image:", err);
                }
            });
        }

        await phone.deleteOne();

        res.json({ success: true, message: "Phone deleted successfully" });
    },

    // Example: endpoint to adjust stock (optional)
    adjustStock: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { variantIndex, delta } = req.body;
        if (!id) throw new AppError('Phone id required', 400);
        if (typeof delta === 'undefined') throw new AppError('delta required', 400);

        const phone = await PhoneService.adjustStock(id, { variantIndex, delta: Number(delta) });
        res.json({ success: true, phone });
    }),
};
