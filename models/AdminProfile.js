const mongoose = require("mongoose");

const adminProfileSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        fullName: String,

        email: {
            type: String,
            lowercase: true
        },

        password: String,

        image: String,

        permissions: {
            type: [String],
            default: []
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("AdminProfile", adminProfileSchema);