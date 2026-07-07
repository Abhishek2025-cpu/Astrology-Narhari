const Notification = require("../models/Notification");
const { successResponse, errorResponse } = require("../utils/response");

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            $or: [
                { userId: req.user._id },
                { userId: null } // System notifications
            ]
        }).sort({ createdAt: -1 });

        return successResponse(res, "Notifications retrieved successfully", notifications);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};
