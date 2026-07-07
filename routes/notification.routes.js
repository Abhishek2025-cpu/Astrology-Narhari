const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const { getNotifications } = require("../controllers/notification.controller");

router.get("/", auth, getNotifications);

module.exports = router;
