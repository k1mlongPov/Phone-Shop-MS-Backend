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

exports.requestReset = asyncHandler(async (req, res) => {
    const { email, origin } = req.body;
    if (!email) throw new AppError("Email required", 400);

    await authService.requestPasswordReset({ email, origin });

    res.json({
        success: true,
        message: "If that email exists, a reset link has been sent.",
    });
});

exports.resetPassword = asyncHandler(async (req, res) => {
    const { email, token, password } = req.body;

    await authService.resetPassword({ email, token, password });

    res.json({ success: true, message: "Password reset successful" });
});

exports.me = asyncHandler(async (req, res) => {
    // auth middleware must set req.user.id
    if (!req.user || !req.user.id) throw new AppError('Unauthorized', 401);
    const user = await authService.me(req.user.id);
    res.json({ success: true, user });
});
