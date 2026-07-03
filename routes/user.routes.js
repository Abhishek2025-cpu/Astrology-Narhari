const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth.middleware");
const user = require("../middleware/user.middleware");

const upload = require("../middleware/upload.middleware");

const {
    createProfile,
    getProfile,
    updateProfile,
    deleteProfile,
} = require("../controllers/user.controller");

router.post(
    "/onboarding",
    auth,
    user,
    upload.single("profileImage"),
    createProfile
);

router.get(
    "/profile",
    auth,
    user,
    getProfile
);

router.put(
    "/profile",
    auth,
    user,
    upload.single("profileImage"),
    updateProfile
);

router.delete(
    "/profile",
    auth,
    user,
    deleteProfile
);

module.exports = router;