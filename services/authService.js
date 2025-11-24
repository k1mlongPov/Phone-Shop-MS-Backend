const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const generateOtp = require('../utils/generateOtp');
const { sendMail } = require('../utils/mail');
const AppError = require('../utils/AppError');

const OTP_TTL_MS = (process.env.OTP_TTL_MINUTES ? Number(process.env.OTP_TTL_MINUTES) : 10) * 60 * 1000;

async function register({ username, email, password }) {
    const lowerEmail = email.toLowerCase();
    const existing = await User.findOne({ email: lowerEmail });
    if (existing) throw new AppError('Email already used', 409);

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const otp = generateOtp(6);
    const user = new User({
        username,
        email: lowerEmail,
        password: hashed,
        otp,
        otpCreatedAt: new Date(),
        verification: false,
    });

    await user.save();

    // send OTP (log error but don't fail registration)
    console.log('About to send OTP to', user.email, 'otp=', otp);
    try {
        // capture result in `info` (if sendMail returns info)
        const info = await sendMail({
            to: user.email,
            subject: 'Verify your account — Vetheary Phone Shop',
            text: `Your verification code is ${otp}. It expires in ${OTP_TTL_MS / 60000} minutes.`,
            html: `<p>Your verification code is <b>${otp}</b>. It expires in ${OTP_TTL_MS / 60000} minutes.</p>`,
        });

        // debug: show mailer result (may be undefined depending on implementation)
        console.log('OTP email send info:', info);
    } catch (err) {
        console.error('Failed to send OTP email', err);
    }

    // remove sensitive fields before returning
    const safe = user.toObject();
    delete safe.password;
    delete safe.otp; // don't return otp to client in production
    return safe;
}

async function resendOtp({ email }) {
    const lowerEmail = email.toLowerCase();
    const user = await User.findOne({ email: lowerEmail });
    if (!user) throw new AppError('User not found', 404);

    const otp = generateOtp(6);
    user.otp = otp;
    user.otpCreatedAt = new Date();
    await user.save();

    console.log(`Resend OTP created for ${lowerEmail} otp=${otp} at ${user.otpCreatedAt.toISOString()}`);

    try {
        const info = await sendMail({
            to: user.email,
            subject: 'Your verification code (resend) — Phone Shop',
            text: `Your verification code is ${otp}. It expires in ${OTP_TTL_MS / 60000} minutes.`,
            html: `<p>Your verification code is <b>${otp}</b>. It expires in ${OTP_TTL_MS / 60000} minutes.</p>`,
        });
        console.log('Resend OTP email info:', info);
    } catch (err) {
        console.error('Failed to send OTP email (resend)', err);
        throw new AppError('Failed to send OTP', 500);
    }

    return { success: true, message: 'OTP resent' };
}

async function verifyPublic({ email, otp }) {
    const lowerEmail = email.toLowerCase();
    console.log('verifyPublic request', { email: lowerEmail, otp });

    // Force-select otp fields (in case schema hides them)
    const user = await User.findOne({ email: lowerEmail }).select('+otp +otpCreatedAt');

    if (!user) {
        console.log('verifyPublic: user not found for', lowerEmail);
        throw new AppError('User not found', 404);
    }

    // debug: show stored otp & createdAt (these may be shown as undefined if not in DB)
    console.log('verifyPublic: stored otp:', user.otp, 'otpCreatedAt:', user.otpCreatedAt);

    if (!user.otp || !user.otpCreatedAt) {
        console.log('verifyPublic: OTP not present or missing createdAt');
        throw new AppError('OTP not found. Please request resend', 400);
    }

    const age = Date.now() - new Date(user.otpCreatedAt).getTime();
    console.log(`verifyPublic: otp age(ms)=${age}, TTL(ms)=${OTP_TTL_MS}`);
    if (age > OTP_TTL_MS) {
        console.log('verifyPublic: OTP expired');
        throw new AppError('OTP expired', 400);
    }

    if (String(user.otp) !== String(otp).trim()) {
        console.log(`verifyPublic: invalid otp (stored=${user.otp} provided=${otp})`);
        throw new AppError('Invalid OTP', 400);
    }

    user.verification = true;
    user.otp = null;
    user.otpCreatedAt = null;
    await user.save();

    const safe = user.toObject();
    delete safe.password;
    return safe;
}

async function login({ email, password }) {
    const lowerEmail = email.toLowerCase();
    const user = await User.findOne({ email: lowerEmail }).select('+password +roles +refreshToken');
    if (!user) throw new AppError('Invalid credentials', 401);

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new AppError('Invalid credentials', 401);

    const roles = Array.isArray(user.roles)
        ? user.roles.map(r => String(r).toLowerCase())
        : [];

    const isAdmin = roles.includes('admin');
    if (!isAdmin) {
        throw new AppError('You do not have permission to access the admin panel', 403);
    }

    const payload = { id: user._id, roles, email: user.email };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN, // e.g. "15m"
    });

    const refreshToken = jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN } // e.g. "30d"
    );

    // ⭐ Save refresh token for future refresh requests
    user.refreshToken = refreshToken;
    await user.save();

    const safe = user.toObject();
    delete safe.password;

    return {
        user: safe,
        accessToken,
        refreshToken
    };

}

async function me(userId) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    const safe = user.toObject();
    delete safe.password;
    return safe;
}

module.exports = {
    register,
    resendOtp,
    verifyPublic,
    login,
    me,
};
