const mongoose = require("mongoose");

const userProfileSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        fullName: String,

        gender: {
            type: String,
            enum: ["male", "female", "other"]
        },

        dob: Date,

        birthTime: String,

        birthPlace: String,

        profileImage: String,

        referralCode: String
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("UserProfile", userProfileSchema);