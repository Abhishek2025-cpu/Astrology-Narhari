const User = require("../models/User");
const { successResponse, errorResponse } = require("../utils/response");

exports.sendOtp = async (req, res) => {
    try {
        const { mobile, countryCode = "+91", role = "user" } = req.body;

        if (!mobile) {
            return errorResponse(res, "Mobile number is required");
        }

        let user = await User.findOne({ mobile });

        if (!user) {
            user = await User.create({
                mobile,
                countryCode,
                role,
                otp: "123456",
                otpExpiry: new Date(Date.now() + 5 * 60 * 1000)
            });
        } else {
            user.otp = "123456";
            user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
            await user.save();
        }

        return successResponse(res, "OTP Sent Successfully");
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};


const { generateToken } = require("../utils/jwt");

exports.verifyOtp = async (req, res) => {
    try {
        const { mobile, otp } = req.body;

        const user = await User.findOne({ mobile });

        if (!user) {
            return errorResponse(res, "User not found", 404);
        }

        if (user.otp !== otp) {
            return errorResponse(res, "Invalid OTP");
        }

        user.isVerified = true;
        user.lastLogin = new Date();
        user.otp = null;
        user.otpExpiry = null;

        await user.save();

        const token = generateToken(user);

        return successResponse(res, "Login Successful", {
            token,
            role: user.role,
            profileCompleted: user.profileCompleted
        });
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};