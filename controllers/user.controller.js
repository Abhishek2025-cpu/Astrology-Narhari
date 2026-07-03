const User = require("../models/User");
const UserProfile = require("../models/UserProfile");

const {
    uploadImage,
    deleteImage,
} = require("../utils/cloudinary");

/**
 * Create User Profile
 */

exports.createProfile = async (req, res) => {
    try {
        const userId = req.user._id;

        const profileExists = await UserProfile.findOne({ userId });

        if (profileExists) {
            return res.status(409).json({
                success: false,
                message: "Profile already exists",
            });
        }

        let profileImage = {};

        if (req.file) {
            profileImage = await uploadImage(req.file, "users/profile");
        }

        const profile = await UserProfile.create({
            userId,
            ...req.body,
            profileImage,
        });

        await User.findByIdAndUpdate(userId, {
            profileCompleted: true,
        });

        return res.status(201).json({
            success: true,
            message: "Profile created successfully.",
            data: profile,
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};


/**
 * Get Profile
 */

exports.getProfile = async (req, res) => {

    try {

        const profile = await UserProfile.findOne({
            userId: req.user._id,
        });

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Profile not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: profile,
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }

};


/**
 * Update Profile
 */

exports.updateProfile = async (req, res) => {

    try {

        const profile = await UserProfile.findOne({
            userId: req.user._id,
        });

        if (!profile) {

            return res.status(404).json({
                success: false,
                message: "Profile not found",
            });

        }

        if (req.file) {

            if (profile.profileImage?.publicId) {
                await deleteImage(profile.profileImage.publicId);
            }

            profile.profileImage = await uploadImage(
                req.file,
                "users/profile"
            );

        }

        delete req.body.userId;

        Object.assign(profile, req.body);

        await profile.save();

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            data: profile,
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }

};


/**
 * Delete Profile
 */

exports.deleteProfile = async (req, res) => {

    try {

        const profile = await UserProfile.findOne({
            userId: req.user._id,
        });

        if (!profile) {

            return res.status(404).json({
                success: false,
                message: "Profile not found",
            });

        }

        if (profile.profileImage?.publicId) {
            await deleteImage(profile.profileImage.publicId);
        }

        await profile.deleteOne();

        await User.findByIdAndUpdate(req.user._id, {
            profileCompleted: false,
        });

        return res.status(200).json({
            success: true,
            message: "Profile deleted successfully.",
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }

};