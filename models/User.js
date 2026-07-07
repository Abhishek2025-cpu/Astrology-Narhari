const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        mobile: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        countryCode: {
            type: String,
            default: "+91"
        },

        role: {
            type: String,
            enum: ["user", "partner", "admin", "subadmin"],
            default: "user"
        },

        otp: {
            type: String,
            default: null
        },

        otpExpiry: {
            type: Date,
            default: null
        },

        isVerified: {
            type: Boolean,
            default: false
        },

        profileCompleted: {
            type: Boolean,
            default: false
        },

        status: {
            type: String,
            enum: ["active", "inactive", "blocked", "pending"],
            default: "active"
        },

        deviceToken: String,

        deviceType: {
            type: String,
            enum: ["android", "ios", "web"],
            default: "android"
        },

        walletAmount: {
            type: Number,
            default: 0
        },

        refreshToken: String,

        lastLogin: Date
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);