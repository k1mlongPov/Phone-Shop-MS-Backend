const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const authService = require('../services/authService');

exports.register = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) throw new AppError('username/email/password required', 400);

    const user = await authService.register({ username, email, password });
    res.status(201).json({ success: true, user, message: 'Registered — OTP sent' });
});

exports.resendOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) throw new AppError('Email required', 400);
    const result = await authService.resendOtp({ email });
    res.json({ success: true, ...result });
});

exports.verify = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) throw new AppError('Email and OTP required', 400);
    const user = await authService.verifyPublic({ email, otp });
    res.json({ success: true, user });
});

exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) throw new AppError('Email and password required', 400);
    const result = await authService.login({ email, password });
    // result: { user, token }
    res.json({ success: true, ...result });
});

exports.refresh = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        throw new AppError("No refresh token provided", 401);
    }

    // Verify refresh token
    let decoded;
    try {
        decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (e) {
        throw new AppError("Invalid refresh token", 403);
    }

    // Find user
    const user = await User.findById(decoded.id).select("+refreshToken");
    if (!user || user.refreshToken !== refreshToken) {
        throw new AppError("Refresh token not found or mismatch", 403);
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
        { id: user._id, roles: user.roles, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return res.json({
        success: true,
        accessToken: newAccessToken,
    });
});

exports.me = asyncHandler(async (req, res) => {
    // auth middleware must set req.user.id
    if (!req.user || !req.user.id) throw new AppError('Unauthorized', 401);
    const user = await authService.me(req.user.id);
    res.json({ success: true, user });
});
