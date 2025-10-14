const User = require("../models/User");

module.exports = {
    // Get current user profile
    getUser: async (req, res) => {
        try {
            const user = await User.findById(req.user.id);

            if (!user) {
                return res.status(404).json({ status: false, message: "User not found" });
            }

            const { password, __v, createdAt, ...userData } = user._doc;
            res.status(200).json({ status: true, user: userData });

        } catch (error) {
            res.status(500).json({ status: false, message: error.message });
        }
    },

    // Verify account with OTP
    verifyAccount: async (req, res) => {
        const userOtp = req.params.otp;

        try {
            const user = await User.findById(req.user.id);

            if (!user) {
                return res.status(404).json({ status: false, message: "User not found" });
            }

            if (String(userOtp) === String(user.otp)) {
                user.verification = true;
                user.otp = null;

                await user.save();

                const { password, otp, __v, createdAt, ...others } = user._doc;
                return res.status(200).json({ status: true, user: others });
            } else {
                return res.status(400).json({ status: false, message: "Invalid OTP" });
            }
        } catch (error) {
            return res.status(500).json({ status: false, message: error.message });
        }
    },

    // Verify phone number
    verifyPhone: async (req, res) => {
        const phone = req.params.phone;

        try {
            const user = await User.findById(req.user.id);

            if (!user) {
                return res.status(404).json({ status: false, message: "User not found" });
            }

            user.phoneVerification = true;
            user.phone = phone;

            await user.save();

            const { password, otp, __v, createdAt, ...others } = user._doc;
            return res.status(200).json({ status: true, user: others });
        } catch (error) {
            return res.status(500).json({ status: false, message: error.message });
        }
    },

    // Delete user
    deleteUser: async (req, res) => {
        try {
            const user = await User.findByIdAndDelete(req.user.id);

            if (!user) {
                return res.status(404).json({ status: false, message: "User not found" });
            }

            res.status(200).json({ status: true, message: "User deleted successfully" });

        } catch (error) {
            res.status(500).json({ status: false, message: error.message });
        }
    },
};
