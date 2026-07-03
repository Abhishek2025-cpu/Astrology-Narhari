require("dotenv").config();

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
// app.use("/api/auth", require("./routes/auth.routes"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});