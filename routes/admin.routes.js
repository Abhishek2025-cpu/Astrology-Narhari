const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const adminMiddleware = require("../middleware/admin.middleware");
const upload = require("../middleware/upload.middleware");

const {
    /* Dashboard */
    getDashboardStats,

    /* Admin Auth */
    adminLogin,

    /* Admin Profile */
    getAdminProfile,
    updateAdminProfile,
    changeAdminPassword,

    /* Subadmin Management */
    getAllSubadmins,
    createSubadmin,
    deleteSubadmin,
    updateSubadminPermissions,

    /* User Management */
    getAllUsers,
    getUserById,
    updateUserStatus,
    deleteUser,
    adjustUserWallet,

    /* Partner (Astrologer) Management */
    getAllPartners,
    getPartnerById,
    updatePartnerApproval,
    updatePartnerStatus,
    deletePartner,

    /* Banner Management */
    getAllBanners,
    createBanner,
    updateBanner,
    deleteBanner,
    toggleBanner,

    /* Product Management */
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,

    /* Notification Management */
    getAllNotifications,
    broadcastNotification,
    sendNotificationToUser,
    deleteNotification,

    /* Wallet / Transactions */
    getAllTransactions
} = require("../controllers/admin.controller");

/* ─────────────────────────────────────────────────────────────
   PUBLIC ROUTES (No auth required)
───────────────────────────────────────────────────────────── */

// POST /api/admin/login
router.post("/login", adminLogin);

/* ─────────────────────────────────────────────────────────────
   PROTECTED ROUTES — require valid JWT + admin/subadmin role
───────────────────────────────────────────────────────────── */

// All routes below require authentication + admin role
router.use(auth, adminMiddleware);

/* ── Dashboard ─────────────────────────────────────────────── */
// GET /api/admin/dashboard
router.get("/dashboard", getDashboardStats);

/* ── Admin Profile ─────────────────────────────────────────── */
// GET  /api/admin/profile
router.get("/profile", getAdminProfile);
// PUT  /api/admin/profile
router.put("/profile", upload.single("image"), updateAdminProfile);
// POST /api/admin/change-password
router.post("/change-password", changeAdminPassword);

/* ── Subadmin Management (super admin only) ─────────────────── */
// GET    /api/admin/subadmins
router.get("/subadmins", getAllSubadmins);
// POST   /api/admin/subadmins
router.post("/subadmins", createSubadmin);
// DELETE /api/admin/subadmins/:id
router.delete("/subadmins/:id", deleteSubadmin);
// PATCH  /api/admin/subadmins/:id/permissions
router.patch("/subadmins/:id/permissions", updateSubadminPermissions);

/* ── User Management ───────────────────────────────────────── */
// GET    /api/admin/users?status=&search=&page=&limit=
router.get("/users", getAllUsers);
// GET    /api/admin/users/:id
router.get("/users/:id", getUserById);
// PATCH  /api/admin/users/:id/status
router.patch("/users/:id/status", updateUserStatus);
// DELETE /api/admin/users/:id
router.delete("/users/:id", deleteUser);
// POST   /api/admin/users/:id/wallet/adjust
router.post("/users/:id/wallet/adjust", adjustUserWallet);

/* ── Partner (Astrologer) Management ───────────────────────── */
// GET    /api/admin/partners?approvalStatus=&search=&page=&limit=
router.get("/partners", getAllPartners);
// GET    /api/admin/partners/:id
router.get("/partners/:id", getPartnerById);
// PATCH  /api/admin/partners/:id/approval  { status: approved|rejected|pending }
router.patch("/partners/:id/approval", updatePartnerApproval);
// PATCH  /api/admin/partners/:id/status    { status: active|blocked|inactive }
router.patch("/partners/:id/status", updatePartnerStatus);
// DELETE /api/admin/partners/:id
router.delete("/partners/:id", deletePartner);

/* ── Banner Management ─────────────────────────────────────── */
// GET    /api/admin/banners
router.get("/banners", getAllBanners);
// POST   /api/admin/banners  (multipart: title, link, isActive, image)
router.post("/banners", upload.single("image"), createBanner);
// PUT    /api/admin/banners/:id  (multipart: title, link, isActive, optional image)
router.put("/banners/:id", upload.single("image"), updateBanner);
// DELETE /api/admin/banners/:id
router.delete("/banners/:id", deleteBanner);
// PATCH  /api/admin/banners/:id/toggle
router.patch("/banners/:id/toggle", toggleBanner);

/* ── Product Management ────────────────────────────────────── */
// GET    /api/admin/products?category=&page=&limit=
router.get("/products", getAllProducts);
// GET    /api/admin/products/:id
router.get("/products/:id", getProductById);
// POST   /api/admin/products  (multipart: name, description, price, category, optional image)
router.post("/products", upload.single("image"), createProduct);
// PUT    /api/admin/products/:id  (multipart: name, description, price, category, optional image)
router.put("/products/:id", upload.single("image"), updateProduct);
// DELETE /api/admin/products/:id
router.delete("/products/:id", deleteProduct);

/* ── Notification Management ───────────────────────────────── */
// GET    /api/admin/notifications?page=&limit=
router.get("/notifications", getAllNotifications);
// POST   /api/admin/notifications/broadcast  { title, body }
router.post("/notifications/broadcast", broadcastNotification);
// POST   /api/admin/notifications/send  { userId, title, body }
router.post("/notifications/send", sendNotificationToUser);
// DELETE /api/admin/notifications/:id
router.delete("/notifications/:id", deleteNotification);

/* ── Wallet / Transactions ─────────────────────────────────── */
// GET    /api/admin/transactions?type=&userId=&page=&limit=
router.get("/transactions", getAllTransactions);

module.exports = router;
