const Kundli = require("../models/Kundli");
const { successResponse, errorResponse } = require("../utils/response");

exports.getMyKundli = async (req, res) => {
    try {
        const kundli = await Kundli.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
        if (!kundli) {
            return res.status(200).json({
                success: true,
                message: "No Kundli found",
                data: null
            });
        }
        return successResponse(res, "Kundli retrieved successfully", kundli);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

exports.generateKundli = async (req, res) => {
    try {
        const userId = req.user._id;
        const { fullName, gender, dob, birthTime, birthPlace } = req.body;

        if (!fullName || !dob || !birthTime || !birthPlace) {
            return errorResponse(res, "All fields (fullName, dob, birthTime, birthPlace) are required", 400);
        }

        const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
        const planets = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];

        const chartData = {};
        planets.forEach((planet, idx) => {
            const index = (fullName.length + idx * 7 + new Date(dob).getDate()) % signs.length;
            chartData[planet] = `${signs[index]} at ${(idx * 4.5 + 2.5).toFixed(2)}°`;
        });

        await Kundli.deleteMany({ userId });

        const kundli = await Kundli.create({
            userId,
            fullName,
            gender,
            dob: new Date(dob),
            birthTime,
            birthPlace,
            chartData
        });

        return successResponse(res, "Kundli generated and saved successfully", kundli);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

exports.matchmaking = async (req, res) => {
    try {
        const {
            maleName, maleDob, maleTob, malePob,
            femaleName, femaleDob, femaleTob, femalePob
        } = req.body;

        if (!maleName || !maleDob || !femaleName || !femaleDob) {
            return errorResponse(res, "Male and Female names and DOBs are required", 400);
        }

        // Generate matching points / gunas out of 36
        const hash = (maleName.length + femaleName.length + new Date(maleDob).getDate() + new Date(femaleDob).getDate()) % 17;
        const scoreGunas = 18 + hash; // range 18-34 gunas
        const matchPercentage = Math.round((scoreGunas / 36) * 100);

        let compatibility = "Average compatibility. Good for friendship but requires communication for relationship growth.";
        if (scoreGunas >= 28) {
            compatibility = "Excellent compatibility! Very high emotional and mental alignment. Blessed and highly recommended match.";
        } else if (scoreGunas >= 24) {
            compatibility = "Very good compatibility. Strong communication, shared ideals, and mutual respect are predicted.";
        }

        const report = {
            gunasMatched: `${scoreGunas}/36`,
            matchPercentage,
            compatibility,
            recommendation: scoreGunas >= 22 ? "Recommended to Proceed" : "Proceed with caution, match charts in detail"
        };

        return successResponse(res, "Matchmaking report completed", report);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};
