const User = require('../models/User');
const AppError = require('../utils/AppError');

const ALLOWED_ROLES = ["Customer", "Staff", "Admin"];

async function list(query = {}, opts = {}) {
    const { page = 1, limit = 20 } = opts;

    const users = await User.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-password -otp -otpCreatedAt');

    const total = await User.countDocuments(query);

    return { users, total };
}


async function getById(id) {
    const user = await User.findById(id).select('-password -otp -otpCreatedAt');
    if (!user) throw new AppError('User not found', 404);
    return user;
}

async function update(id, data) {
    if (data.password) delete data.password; // password change via separate flow
    const user = await User.findByIdAndUpdate(id, data, { new: true }).select('-password -otp -otpCreatedAt');
    if (!user) throw new AppError('User not found', 404);
    return user;
}

async function setRoles(id, roles) {
    // Validate each role
    for (let r of roles) {
        if (!ALLOWED_ROLES.includes(r)) {
            throw new AppError(`Invalid role: ${r}`, 400);
        }
    }

    const user = await User.findByIdAndUpdate(
        id,
        { roles },
        { new: true }
    ).select('-password -otp -otpCreatedAt');

    if (!user) throw new AppError("User not found", 404);
    return user;
}

async function remove(id) {
    const user = await User.findByIdAndDelete(id);
    if (!user) throw new AppError('User not found', 404);
    return user;
}

module.exports = { list, getById, update, setRoles, remove };