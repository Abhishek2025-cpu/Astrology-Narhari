const express = require("express");
const router = express.Router();
const { getHoroscope } = require("../controllers/horoscope.controller");

router.get("/:sign", getHoroscope);

module.exports = router;
