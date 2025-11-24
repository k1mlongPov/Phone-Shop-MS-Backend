const asyncHandler = require('express-async-handler');
const AccessoryService = require('../services/accessoryService');
const AppError = require('../utils/AppError');
const parseAttributes = require('../utils/parseAttributes');
const generateAccessorySku = require('../utils/generateAccessorySku');
const stockService = require('../services/stockMovementService');
const Supplier = require('../models/Supplier');
const fs = require('fs');
const path = require('path');

function parsePricing(payload) {
    if (!payload) return { purchasePrice: 0, sellingPrice: 0 };
    if (payload.pricing && typeof payload.pricing === 'object') {
        return {
            purchasePrice: Number(payload.pricing.purchasePrice) || 0,
            sellingPrice: Number(payload.pricing.sellingPrice) || 0,
        };
    }
    if (payload['pricing[purchasePrice]'] || payload['pricing[sellingPrice]']) {
        return {
            purchasePrice: Number(payload['pricing[purchasePrice]']) || 0,
            sellingPrice: Number(payload['pricing[sellingPrice]']) || 0,
        };
    }
    if (typeof payload.pricing === 'string') {
        try {
            const p = JSON.parse(payload.pricing);
            return {
                purchasePrice: Number(p.purchasePrice) || 0,
                sellingPrice: Number(p.sellingPrice) || 0,
            };
        } catch (_) {
            return { purchasePrice: 0, sellingPrice: 0 };
        }
    }
    return payload.pricing || { purchasePrice: 0, sellingPrice: 0 };
}


module.exports = {
    create: asyncHandler(async (req, res) => {
        const payload = req.body || {};

        const pricing = parsePricing(payload);
        const attributes = parseAttributes(payload);

        let images = [];
        if (req.files?.length) {
            images = req.files.map(
                (file) => `${req.protocol}://${req.get('host')}/uploads/accessories/${file.filename}`
            );
        }

        let compatibility = [];
        if (payload.compatibility) {
            if (Array.isArray(payload.compatibility)) {
                compatibility = payload.compatibility;
            } else if (typeof payload.compatibility === 'object') {
                compatibility = Object.values(payload.compatibility);
            } else if (typeof payload.compatibility === 'string') {
                try {
                    compatibility = JSON.parse(payload.compatibility);
                } catch {
                    compatibility = [payload.compatibility];
                }
            }
        }

        const accessoryPayload = {
            ...payload,
            pricing,
            attributes,
            images,
            compatibility,
            sku: payload.sku || generateAccessorySku(payload.name, payload.type),
        };

        const accessory = await AccessoryService.createAccessory(accessoryPayload);

        await stockService.createMovement({
            productId: accessory._id,
            modelType: 'Accessory',
            type: 'initial',
            quantity: Number(accessoryPayload.stock) || 0,
            reference: 'product_create',
            referenceId: accessory._id,
            handledBy: req.user?.id,
            note: 'Initial stock on creation',
        });

        // ⭐ UPDATE SUPPLIER
        if (accessory.supplier) {
            await Supplier.findByIdAndUpdate(
                accessory.supplier,
                {
                    $addToSet: {
                        suppliedProducts: {
                            productId: accessory._id,
                            modelType: 'Accessory',
                            lastRestockDate: new Date(),
                        }
                    }
                }
            );
        }

        return res.status(201).json({
            status: true,
            message: 'Accessory created successfully!',
            data: accessory,
        });
    }),



    list: asyncHandler(async (req, res) => {
        const result = await AccessoryService.listAccessories(req.query);
        res.status(200).json(result);
    }),

    get: asyncHandler(async (req, res) => {
        const accessory = await AccessoryService.getAccessoryById(req.params.id);
        res.status(200).json(accessory);
    }),

    update: asyncHandler(async (req, res) => {
        const payload = req.body || {};
        const id = req.params.id;

        // normalize pricing if provided via bracketed fields
        if (payload['pricing[purchasePrice]'] || payload['pricing[sellingPrice]']) {
            payload.pricing = {
                purchasePrice: Number(payload['pricing[purchasePrice]']) || 0,
                sellingPrice: Number(payload['pricing[sellingPrice]']) || 0,
            };
        } else if (typeof payload.pricing === 'string') {
            try {
                payload.pricing = JSON.parse(payload.pricing);
            } catch {
                // keep as-is
            }
        }

        // handle uploaded new images (replace if provided)
        let newImages = [];
        if (req.files && req.files.length > 0) {
            newImages = req.files.map(
                (file) =>
                    `${req.protocol}://${req.get('host')}/uploads/accessories/${file.filename}`
            );
        }

        // if new images uploaded, delete old files (best-effort)
        if (newImages.length > 0) {
            try {
                const existing = await AccessoryService.getAccessoryById(id);
                if (existing && existing.images && existing.images.length > 0) {
                    existing.images.forEach((img) => {
                        try {
                            const relativePath = img.replace(`${req.protocol}://${req.get('host')}/`, '');
                            const filePath = path.join(__dirname, '..', relativePath);
                            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                        } catch (e) {
                            console.warn('Failed to delete old image:', e.message);
                        }
                    });
                }
            } catch (e) {
                // ignore if fetching existing fails
            }
            payload.images = newImages;
        }

        const accessory = await AccessoryService.updateAccessory(id, payload);
        res.status(200).json({
            status: true,
            message: 'Accessory updated successfully!',
            data: accessory,
        });
    }),

    delete: async (req, res, next) => {
        const { id } = req.params;

        const accessory = await Accessory.findById(id);
        if (!accessory) return next(new AppError("Accessory not found", 404));

        // Remove images from filesystem
        if (Array.isArray(accessory.images)) {
            accessory.images.forEach(imgUrl => {
                try {
                    const filename = imgUrl.split('/').pop(); // extract the filename
                    const filePath = path.join(__dirname, '..', 'uploads', 'accessories', filename);

                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        console.log("Deleted:", filePath);
                    }
                } catch (err) {
                    console.error("Failed to delete accessory image:", err);
                }
            });
        }

        await accessory.deleteOne();

        res.json({ success: true, message: "Accessory deleted successfully" });
    },

    restock: asyncHandler(async (req, res) => {
        const id = req.params.id;
        const { quantity = 0, note, supplier } = req.body || {};
        const updated = await AccessoryService.restockAccessory(id, {
            quantity,
            note,
            supplier,
        });
        res.json({ status: true, message: 'Accessory restocked', data: updated });
    }),
};