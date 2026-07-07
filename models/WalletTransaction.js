const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        title: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        type: {
            type: String,
            enum: ["credit", "debit"],
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("WalletTransaction", walletTransactionSchema);
