const User = require("../models/User");
const UserProfile = require("../models/UserProfile");
const PartnerProfile = require("../models/PartnerProfile");
const AdminProfile = require("../models/AdminProfile");
const Banner = require("../models/Banner");
const Product = require("../models/Product");
const Notification = require("../models/Notification");
const WalletTransaction = require("../models/WalletTransaction");
const { uploadImage, deleteImage } = require("../utils/cloudinary");
const { successResponse, errorResponse } = require("../utils/response");
const bcrypt = require("bcrypt");

/* ─────────────────────────────────────────────────────────────
   DASHBOARD
───────────────────────────────────────────────────────────── */

/**
 * GET /api/admin/dashboard
 * Returns aggregate counts for the admin overview dashboard.
 */
exports.getDashboardStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalPartners,
            pendingPartners,
            approvedPartners,
            rejectedPartners,
            totalBanners,
            totalProducts,
            totalNotifications,
            totalTransactions,
            blockedUsers
        ] = await Promise.all([
            User.countDocuments({ role: "user" }),
            User.countDocuments({ role: "partner" }),
            PartnerProfile.countDocuments({ approvalStatus: "pending" }),
            PartnerProfile.countDocuments({ approvalStatus: "approved" }),
            PartnerProfile.countDocuments({ approvalStatus: "rejected" }),
            Banner.countDocuments(),
            Product.countDocuments(),
            Notification.countDocuments(),
            WalletTransaction.countDocuments(),
            User.countDocuments({ status: "blocked" })
        ]);

        // Wallet revenue: sum of all credit transactions
        const revenueAgg = await WalletTransaction.aggregate([
            { $match: { type: "credit" } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalRevenue = revenueAgg[0]?.total || 0;

        return successResponse(res, "Dashboard stats fetched successfully", {
            users: {
                total: totalUsers,
                blocked: blockedUsers
            },
            partners: {
                total: totalPartners,
                pending: pendingPartners,
                approved: approvedPartners,
                rejected: rejectedPartners
            },
            banners: totalBanners,
            products: totalProducts,
            notifications: totalNotifications,
            transactions: totalTransactions,
            totalRevenue
        });
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/* ─────────────────────────────────────────────────────────────
   USER MANAGEMENT
───────────────────────────────────────────────────────────── */

/**
 * GET /api/admin/users
 * List all users (role = "user") with optional filters.
 * Query: status, search, page, limit
 */
exports.getAllUsers = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 20 } = req.query;
        const filter = { role: "user" };

        if (status) filter.status = status;
        if (search) filter.mobile = { $regex: search, $options: "i" };

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [users, total] = await Promise.all([
            User.find(filter)
                .select("-otp -otpExpiry -refreshToken")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            User.countDocuments(filter)
        ]);

        // Attach profile info
        const userIds = users.map(u => u._id);
        const profiles = await UserProfile.find({ userId: { $in: userIds } })
            .select("userId fullName profileImage")
            .lean();

        const profileMap = {};
        profiles.forEach(p => { profileMap[p.userId.toString()] = p; });

        const enriched = users.map(u => ({
            ...u,
            profile: profileMap[u._id.toString()] || null
        }));

        return successResponse(res, "Users fetched successfully", {
            users: enriched,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/**
 * GET /api/admin/users/:id
 * Get a single user's full details including profile and wallet.
 */
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-otp -otpExpiry -refreshToken").lean();
        if (!user) return errorResponse(res, "User not found", 404);

        const [profile, transactions] = await Promise.all([
            UserProfile.findOne({ userId: user._id }).lean(),
            WalletTransaction.find({ userId: user._id }).sort({ createdAt: -1 }).limit(10).lean()
        ]);

        return successResponse(res, "User details fetched successfully", {
            user,
            profile,
            recentTransactions: transactions
        });
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/**
 * PATCH /api/admin/users/:id/status
 * Block / unblock / activate a user.
 * Body: { status: "active" | "blocked" | "inactive" }
 */
exports.updateUserStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const allowed = ["active", "inactive", "blocked", "pending"];

        if (!status || !allowed.includes(status)) {
            return errorResponse(res, `Status must be one of: ${allowed.join(", ")}`, 400);
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).select("-otp -otpExpiry -refreshToken");

        if (!user) return errorResponse(res, "User not found", 404);

        return successResponse(res, `User status updated to '${status}'`, user);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/**
 * DELETE /api/admin/users/:id
 * Permanently delete a user and their profile.
 */
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return errorResponse(res, "User not found", 404);

        if (["admin", "subadmin"].includes(user.role)) {
            return errorResponse(res, "Cannot delete admin accounts via this endpoint", 403);
        }

        // Remove profile image from cloudinary if exists
        const profile = await UserProfile.findOne({ userId: user._id });
        if (profile?.profileImage?.publicId) {
            await deleteImage(profile.profileImage.publicId);
        }

        await Promise.all([
            UserProfile.deleteOne({ userId: user._id }),
            WalletTransaction.deleteMany({ userId: user._id }),
            User.findByIdAndDelete(user._id)
        ]);

        return successResponse(res, "User deleted successfully");
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/**
 * POST /api/admin/users/:id/wallet/credit
 * Manually credit or debit a user's wallet.
 * Body: { amount, type: "credit"|"debit", title }
 */
exports.adjustUserWallet = async (req, res) => {
    try {
        const { amount, type, title } = req.body;
        const parsedAmount = parseFloat(amount);

        if (!["credit", "debit"].includes(type)) {
            return errorResponse(res, "Type must be 'credit' or 'debit'", 400);
        }
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return errorResponse(res, "Amount must be a positive number", 400);
        }

        const user = await User.findById(req.params.id);
        if (!user) return errorResponse(res, "User not found", 404);

        if (type === "debit" && user.walletAmount < parsedAmount) {
            return errorResponse(res, "Insufficient wallet balance", 400);
        }

        user.walletAmount =
            type === "credit"
                ? (user.walletAmount || 0) + parsedAmount
                : (user.walletAmount || 0) - parsedAmount;

        await user.save();

        const transaction = await WalletTransaction.create({
            userId: user._id,
            title: title || (type === "credit" ? "Admin Credit" : "Admin Debit"),
            amount: parsedAmount,
            type
        });

        return successResponse(res, "Wallet adjusted successfully", {
            newBalance: user.walletAmount,
            transaction
        });
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/* ─────────────────────────────────────────────────────────────
   PARTNER (ASTROLOGER) MANAGEMENT
───────────────────────────────────────────────────────────── */

/**
 * GET /api/admin/partners
 * List all partners with filters.
 * Query: approvalStatus, search, page, limit
 */
exports.getAllPartners = async (req, res) => {
    try {
        const { approvalStatus, search, page = 1, limit = 20 } = req.query;
        const filter = {};

        if (approvalStatus) filter.approvalStatus = approvalStatus;
        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [partners, total] = await Promise.all([
            PartnerProfile.find(filter)
                .populate("userId", "mobile status role createdAt")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            PartnerProfile.countDocuments(filter)
        ]);

        return successResponse(res, "Partners fetched successfully", {
            partners,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/**
 * GET /api/admin/partners/:id
 * Get a single partner profile by their PartnerProfile _id.
 */
exports.getPartnerById = async (req, res) => {
    try {
        const partner = await PartnerProfile.findById(req.params.id)
            .populate("userId", "mobile status role walletAmount createdAt lastLogin")
            .lean();

        if (!partner) return errorResponse(res, "Partner not found", 404);

        return successResponse(res, "Partner details fetched successfully", partner);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/**
 * PATCH /api/admin/partners/:id/approval
 * Approve or reject a partner application.
 * Body: { status: "approved" | "rejected" }
 */
exports.updatePartnerApproval = async (req, res) => {
    try {
        const { status } = req.body;
        if (!["approved", "rejected", "pending"].includes(status)) {
            return errorResponse(res, "Status must be 'approved', 'rejected', or 'pending'", 400);
        }

        const partner = await PartnerProfile.findByIdAndUpdate(
            req.params.id,
            { approvalStatus: status },
            { new: true }
        );

        if (!partner) return errorResponse(res, "Partner not found", 404);

        // If approved, also activate the user account
        if (status === "approved") {
            await User.findByIdAndUpdate(partner.userId, { status: "active" });
        }

        return successResponse(res, `Partner ${status} successfully`, partner);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/**
 * PATCH /api/admin/partners/:id/status
 * Block / unblock a partner's user account.
 * Body: { status: "active" | "blocked" }
 */
exports.updatePartnerStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!["active", "blocked", "inactive"].includes(status)) {
            return errorResponse(res, "Status must be 'active', 'blocked', or 'inactive'", 400);
        }

        const partner = await PartnerProfile.findById(req.params.id);
        if (!partner) return errorResponse(res, "Partner not found", 404);

        const user = await User.findByIdAndUpdate(
            partner.userId,
            { status },
            { new: true }
        ).select("-otp -otpExpiry -refreshToken");

        return successResponse(res, `Partner account status updated to '${status}'`, user);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/**
 * DELETE /api/admin/partners/:id
 * Delete a partner profile (PartnerProfile _id).
 */
exports.deletePartner = async (req, res) => {
    try {
        const partner = await PartnerProfile.findById(req.params.id);
        if (!partner) return errorResponse(res, "Partner not found", 404);

        // Remove cloudinary assets
        const cleanups = [];
        if (partner.profileImage?.publicId) cleanups.push(deleteImage(partner.profileImage.publicId));
        if (partner.governmentId?.publicId) cleanups.push(deleteImage(partner.governmentId.publicId));
        if (partner.certificate?.publicId) cleanups.push(deleteImage(partner.certificate.publicId));
        await Promise.all(cleanups);

        await PartnerProfile.findByIdAndDelete(req.params.id);

        return successResponse(res, "Partner profile deleted successfully");
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/* ─────────────────────────────────────────────────────────────
   BANNER MANAGEMENT
───────────────────────────────────────────────────────────── */

/**
 * GET /api/admin/banners
 * List all banners (active + inactive).
 */
exports.getAllBanners = async (req, res) => {
    try {
        const banners = await Banner.find().sort({ createdAt: -1 });
        return successResponse(res, "Banners fetched successfully", banners);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/**
 * POST /api/admin/banners
 * Create a new banner.
 * Body (multipart): title, link, isActive  +  file: image
 */
exports.createBanner = async (req, res) => {
    try {
        const { title, link, isActive } = req.body;

        if (!title) return errorResponse(res, "Title is required", 400);
        if (!req.file) return errorResponse(res, "Banner image is required", 400);

        const uploaded = await uploadImage(req.file, "banners");

        const banner = await Banner.create({
            title,
            imageUrl: uploaded.url,
            link: link || "",
            isActive: isActive !== undefined ? isActive === "true" || isActive === true : true
        });

        return successResponse(res, "Banner created successfully", banner, 201);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/**
 * PUT /api/admin/banners/:id
 * Update a banner.
 * Body (multipart): title, link, isActive  + optional file: image
 */
exports.updateBanner = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) return errorResponse(res, "Banner not found", 404);

        const { title, link, isActive } = req.body;

        if (title !== undefined) banner.title = title;
        if (link !== undefined) banner.link = link;
        if (isActive !== undefined) banner.isActive = isActive === "true" || isActive === true;

        if (req.file) {
            const uploaded = await uploadImage(req.file, "banners");
            banner.imageUrl = uploaded.url;
        }

        await banner.save();
        return successResponse(res, "Banner updated successfully", banner);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/**
 * DELETE /api/admin/banners/:id
 * Delete a banner.
 */
exports.deleteBanner = async (req, res) => {
    try {
        const banner = await Banner.findByIdAndDelete(req.params.id);
        if (!banner) return errorResponse(res, "Banner not found", 404);

        return successResponse(res, "Banner deleted successfully");
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/**
 * PATCH /api/admin/banners/:id/toggle
 * Toggle the isActive state of a banner.
 */
exports.toggleBanner = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) return errorResponse(res, "Banner not found", 404);

        banner.isActive = !banner.isActive;
        await banner.save();

        return successResponse(res, `Banner ${banner.isActive ? "activated" : "deactivated"} successfully`, banner);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/* ─────────────────────────────────────────────────────────────
   PRODUCT MANAGEMENT
───────────────────────────────────────────────────────────── */

/**
 * GET /api/admin/products
 * List all products with optional category filter.
 */
exports.getAllProducts = async (req, res) => {
    try {
        const { category, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (category && category !== "All") filter.category = category;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [products, total] = await Promise.all([
            Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
            Product.countDocuments(filter)
        ]);

        return successResponse(res, "Products fetched successfully", {
            products,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/**
 * GET /api/admin/products/:id
 */
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return errorResponse(res, "Product not found", 404);
        return successResponse(res, "Product fetched successfully", product);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/**
 * POST /api/admin/products
 * Create a new product.
 * Body (multipart): name, description, price, category  +  optional file: image
 */
exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, category } = req.body;

        if (!name) return errorResponse(res, "Product name is required", 400);
        if (!price) return errorResponse(res, "Product price is required", 400);

        let imageUrl = "";
        if (req.file) {
            const uploaded = await uploadImage(req.file, "products");
            imageUrl = uploaded.url;
        }

        const product = await Product.create({
            name,
            description: description || "",
            price: parseFloat(price),
            category: category || "Other",
            imageUrl
        });

        return successResponse(res, "Product created successfully", product, 201);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/**
 * PUT /api/admin/products/:id
 * Update a product.
 * Body (multipart): name, description, price, category  +  optional file: image
 */
exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return errorResponse(res, "Product not found", 404);

        const { name, description, price, category } = req.body;

        if (name !== undefined) product.name = name;
        if (description !== undefined) product.description = description;
        if (price !== undefined) product.price = parseFloat(price);
        if (category !== undefined) product.category = category;

        if (req.file) {
            const uploaded = await uploadImage(req.file, "products");
            product.imageUrl = uploaded.url;
        }

        await product.save();
        return successResponse(res, "Product updated successfully", product);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/**
 * DELETE /api/admin/products/:id
 */
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return errorResponse(res, "Product not found", 404);
        return successResponse(res, "Product deleted successfully");
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/* ─────────────────────────────────────────────────────────────
   NOTIFICATION MANAGEMENT
───────────────────────────────────────────────────────────── */

/**
 * GET /api/admin/notifications
 * List all notifications (system-wide + user-specific).
 * Query: page, limit
 */
exports.getAllNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 30 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [notifications, total] = await Promise.all([
            Notification.find()
                .populate("userId", "mobile")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Notification.countDocuments()
        ]);

        return successResponse(res, "Notifications fetched successfully", {
            notifications,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/**
 * POST /api/admin/notifications/broadcast
 * Send a system-wide notification (userId = null).
 * Body: { title, body }
 */
exports.broadcastNotification = async (req, res) => {
    try {
        const { title, body } = req.body;
        if (!title || !body) return errorResponse(res, "Title and body are required", 400);

        const notification = await Notification.create({ userId: null, title, body });
        return successResponse(res, "Broadcast notification sent", notification, 201);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/**
 * POST /api/admin/notifications/send
 * Send a notification to a specific user.
 * Body: { userId, title, body }
 */
exports.sendNotificationToUser = async (req, res) => {
    try {
        const { userId, title, body } = req.body;
        if (!userId || !title || !body) {
            return errorResponse(res, "userId, title, and body are required", 400);
        }

        const user = await User.findById(userId);
        if (!user) return errorResponse(res, "User not found", 404);

        const notification = await Notification.create({ userId, title, body });
        return successResponse(res, "Notification sent to user", notification, 201);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/**
 * DELETE /api/admin/notifications/:id
 */
exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findByIdAndDelete(req.params.id);
        if (!notification) return errorResponse(res, "Notification not found", 404);
        return successResponse(res, "Notification deleted successfully");
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/* ─────────────────────────────────────────────────────────────
   WALLET / TRANSACTIONS (ADMIN VIEW)
───────────────────────────────────────────────────────────── */

/**
 * GET /api/admin/transactions
 * List all wallet transactions across all users.
 * Query: type ("credit"|"debit"), userId, page, limit
 */
exports.getAllTransactions = async (req, res) => {
    try {
        const { type, userId, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (type) filter.type = type;
        if (userId) filter.userId = userId;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [transactions, total] = await Promise.all([
            WalletTransaction.find(filter)
                .populate("userId", "mobile role")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            WalletTransaction.countDocuments(filter)
        ]);

        return successResponse(res, "Transactions fetched successfully", {
            transactions,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/* ─────────────────────────────────────────────────────────────
   ADMIN / SUBADMIN PROFILE & ACCOUNT MANAGEMENT
───────────────────────────────────────────────────────────── */

/**
 * GET /api/admin/profile
 * Get the logged-in admin's profile.
 */
exports.getAdminProfile = async (req, res) => {
    try {
        const profile = await AdminProfile.findOne({ userId: req.user._id }).lean();
        if (!profile) return errorResponse(res, "Admin profile not found", 404);

        return successResponse(res, "Admin profile fetched successfully", {
            ...req.user.toObject(),
            profile
        });
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/**
 * PUT /api/admin/profile
 * Update the logged-in admin's profile.
 * Body (multipart): fullName, email  +  optional file: image
 */
exports.updateAdminProfile = async (req, res) => {
    try {
        let profile = await AdminProfile.findOne({ userId: req.user._id });

        if (!profile) {
            profile = await AdminProfile.create({ userId: req.user._id });
        }

        const { fullName, email } = req.body;
        if (fullName !== undefined) profile.fullName = fullName;
        if (email !== undefined) profile.email = email;

        if (req.file) {
            const uploaded = await uploadImage(req.file, "admin/profile");
            profile.image = uploaded.url;
        }

        await profile.save();
        return successResponse(res, "Admin profile updated successfully", profile);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/**
 * POST /api/admin/change-password
 * Change admin password.
 * Body: { currentPassword, newPassword }
 */
exports.changeAdminPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return errorResponse(res, "Current password and new password are required", 400);
        }
        if (newPassword.length < 6) {
            return errorResponse(res, "New password must be at least 6 characters", 400);
        }

        const profile = await AdminProfile.findOne({ userId: req.user._id });
        if (!profile || !profile.password) {
            return errorResponse(res, "Admin profile or password not set", 404);
        }

        const isMatch = await bcrypt.compare(currentPassword, profile.password);
        if (!isMatch) return errorResponse(res, "Current password is incorrect", 401);

        profile.password = await bcrypt.hash(newPassword, 10);
        await profile.save();

        return successResponse(res, "Password changed successfully");
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/**
 * GET /api/admin/subadmins
 * List all subadmin accounts (admin only, not subadmin).
 */
exports.getAllSubadmins = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return errorResponse(res, "Only super admin can view subadmins", 403);
        }

        const subadmins = await User.find({ role: "subadmin" })
            .select("-otp -otpExpiry -refreshToken")
            .lean();

        const userIds = subadmins.map(u => u._id);
        const profiles = await AdminProfile.find({ userId: { $in: userIds } }).lean();
        const profileMap = {};
        profiles.forEach(p => { profileMap[p.userId.toString()] = p; });

        const enriched = subadmins.map(u => ({
            ...u,
            profile: profileMap[u._id.toString()] || null
        }));

        return successResponse(res, "Subadmins fetched successfully", enriched);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/**
 * POST /api/admin/subadmins
 * Create a new subadmin account (admin only).
 * Body: { mobile, fullName, email, password, permissions[] }
 */
exports.createSubadmin = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return errorResponse(res, "Only super admin can create subadmins", 403);
        }

        const { mobile, fullName, email, password, permissions = [] } = req.body;
        if (!mobile || !password) {
            return errorResponse(res, "Mobile and password are required", 400);
        }

        const exists = await User.findOne({ mobile });
        if (exists) return errorResponse(res, "Mobile number already registered", 409);

        const newUser = await User.create({
            mobile,
            role: "subadmin",
            isVerified: true,
            profileCompleted: true,
            status: "active"
        });

        const hashedPassword = await bcrypt.hash(password, 10);

        const profile = await AdminProfile.create({
            userId: newUser._id,
            fullName: fullName || "",
            email: email || "",
            password: hashedPassword,
            permissions
        });

        return successResponse(
            res,
            "Subadmin created successfully",
            { user: newUser, profile },
            201
        );
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/**
 * DELETE /api/admin/subadmins/:id
 * Delete a subadmin account (admin only).
 */
exports.deleteSubadmin = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return errorResponse(res, "Only super admin can delete subadmins", 403);
        }

        const user = await User.findById(req.params.id);
        if (!user) return errorResponse(res, "Subadmin not found", 404);
        if (user.role !== "subadmin") return errorResponse(res, "Target account is not a subadmin", 400);

        await Promise.all([
            AdminProfile.deleteOne({ userId: user._id }),
            User.findByIdAndDelete(user._id)
        ]);

        return successResponse(res, "Subadmin deleted successfully");
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/**
 * PATCH /api/admin/subadmins/:id/permissions
 * Update a subadmin's permissions (admin only).
 * Body: { permissions: [] }
 */
exports.updateSubadminPermissions = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return errorResponse(res, "Only super admin can update permissions", 403);
        }

        const { permissions } = req.body;
        if (!Array.isArray(permissions)) {
            return errorResponse(res, "Permissions must be an array", 400);
        }

        const profile = await AdminProfile.findOneAndUpdate(
            { userId: req.params.id },
            { permissions },
            { new: true }
        );
        if (!profile) return errorResponse(res, "Subadmin profile not found", 404);

        return successResponse(res, "Permissions updated successfully", profile);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/* ─────────────────────────────────────────────────────────────
   ADMIN LOGIN (Email + Password)
───────────────────────────────────────────────────────────── */

/**
 * POST /api/admin/login
 * Admin/Subadmin login using email + password (no OTP).
 * Body: { mobile, password }
 */
exports.adminLogin = async (req, res) => {
    try {
        const { mobile, password } = req.body;
        if (!mobile || !password) {
            return errorResponse(res, "Mobile and password are required", 400);
        }

        const user = await User.findOne({ mobile, role: { $in: ["admin", "subadmin"] } });
        if (!user) return errorResponse(res, "Invalid credentials", 401);

        if (user.status === "blocked") {
            return errorResponse(res, "Your account has been blocked", 403);
        }

        const profile = await AdminProfile.findOne({ userId: user._id });
        if (!profile || !profile.password) {
            return errorResponse(res, "Admin account not configured. Contact super admin.", 403);
        }

        const isMatch = await bcrypt.compare(password, profile.password);
        if (!isMatch) return errorResponse(res, "Invalid credentials", 401);

        const { generateToken } = require("../utils/jwt");
        const token = generateToken(user);

        user.lastLogin = new Date();
        await user.save();

        return successResponse(res, "Login successful", {
            token,
            role: user.role,
            permissions: profile.permissions
        });
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};
