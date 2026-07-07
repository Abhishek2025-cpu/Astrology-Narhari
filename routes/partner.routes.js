const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const partner = require("../middleware/partner.middleware");
const upload = require("../middleware/upload.middleware");
const {
    createPartnerProfile,
    getPartnerProfile,
    updatePartnerProfile
} = require("../controllers/partner.controller");

const partnerUploads = upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "governmentId", maxCount: 1 },
    { name: "certificate", maxCount: 1 }
]);

router.post("/onboarding", auth, partner, partnerUploads, createPartnerProfile);
router.get("/profile", auth, partner, getPartnerProfile);
router.put("/profile", auth, partner, partnerUploads, updatePartnerProfile);

module.exports = router;
