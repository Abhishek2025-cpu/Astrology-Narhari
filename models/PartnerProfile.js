const mongoose = require("mongoose");

const partnerProfileSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        fullName: String,

        gender: String,

        dob: Date,

        email: String,

        profileImage: String,

        experience: Number,

        languages: [String],

        specialization: [String],

        bio: String,

        priceChat: Number,

        priceCall: Number,

        priceVideo: Number,

        governmentId: String,

        certificate: String,

        bankName: String,

        accountNumber: String,

        ifsc: String,

        upiId: String,

        address: String,

        approvalStatus: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending"
        },

        rating: {
            type: Number,
            default: 0
        },

        totalReviews: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("PartnerProfile", partnerProfileSchema);