const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const customerService = require("../services/customerService");

// GET /api/customers
exports.list = asyncHandler(async (req, res) => {
    const customers = await customerService.listCustomers();

    res.json({
        success: true,
        data: customers,
    });
});

exports.create = asyncHandler(async (req, res) => {
    const { name, phone, email, address, notes } = req.body;

    if (!name || !phone) {
        throw new AppError("Name and phone are required", 400);
    }

    // Prevent duplicate phone number
    const exists = await customerService.searchCustomers(phone);
    if (exists.length > 0) {
        throw new AppError("Customer with this phone already exists", 400);
    }

    const created = await customerService.createCustomer({
        name,
        phone,
        email,
        address,
        notes,
    });

    res.status(201).json({
        success: true,
        data: created,
    });
});

exports.update = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const updates = req.body;

    const customer = await customerService.getCustomerById(id);
    if (!customer) {
        throw new AppError("Customer not found", 404);
    }

    // Prevent duplicate phone for someone else
    if (updates.phone) {
        const existing = await customerService.searchCustomers(updates.phone);
        const duplicate = existing.find((c) => c._id.toString() !== id);

        if (duplicate) {
            throw new AppError("Phone number already used by another customer", 400);
        }
    }

    const updated = await customerService.updateCustomer(id, updates);

    res.json({
        success: true,
        data: updated,
    });
});

// GET /api/customers/:id
exports.getById = asyncHandler(async (req, res) => {
    const customer = await customerService.getCustomerById(req.params.id);
    if (!customer) throw new AppError("Customer not found", 404);

    res.json({
        success: true,
        data: customer,
    });
});

// GET /api/customers/search/query?q=xxx
exports.search = asyncHandler(async (req, res) => {
    const q = req.query.q || "";

    const results = await customerService.searchCustomers(q);

    res.json({
        success: true,
        data: results,
    });
});

// GET /api/customers/users?role=Customer|Staff|Admin
exports.listUsers = asyncHandler(async (req, res) => {
    const role = req.query.role || null;

    const list = await customerService.listUsersByRole(role);

    res.json({
        success: true,
        data: list,
    });
});
