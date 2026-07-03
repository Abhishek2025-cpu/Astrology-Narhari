const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
    {
        url: String,
        publicId: String
    },
    { _id: false }
);

const partnerProfileSchema = new mongoose.Schema(
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

        email: {
            type: String,
            default: "",
            lowercase: true
        },

        profileImage: imageSchema,

        experience: {
            type: Number,
            default: 0
        },

        languages: {
            type: [String],
            default: []
        },

        specialization: {
            type: [String],
            default: []
        },

        bio: {
            type: String,
            default: ""
        },

        priceChat: {
            type: Number,
            default: 0
        },

        priceCall: {
            type: Number,
            default: 0
        },

        priceVideo: {
            type: Number,
            default: 0
        },

        governmentId: imageSchema,

        certificate: imageSchema,

        bankName: {
            type: String,
            default: ""
        },

        accountNumber: {
            type: String,
            default: ""
        },

        ifsc: {
            type: String,
            default: ""
        },

        upiId: {
            type: String,
            default: ""
        },

        address: {
            type: String,
            default: ""
        },

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
        },

        isOnline: {
            type: Boolean,
            default: false
        },

        isBusy: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("PartnerProfile", partnerProfileSchema);