const Customer = require("../models/Customer");
const User = require("../models/User");

async function listCustomers() {
    return Customer.find().sort({ createdAt: -1 });
}

async function createCustomer(data) {
    return Customer.create(data);
}

async function updateCustomer(id, data) {
    const updated = await Customer.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
    );

    return updated;
}

async function getCustomerById(id) {
    return Customer.findById(id);
}

async function searchCustomers(query) {
    const regex = new RegExp(query, "i");

    return Customer.find({
        $or: [{ name: regex }, { phone: regex }],
    });
}

/**
 * Fetch Users filtered by role (Customer / Staff / Admin)
 */
async function listUsersByRole(role) {
    const query = {};

    if (role) {
        query.roles = role; // roles: ["Admin"] for example
    }

    return User.find(query)
        .select("-password -otp -otpCreatedAt")
        .sort({ createdAt: -1 });
}

module.exports = {
    listCustomers,
    createCustomer,
    updateCustomer,
    getCustomerById,
    searchCustomers,
    listUsersByRole,
};
