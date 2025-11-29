const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

function getToken(req) {
    // handle common header names
    const header = req.headers.authorization || req.headers.Authorization || req.headers['x-access-token'] || req.query.token;
    if (!header) return null;

    // header may be "Bearer <token>" or just "<token>"
    const parts = String(header).trim().split(/\s+/);
    if (parts.length === 1) {
        // only token provided
        return parts[0];
    }
    if (parts.length === 2) {
        const [type, token] = parts;
        if (type.toLowerCase() !== 'bearer') return null;
        return token;
    }
    return null;
}


module.exports = async function authMiddleware(req, res, next) {
    try {
        const token = getToken(req);
        if (!token) return next(new AppError('Authentication token missing', 401));

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded || !decoded.id) return next(new AppError('Invalid token', 401));

        // Fetch user WITHOUT mixing inclusion/exclusion projections
        // Option A: simple approach - query normally then filter out sensitive fields
        const user = await User.findById(decoded.id);

        if (!user) return next(new AppError('User not found', 401));

        const roles = Array.isArray(user.roles) ? user.roles.map(r => String(r).toLowerCase()) : [];
        const isAdmin = roles.includes('admin');

        // attach a *safe* user object to req (avoid sending otp/password back)
        req.user = {
            id: user._id,
            roles,
            isAdmin,
            email: user.email,
            username: user.username,
        };

        return next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return next(new AppError('Token expired', 401));
        }
        return next(new AppError(err.message, 401)); // force 401 always
    }
};