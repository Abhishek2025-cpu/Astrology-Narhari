const mongoose = require("mongoose");

const kundliSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        fullName: {
            type: String,
            required: true
        },
        gender: {
            type: String,
            enum: ["male", "female", "other"],
            default: "female"
        },
        dob: {
            type: Date,
            required: true
        },
        birthTime: {
            type: String,
            required: true
        },
        birthPlace: {
            type: String,
            required: true
        },
        chartData: {
            type: Map,
            of: String,
            default: {}
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Kundli", kundliSchema);
