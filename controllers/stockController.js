const Phone = require('../models/Phone');
const Accessory = require('../models/Accessory');
const Supplier = require('../models/Supplier');
const AppError = require('../utils/AppError');
const stockService = require('../services/stockMovementService');

exports.restockMany = async (req, res, next) => {
    try {
        const { items, supplierId, note } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new AppError('Invalid restock items', 400);
        }

        const updated = [];

        for (const item of items) {
            const { productId, modelType, quantity, variantId } = item;

            if (!productId || !modelType || !quantity) continue;

            // --------------------------------
            // ACCESSORY: simple stock
            // --------------------------------
            if (modelType === 'Accessory') {
                const accessory = await Accessory.findById(productId);
                if (!accessory) continue;

                accessory.stock = (accessory.stock || 0) + Number(quantity);

                accessory.restockHistory.push({
                    date: new Date(),
                    quantity,
                    supplier: supplierId,
                    note: note || '',
                });

                await accessory.save();

                // update supplier lastRestockDate
                if (supplierId) {
                    await Supplier.updateOne(
                        { _id: supplierId, 'suppliedProducts.productId': productId },
                        { $set: { 'suppliedProducts.$.lastRestockDate': new Date() } }
                    );
                }

                await stockService.createMovement({
                    productId,
                    modelType,
                    type: 'restock',
                    quantity,
                    reference: 'supplier_restock',
                    referenceId: supplierId,
                    handledBy: req.user?.id,
                    note: note || '',
                });

                updated.push(accessory);
            }

            // --------------------------------
            // PHONE: restock VARIANT
            // --------------------------------
            if (modelType === 'Phone') {
                if (!variantId) continue; // must specify which variant

                const phone = await Phone.findById(productId);
                if (!phone) continue;

                const variant = phone.variants.id(variantId);
                if (!variant) continue;

                // update variant stock
                variant.stock = (variant.stock || 0) + Number(quantity);

                // recompute phone-level stock as sum of variants
                const total = phone.variants.reduce(
                    (sum, v) => sum + (v.stock || 0),
                    0
                );
                phone.stock = total; // you keep this for quick queries

                // restock history on phone (you can add variant info later if you want)
                phone.restockHistory.push({
                    date: new Date(),
                    quantity,
                    supplier: supplierId,
                    note: note || '',
                });

                await phone.save();

                // update supplier lastRestockDate for this phone
                if (supplierId) {
                    await Supplier.updateOne(
                        { _id: supplierId, 'suppliedProducts.productId': productId },
                        { $set: { 'suppliedProducts.$.lastRestockDate': new Date() } }
                    );
                }

                // global stock movement log
                await stockService.createMovement({
                    productId,
                    variantId,
                    modelType,
                    type: 'restock',
                    quantity,
                    reference: 'supplier_restock',
                    referenceId: supplierId,
                    handledBy: req.user?.id,
                    note: note || '',
                });

                updated.push(phone);
            }
        }

        res.json({
            success: true,
            message: 'Restock completed',
            updated,
        });
    } catch (err) {
        next(err);
    }
};
