const asyncHandler = require('express-async-handler');
const AccessoryService = require('../services/accessoryService');
const AppError = require('../utils/AppError');
const parseAttributes = require('../utils/parseAttributes');
const generateAccessorySku = require('../utils/generateAccessorySku');
const stockService = require('../services/stockMovementService');
const Supplier = require('../models/Supplier');
const Accessory = require('../models/Accessory');
const fs = require('fs');
const path = require('path');
const { deleteImage } = require('../utils/cloudinary');

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

    list: asyncHandler(async (req, res) => {
        const result = await AccessoryService.listAccessories(req.query);
        res.status(200).json(result);
    }),

    get: asyncHandler(async (req, res) => {
        const accessory = await AccessoryService.getAccessoryById(req.params.id);
        res.status(200).json(accessory);
    }),

    create: asyncHandler(async (req, res) => {
        const payload = req.body || {};

        const pricing = parsePricing(payload);
        const attributes = parseAttributes(payload);

        const images = req.files?.length
            ? req.files.map(f => f.path)   // Cloudinary URLs
            : [];

        let compatibility = [];
        if (payload.compatibility) {
            if (Array.isArray(payload.compatibility)) {
                compatibility = payload.compatibility;
            }
            else if (typeof payload.compatibility === 'object') {
                compatibility = Object.values(payload.compatibility);
            }
            else if (typeof payload.compatibility === 'string') {
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

        if (accessory.supplier) {
            await Supplier.findByIdAndUpdate(accessory.supplier, {
                $addToSet: {
                    suppliedProducts: {
                        productId: accessory._id,
                        modelType: 'Accessory',
                        lastRestockDate: new Date(),
                    }
                }
            });
        }

        res.status(201).json({
            status: true,
            message: 'Accessory created successfully!',
            data: accessory,
        });
    }),

    update: asyncHandler(async (req, res) => {
        const id = req.params.id;
        const payload = req.body || {};

        let accessory = await Accessory.findById(id);
        if (!accessory) throw new AppError("Accessory not found", 404);

        /** -------------------------
         * 1. Parse pricing + attributes
         * ------------------------- */
        const pricing = parsePricing(payload);
        const attributes = parseAttributes(payload);

        /** -------------------------
         * 2. Compatibility parsing
         * ------------------------- */
        let compatibility = accessory.compatibility || [];

        if (payload.compatibility) {
            if (Array.isArray(payload.compatibility)) {
                compatibility = payload.compatibility;
            } else if (typeof payload.compatibility === "object") {
                compatibility = Object.values(payload.compatibility);
            } else if (typeof payload.compatibility === "string") {
                try {
                    compatibility = JSON.parse(payload.compatibility);
                } catch {
                    compatibility = [payload.compatibility];
                }
            }
        }

        /** -------------------------
         * 3. Handle images (Cloudinary)
         * ------------------------- */
        const newImages = req.files?.map(f => f.path) || [];

        if (newImages.length > 0) {
            // delete old cloudinary images
            if (Array.isArray(accessory.images)) {
                for (const url of accessory.images) {
                    await deleteImage(url); // assumes your function extracts public_id
                }
            }
            payload.images = newImages;
        }

        /** -------------------------
         * 4. Handle supplier update
         * ------------------------- */
        const oldSupplier = accessory.supplier;
        const newSupplier = payload.supplier;

        if (newSupplier && newSupplier !== oldSupplier?.toString()) {
            // remove from old supplier
            if (oldSupplier) {
                await Supplier.findByIdAndUpdate(oldSupplier, {
                    $pull: {
                        suppliedProducts: { productId: accessory._id }
                    }
                });
            }

            // add to new supplier
            await Supplier.findByIdAndUpdate(newSupplier, {
                $addToSet: {
                    suppliedProducts: {
                        productId: accessory._id,
                        modelType: "Accessory",
                        lastRestockDate: new Date(),
                    }
                }
            });
        }

        /** -------------------------
         * 5. Prepare update payload
         * ------------------------- */
        const finalPayload = {
            ...payload,
            pricing,
            attributes,
            compatibility,
        };

        /** -------------------------
         * 6. Update accessory
         * ------------------------- */
        const updated = await AccessoryService.updateAccessory(id, finalPayload);

        res.status(200).json({
            status: true,
            message: "Accessory updated successfully!",
            data: updated,
        });
    }),

    delete: async (req, res, next) => {
        const { id } = req.params;

        const accessory = await Accessory.findById(id);
        if (!accessory) return next(new AppError("Accessory not found", 404));

        // Delete Cloudinary images
        if (Array.isArray(accessory.images)) {
            for (const imgUrl of accessory.images) {
                try {
                    await deleteImage(imgUrl);
                } catch (err) {
                    console.error("Failed to delete accessory image:", err);
                }
            }
        }

        // DELETE ACCESSORY
        await accessory.deleteOne();

        // 🧹 CLEAN SUPPLIER REFERENCES
        await Supplier.updateMany(
            {},
            { $pull: { suppliedProducts: { productId: id } } }
        );

        res.json({
            success: true,
            message: "Accessory deleted successfully",
        });
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

    getLowStockAccessories: async (req, res) => {
        const accessories = await Accessory.find()
            .lean({ virtuals: true })
            .populate("category supplier");

        const filtered = accessories.filter(a => a.isLowStock);

        res.json({
            success: true,
            count: filtered.length,
            data: filtered,
        });
    },

    getOutOfStockAccessories: async (req, res) => {
        const accessories = await Accessory.find()
            .lean({ virtuals: true })
            .populate("category supplier");

        const filtered = accessories.filter(a => a.isOutOfStock);

        res.json({
            success: true,
            count: filtered.length,
            data: filtered,
        });
    },

};