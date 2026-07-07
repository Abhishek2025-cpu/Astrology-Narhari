const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            default: ""
        },
        price: {
            type: Number,
            required: true,
            default: 0
        },
        imageUrl: {
            type: String,
            default: ""
        },
        category: {
            type: String,
            default: "Other"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Product", productSchema);
