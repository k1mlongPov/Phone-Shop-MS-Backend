
const Invoice = require('../models/Invoice');
const Phone = require('../models/Phone');
const Accessory = require('../models/Accessory');
const Customer = require('../models/Customer');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const stockService = require('./stockMovementService');

// Helpers
function buildPhoneVariantLabel(variant) {
    const parts = [];
    if (variant.storage) parts.push(`${variant.storage}GB`);
    if (variant.color) parts.push(variant.color);
    if (variant.condition) parts.push(variant.condition.replace('_', ' '));
    return parts.join(' · ');
}

async function generateInvoiceNo() {
    // simple: INV-YYYYMMDD-XXXX
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `INV-${y}${m}${d}-${random}`;
}

async function createSale(payload, sellerId) {
    const {
        customerId,
        walkInCustomer,
        items,
        payment,
        discount = 0,
        tax = 0,
        notes,
    } = payload || {};

    if (!Array.isArray(items) || items.length === 0) {
        throw new AppError('At least 1 item is required for a sale', 400);
    }
    if (!payment || typeof payment.paidAmount !== 'number') {
        throw new AppError('Payment information is required', 400);
    }

    // ---- Load customer (optional) ----
    let customer = null;
    if (customerId) {
        customer = await Customer.findById(customerId);
        if (!customer) throw new AppError('Customer not found', 404);
    }

    // ---- Process items ----
    const invoiceItems = [];
    let subtotal = 0;

    for (const item of items) {
        const { productId, modelType, quantity, variantId } = item;

        if (!productId || !modelType || !quantity) {
            throw new AppError('Each item needs productId, modelType, quantity', 400);
        }

        if (modelType === 'Phone') {
            const phone = await Phone.findById(productId);
            if (!phone) throw new AppError('Phone not found', 404);

            let variant = null;
            if (variantId) {
                variant = phone.variants.id(variantId);
                if (!variant) throw new AppError('Phone variant not found', 404);
            } else if (phone.variants.length === 1) {
                variant = phone.variants[0];
            } else {
                throw new AppError(
                    'variantId is required for phones with multiple variants',
                    400
                );
            }

            if ((variant.stock || 0) < quantity) {
                throw new AppError(
                    `Not enough stock for ${phone.brand} ${phone.model} (${buildPhoneVariantLabel(
                        variant
                    )})`,
                    400
                );
            }

            // selling price
            const unitPrice =
                (variant.pricing && variant.pricing.sellingPrice) ||
                (phone.pricing && phone.pricing.sellingPrice) ||
                0;

            const lineTotal = unitPrice * quantity;
            subtotal += lineTotal;

            // Decrease stock
            variant.stock = (variant.stock || 0) - quantity;

            // Sync phone.stock with total variant stock
            phone.stock = phone.variants.reduce(
                (sum, v) => sum + (v.stock || 0),
                0
            );

            if (!Array.isArray(phone.saleHistory)) phone.saleHistory = [];
            phone.saleHistory.push({
                date: new Date(),
                quantity,
                soldPrice: unitPrice,
                handledBy: sellerId?.toString(),
                customer: customer?._id,
            });

            // Save once
            await phone.save();

            const variantLabel = buildPhoneVariantLabel(variant);

            invoiceItems.push({
                productId: phone._id,
                productName: `${phone.brand} ${phone.model}`,
                modelType: 'Phone',
                variantId: variant._id,
                variantSku: variant.sku,
                variantLabel,
                quantity,
                unitPrice,
                totalPrice: lineTotal,
            });

            // Record stock movement
            await stockService.createMovement({
                productId: phone._id,
                modelType: 'Phone',
                type: 'sale',
                quantity: quantity,
                reference: 'invoice_sale',
                handledBy: sellerId?.toString(),
                note: `Sold via invoice`,
            });
        }
        else if (modelType === 'Accessory') {
            const accessory = await Accessory.findById(productId);
            if (!accessory) throw new AppError('Accessory not found', 404);

            if ((accessory.stock || 0) < quantity) {
                throw new AppError(`Not enough stock for ${accessory.name}`, 400);
            }

            const unitPrice =
                (accessory.pricing && accessory.pricing.sellingPrice) || 0;

            const lineTotal = unitPrice * quantity;
            subtotal += lineTotal;

            accessory.stock = (accessory.stock || 0) - quantity;

            // sale history
            if (!Array.isArray(accessory.saleHistory)) accessory.saleHistory = [];
            accessory.saleHistory.push({
                date: new Date(),
                quantity,
                soldPrice: unitPrice,
                handledBy: sellerId?.toString(),
                customer: customer?._id,
            });

            await accessory.save();

            invoiceItems.push({
                productId: accessory._id,
                productName: accessory.name,
                modelType: 'Accessory',
                quantity,
                unitPrice,
                totalPrice: lineTotal,
            });

            await stockService.createMovement({
                productId: accessory._id,
                modelType: 'Accessory',
                type: 'sale',
                quantity,
                reference: 'invoice_sale',
                handledBy: sellerId?.toString(),
                note: 'Sold via invoice',
            });
        } else {
            throw new AppError('Invalid modelType (must be Phone or Accessory)', 400);
        }
    }

    const total = subtotal - discount + tax;

    // payment.change
    const paidAmount = payment.paidAmount || 0;
    const change = paidAmount - total;
    const paymentStatus =
        paidAmount >= total
            ? 'paid'
            : paidAmount > 0
                ? 'partial'
                : 'unpaid';

    const invoiceNo = await generateInvoiceNo();

    const invoice = await Invoice.create({
        invoiceNo,
        customer: customer?._id,
        customerName:
            customer?.name || walkInCustomer?.name || 'Walk-in Customer',
        customerPhone: customer?.phone || walkInCustomer?.phone || '',
        items: invoiceItems,
        subtotal,
        discount,
        tax,
        total,
        payment: {
            method: payment.method || 'cash',
            paidAmount,
            change: change > 0 ? change : 0,
            status: paymentStatus,
        },
        status: 'completed',
        seller: sellerId,
        notes,
    });

    // ---- Update Customer purchaseHistory ----
    if (customer) {
        for (const it of invoiceItems) {
            customer.purchaseHistory.push({
                date: new Date(),
                productId: it.productId,
                modelType: it.modelType,
                quantity: it.quantity,
                totalSpent: it.totalPrice,
            });
        }
        await customer.save();
    }

    // ---- Update User purchaseHistory (sales handled by this user) ----
    if (sellerId) {
        const user = await User.findById(sellerId);
        if (user) {
            if (!Array.isArray(user.purchaseHistory)) user.purchaseHistory = [];
            for (const it of invoiceItems) {
                user.purchaseHistory.push({
                    productId: it.productId,
                    quantity: it.quantity,
                    price: it.totalPrice,
                    purchaseDate: new Date(),
                });
            }
            await user.save();
        }
    }

    return invoice;
}

async function listInvoices({ customer, start, end, status }) {
    const query = {};

    if (customer) query.customer = customer;
    if (status) query.status = status;

    if (start || end) {
        query.createdAt = {};
        if (start) query.createdAt.$gte = new Date(start);
        if (end) query.createdAt.$lte = new Date(end);
    }

    return Invoice.find(query)
        .sort({ createdAt: -1 })
        .select("-__v");
}

async function getInvoiceById(id) {
    return Invoice.findById(id).select("-__v");
}

module.exports = {
    createSale,
    getInvoiceById,
    listInvoices,
};
