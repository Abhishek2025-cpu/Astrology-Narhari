const Banner = require("../models/Banner");
const { successResponse, errorResponse } = require("../utils/response");

exports.getBanners = async (req, res) => {
    try {
        const banners = await Banner.find({ isActive: true });
        return successResponse(res, "Banners retrieved successfully", banners);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};
