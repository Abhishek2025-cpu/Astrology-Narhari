const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const user = require("../middleware/user.middleware");
const { getMyKundli, generateKundli, matchmaking } = require("../controllers/kundli.controller");

router.get("/my-kundli", auth, user, getMyKundli);
router.post("/generate", auth, user, generateKundli);
router.post("/match", auth, user, matchmaking);

module.exports = router;
