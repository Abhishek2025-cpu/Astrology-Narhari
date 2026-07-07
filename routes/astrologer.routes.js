const express = require("express");
const router = express.Router();
const { 
    getAllAstrologers, 
    getLiveAstrologers, 
    getTopAstrologers, 
    searchAstrologers 
} = require("../controllers/astrologer.controller");

router.get("/", getAllAstrologers);
router.get("/live", getLiveAstrologers);
router.get("/top", getTopAstrologers);
router.get("/search", searchAstrologers);

module.exports = router;
