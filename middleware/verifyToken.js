const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ success: false, message: "No token provided!" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err && err.name === "TokenExpiredError") {
            return res.status(401).json({ success: false, message: "Token expired!" });
        }
        if (err) {
            return res.status(403).json({ success: false, message: "Invalid token!" });
        }

        req.user = user;
        next();
    });
};

const verifyTokenAndAuthorization = (req, res, next) => {
    verifyToken(req, res, () => {
        if (["Customer", "Staff", "Admin"].includes(req.user.userType)) {
            next();
        } else {
            return res.status(403).json({ success: false, message: "Not allowed!" });
        }
    });
};

const verifyStaff = (req, res, next) => {
    verifyToken(req, res, () => {
        if (["Admin", "Staff"].includes(req.user.userType)) {
            next();
        } else {
            return res.status(403).json({ success: false, message: "Staff/Admin only!" });
        }
    });
};

const verifyAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.userType === "Admin") {
            next();
        } else {
            return res.status(403).json({ success: false, message: "Admin only!" });
        }
    });
};

module.exports = { verifyToken, verifyTokenAndAuthorization, verifyStaff, verifyAdmin };
