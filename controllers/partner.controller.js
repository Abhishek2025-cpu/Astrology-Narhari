const PartnerProfile = require("../models/PartnerProfile");
const User = require("../models/User");
const { uploadImage, deleteImage } = require("../utils/cloudinary");

/**
 * Create Partner (Astrologer) Profile
 */
exports.createPartnerProfile = async (req, res) => {
    try {
        const userId = req.user._id;

        const profileExists = await PartnerProfile.findOne({ userId });
        if (profileExists) {
            return res.status(409).json({
                success: false,
                message: "Partner profile already exists"
            });
        }

        let profileImage = undefined;
        let governmentId = undefined;
        let certificate = undefined;

        if (req.files) {
            if (req.files.profileImage && req.files.profileImage[0]) {
                profileImage = await uploadImage(req.files.profileImage[0], "partners/profile");
            }
            if (req.files.governmentId && req.files.governmentId[0]) {
                governmentId = await uploadImage(req.files.governmentId[0], "partners/gov_id");
            }
            if (req.files.certificate && req.files.certificate[0]) {
                certificate = await uploadImage(req.files.certificate[0], "partners/certs");
            }
        }

        const profileData = {
            userId,
            ...req.body,
            approvalStatus: "pending" // starts as pending approval
        };

        if (profileImage) profileData.profileImage = profileImage;
        if (governmentId) profileData.governmentId = governmentId;
        if (certificate) profileData.certificate = certificate;

        // Parse lists if sent as JSON strings or raw arrays
        if (typeof req.body.languages === "string") {
            try { profileData.languages = JSON.parse(req.body.languages); } catch(e) {}
        }
        if (typeof req.body.specialization === "string") {
            try { profileData.specialization = JSON.parse(req.body.specialization); } catch(e) {}
        }

        const profile = await PartnerProfile.create(profileData);

        await User.findByIdAndUpdate(userId, {
            profileCompleted: true
        });

        return res.status(201).json({
            success: true,
            message: "Astrologer onboarding profile submitted successfully. Under review.",
            data: profile
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get Current Partner Profile
 */
exports.getPartnerProfile = async (req, res) => {
    try {
        const profile = await PartnerProfile.findOne({ userId: req.user._id });
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Astrologer profile not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: profile
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Update Partner Profile
 */
exports.updatePartnerProfile = async (req, res) => {
    try {
        const profile = await PartnerProfile.findOne({ userId: req.user._id });
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Astrologer profile not found"
            });
        }

        if (req.files) {
            if (req.files.profileImage && req.files.profileImage[0]) {
                if (profile.profileImage?.publicId) {
                    await deleteImage(profile.profileImage.publicId);
                }
                profile.profileImage = await uploadImage(req.files.profileImage[0], "partners/profile");
            }
            if (req.files.governmentId && req.files.governmentId[0]) {
                if (profile.governmentId?.publicId) {
                    await deleteImage(profile.governmentId.publicId);
                }
                profile.governmentId = await uploadImage(req.files.governmentId[0], "partners/gov_id");
            }
            if (req.files.certificate && req.files.certificate[0]) {
                if (profile.certificate?.publicId) {
                    await deleteImage(profile.certificate.publicId);
                }
                profile.certificate = await uploadImage(req.files.certificate[0], "partners/certs");
            }
        }

        delete req.body.userId;

        // Parse lists if sent as JSON strings or raw arrays
        if (typeof req.body.languages === "string") {
            try { req.body.languages = JSON.parse(req.body.languages); } catch(e) {}
        }
        if (typeof req.body.specialization === "string") {
            try { req.body.specialization = JSON.parse(req.body.specialization); } catch(e) {}
        }

        Object.assign(profile, req.body);
        await profile.save();

        return res.status(200).json({
            success: true,
            message: "Astrologer profile updated successfully.",
            data: profile
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
