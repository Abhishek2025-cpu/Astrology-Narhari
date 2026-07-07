const PartnerProfile = require("../models/PartnerProfile");
const { successResponse, errorResponse } = require("../utils/response");

const serializeAstrologer = (partner) => {
    return {
        id: partner._id,
        name: partner.fullName || "Expert Astrologer",
        profile_image: partner.profileImage?.url || "",
        rating: partner.rating || 0,
        charge: partner.priceChat || 0,
        skills: partner.specialization || [],
        is_live: partner.isOnline && !partner.isBusy,
        is_online: partner.isOnline || false
    };
};

exports.getAllAstrologers = async (req, res) => {
    try {
        const partners = await PartnerProfile.find({ approvalStatus: "approved" });
        const serialized = partners.map(serializeAstrologer);
        return successResponse(res, "Astrologers retrieved successfully", serialized);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

exports.getLiveAstrologers = async (req, res) => {
    try {
        const partners = await PartnerProfile.find({
            approvalStatus: "approved",
            isOnline: true,
            isBusy: false
        });
        const serialized = partners.map(serializeAstrologer);
        return successResponse(res, "Live astrologers retrieved successfully", serialized);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

exports.getTopAstrologers = async (req, res) => {
    try {
        const partners = await PartnerProfile.find({ approvalStatus: "approved" })
            .sort({ rating: -1 })
            .limit(10);
        const serialized = partners.map(serializeAstrologer);
        return successResponse(res, "Top astrologers retrieved successfully", serialized);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

exports.searchAstrologers = async (req, res) => {
    try {
        const { query = "" } = req.query;
        const searchCriteria = {
            approvalStatus: "approved",
            $or: [
                { fullName: { $regex: query, $options: "i" } },
                { specialization: { $regex: query, $options: "i" } },
                { languages: { $regex: query, $options: "i" } }
            ]
        };
        const partners = await PartnerProfile.find(searchCriteria);
        const serialized = partners.map(serializeAstrologer);
        return successResponse(res, "Search results retrieved successfully", serialized);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};
