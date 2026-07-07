const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");
const { successResponse, errorResponse } = require("../utils/response");

exports.getBalance = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("walletAmount");
        if (!user) {
            return errorResponse(res, "User not found", 404);
        }
        return successResponse(res, "Wallet balance retrieved successfully", {
            balance: user.walletAmount || 0
        });
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

exports.getTransactions = async (req, res) => {
    try {
        const transactions = await WalletTransaction.find({ userId: req.user._id })
            .sort({ createdAt: -1 });
        return successResponse(res, "Transactions retrieved successfully", transactions);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

exports.recharge = async (req, res) => {
    try {
        const { amount } = req.body;
        const parsedAmount = parseFloat(amount);

        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return errorResponse(res, "Please provide a valid positive number for recharge amount", 400);
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return errorResponse(res, "User not found", 404);
        }

        user.walletAmount = (user.walletAmount || 0) + parsedAmount;
        await user.save();

        const transaction = await WalletTransaction.create({
            userId: user._id,
            title: "Wallet Recharge",
            amount: parsedAmount,
            type: "credit"
        });

        return successResponse(res, "Recharge successful", {
            balance: user.walletAmount,
            transaction
        });
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};
