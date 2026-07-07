const express = require("express");
const router = express.Router();
const { getBanners } = require("../controllers/banner.controller");

router.get("/", getBanners);

module.exports = router;
