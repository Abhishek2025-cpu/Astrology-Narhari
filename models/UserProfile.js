const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
    {
        url: String,
        publicId: String,
    },
    { _id: false }
);

const userProfileSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        fullName: {
            type: String,
            default: ""
        },

        gender: {
            type: String,
            enum: ["male", "female", "other"],
            default: null
        },

        dob: {
            type: Date,
            default: null
        },

        birthTime: {
            type: String,
            default: ""
        },

        birthPlace: {
            type: String,
            default: ""
        },

        profileImage: imageSchema,

        referralCode: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("UserProfile", userProfileSchema);