const { successResponse, errorResponse } = require("../utils/response");

exports.getHoroscope = async (req, res) => {
    try {
        const { sign } = req.params;
        const validSigns = [
            "aries", "taurus", "gemini", "cancer", "leo", "virgo",
            "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"
        ];

        const lowercaseSign = sign.toLowerCase();
        if (!validSigns.includes(lowercaseSign)) {
            return errorResponse(res, `Invalid zodiac sign: ${sign}`, 400);
        }

        // Generate dynamic mock calculations based on zodiac sign lengths and date hashes
        const signIndex = validSigns.indexOf(lowercaseSign);
        const luckScore = 60 + ((signIndex * 13 + new Date().getDate()) % 36);
        const luckyColors = ["Celestial Gold", "Emerald Green", "Ruby Red", "Deep Sapphire", "Pure White", "Royal Purple"];
        const luckyColor = luckyColors[signIndex % luckyColors.length];
        const luckyNumber = String((signIndex * 7 + 3) % 9 + 1);

        const predictions = {
            aries: "Today holds opportunities for new projects. Trust your impulses but make decisions with care.",
            taurus: "Financial stability is highlighted today. Focus on long-term goals and avoid impulse buys.",
            gemini: "Communication is your superpower today. You'll find it easy to connect with colleagues and friends.",
            cancer: "Take time for self-reflection today. A quiet evening will help restore your emotional balance.",
            leo: "The cosmic alignment centers you. Radiate confidence and pursue creative projects with vigor.",
            virgo: "Pay attention to detail in your work. Your precision will be noticed and highly valued by peers.",
            libra: "Relationships are key today. Focus on harmony and compromise to resolve any lingering issues.",
            scorpio: "Your intuition is sharp. Trust your gut feelings, especially when dealing with financial matters.",
            sagittarius: "Adventure calls! It's a great day to learn something new or plan future travels.",
            capricorn: "Career ambitions are highlighted. Stay disciplined and your hard work will pay off.",
            aquarius: "Think outside the box today. Innovation and collaboration will bring positive results.",
            pisces: "Your creative energy is flowing. Spend time in artistic pursuits or helping a friend in need."
        };

        const prediction = predictions[lowercaseSign] || "The stars promise a day of growth and steady progress.";

        const result = {
            sign: sign.charAt(0).toUpperCase() + sign.slice(1),
            prediction,
            luckScore,
            luckyColor,
            luckyNumber,
            alignmentLabel: `${luckScore}% Alignment`
        };

        return successResponse(res, "Horoscope retrieved successfully", result);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};
