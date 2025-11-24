const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    otp: { type: String, default: null },
    otpCreatedAt: { type: Date, default: null },
    password: { type: String, required: true, select: false },
    resetPasswordToken: { type: String, select: false, default: null },
    resetPasswordExpires: { type: Date, default: null },
    verification: { type: Boolean, default: false },
    phone: { type: String, default: '' },
    phoneVerification: { type: Boolean, default: false, select: false },
    address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
        required: false,
    },
    roles: {
        type: [String],
        default: ['Customer'], // e.g., Customer, Staff, Admin, Cashier
    },
    profile: { type: String, default: 'https://images.pexels.com/photos/1704488/pexels-photo-1704488.jpeg' },
    purchaseHistory: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: "Phone" },
            quantity: { type: Number, default: 1 },
            price: { type: Number },
            purchaseDate: { type: Date, default: Date.now },
        },
    ],
    lastLogin: { type: Date },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Password hashing
userSchema.pre('save', async function (next) {
    try {
        if (!this.isModified('password')) return next();
        if (typeof this.password === 'string' && this.password.startsWith('$2')) {
            return next();
        }
        const hash = await bcrypt.hash(this.password, SALT_ROUNDS);
        this.password = hash;
        return next();
    } catch (err) {
        return next(err);
    }
});

userSchema.methods.comparePassword = async function (candidate) {
    return bcrypt.compare(candidate, this.password);
};

// Hide sensitive fields when converting to JSON
userSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.password;
        delete ret.otp;
        delete ret.otpCreatedAt;
        delete ret.phoneVerification;
        return ret;
    },
});
userSchema.set('toObject', {
    transform: (doc, ret) => {
        delete ret.password;
        delete ret.otp;
        delete ret.otpCreatedAt;
        delete ret.phoneVerification;
        return ret;
    },
});


module.exports = mongoose.model('User', userSchema);