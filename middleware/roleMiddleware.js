const AppError = require('../utils/AppError');

function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) return next(new AppError('Unauthorized', 401));

        const roles = req.user.roles || [];
        const hasRole = roles.some(r => allowedRoles.includes(r));

        if (!hasRole) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
}

module.exports = requireRole;