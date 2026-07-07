const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const user = require("../middleware/user.middleware");
const { getBalance, getTransactions, recharge } = require("../controllers/wallet.controller");

router.get("/balance", auth, user, getBalance);
router.get("/transactions", auth, user, getTransactions);
router.post("/recharge", auth, user, recharge);

module.exports = router;
