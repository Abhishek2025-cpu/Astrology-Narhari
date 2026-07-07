require("dotenv").config();
const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const connectDB = require("./config/db");

const app = express();

// Database
connectDB();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Astrologer Backend Running 🚀"
    });
});

// Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/user", require("./routes/user.routes"));
app.use("/api/partner", require("./routes/partner.routes"));
app.use("/api/banners", require("./routes/banner.routes"));
app.use("/api/astrologers", require("./routes/astrologer.routes"));
app.use("/api/horoscope", require("./routes/horoscope.routes"));
app.use("/api/kundli", require("./routes/kundli.routes"));
app.use("/api/wallet", require("./routes/wallet.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));
app.use("/api/shop/products", require("./routes/product.routes"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});