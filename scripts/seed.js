require("dotenv").config();
const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const mongoose = require("mongoose");
const User = require("../models/User");
const UserProfile = require("../models/UserProfile");
const PartnerProfile = require("../models/PartnerProfile");
const Banner = require("../models/Banner");
const Product = require("../models/Product");
const Notification = require("../models/Notification");
const WalletTransaction = require("../models/WalletTransaction");

const seedData = async () => {
    try {
        console.log("🔄 Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Database Connected.");

        // Clear existing data
        console.log("🧹 Clearing existing collection data...");
        await User.deleteMany({});
        await UserProfile.deleteMany({});
        await PartnerProfile.deleteMany({});
        await Banner.deleteMany({});
        await Product.deleteMany({});
        await Notification.deleteMany({});
        await WalletTransaction.deleteMany({});
        console.log("🧹 Database cleared.");

        // Create standard test user
        console.log("👤 Seeding User...");
        const user = await User.create({
            mobile: "9999999999",
            countryCode: "+91",
            role: "user",
            isVerified: true,
            profileCompleted: true,
            walletAmount: 1000
        });

        await UserProfile.create({
            userId: user._id,
            fullName: "Mystic Traveler",
            gender: "female",
            dob: new Date("1995-08-15"),
            birthTime: "14:30",
            birthPlace: "Mumbai, IN"
        });

        // Create astrologers (partners)
        console.log("🧙 Seeding Astrologers (Partners)...");
        const partner1 = await User.create({
            mobile: "8888888888",
            countryCode: "+91",
            role: "partner",
            isVerified: true,
            profileCompleted: true
        });
        await PartnerProfile.create({
            userId: partner1._id,
            fullName: "Pandit Sharma",
            gender: "male",
            dob: new Date("1975-04-12"),
            email: "sharma@astro.com",
            experience: 15,
            languages: ["Hindi", "Sanskrit"],
            specialization: ["Vedic", "Marriage", "Kundli"],
            bio: "Experienced Vedic astrologer specialized in marital matching and career guidance.",
            priceChat: 25,
            priceCall: 30,
            profileImage: { url: "https://i.pravatar.cc/150?img=11", publicId: "p1" },
            approvalStatus: "approved",
            rating: 4.9,
            totalReviews: 120,
            isOnline: true,
            isBusy: false
        });

        const partner2 = await User.create({
            mobile: "7777777777",
            countryCode: "+91",
            role: "partner",
            isVerified: true,
            profileCompleted: true
        });
        await PartnerProfile.create({
            userId: partner2._id,
            fullName: "Dr. Meera Joshi",
            gender: "female",
            dob: new Date("1982-09-24"),
            email: "meera@astro.com",
            experience: 8,
            languages: ["English", "Hindi", "Gujarati"],
            specialization: ["Tarot", "Love", "Relationship"],
            bio: "Ph.D. in astrology, certified tarot card reader helping people align their love lives.",
            priceChat: 20,
            priceCall: 25,
            profileImage: { url: "https://i.pravatar.cc/150?img=22", publicId: "p2" },
            approvalStatus: "approved",
            rating: 4.8,
            totalReviews: 85,
            isOnline: true,
            isBusy: false
        });

        const partner3 = await User.create({
            mobile: "6666666666",
            countryCode: "+91",
            role: "partner",
            isVerified: true,
            profileCompleted: true
        });
        await PartnerProfile.create({
            userId: partner3._id,
            fullName: "Acharya Verma",
            gender: "male",
            dob: new Date("1980-01-05"),
            email: "verma@astro.com",
            experience: 10,
            languages: ["Hindi", "Punjabi"],
            specialization: ["Numerology", "Vastu"],
            bio: "Professional Vastu Consultant and Numerologist with deep knowledge of spatial and numerical energies.",
            priceChat: 15,
            priceCall: 20,
            profileImage: { url: "https://i.pravatar.cc/150?img=33", publicId: "p3" },
            approvalStatus: "approved",
            rating: 4.7,
            totalReviews: 64,
            isOnline: false,
            isBusy: false
        });

        const partner4 = await User.create({
            mobile: "5555555555",
            countryCode: "+91",
            role: "partner",
            isVerified: true,
            profileCompleted: true
        });
        await PartnerProfile.create({
            userId: partner4._id,
            fullName: "Radhika Iyer",
            gender: "female",
            dob: new Date("1990-11-18"),
            email: "radhika@astro.com",
            experience: 5,
            languages: ["Tamil", "English", "Hindi"],
            specialization: ["Palmistry", "Career"],
            bio: "Experienced Palmist offering precise insights on life path, health, and career changes.",
            priceChat: 30,
            priceCall: 35,
            profileImage: { url: "https://i.pravatar.cc/150?img=44", publicId: "p4" },
            approvalStatus: "approved",
            rating: 4.5,
            totalReviews: 32,
            isOnline: true,
            isBusy: true
        });

        // Seed Banners
        console.log("🚩 Seeding Banners...");
        await Banner.create([
            {
                title: "Get 50% Off on First Chat",
                imageUrl: "https://picsum.photos/seed/banner1/600/300"
            },
            {
                title: "Free Kundli Matching",
                imageUrl: "https://picsum.photos/seed/banner2/600/300"
            },
            {
                title: "Talk to Expert Astrologers",
                imageUrl: "https://picsum.photos/seed/banner3/600/300"
            }
        ]);

        // Seed Products
        console.log("📦 Seeding Cosmic Shop Products...");
        await Product.create([
            {
                name: "Healing Amethyst Gemstone",
                description: "Natural raw purple amethyst cluster. Brings peace, emotional clarity, and stress relief.",
                price: 1299,
                imageUrl: "https://picsum.photos/seed/product1/300/300",
                category: "Gemstones"
            },
            {
                name: "Yearly Destiny Report 2026",
                description: "Detailed customized PDF report outlining transit effects and month-by-month analysis for 2026.",
                price: 499,
                imageUrl: "https://picsum.photos/seed/product2/300/300",
                category: "Reports"
            },
            {
                name: "Rudraksha Mala (108 Beads)",
                description: "Blessed five-faced Rudraksha beads for meditation, focus, and overall well-being.",
                price: 750,
                imageUrl: "https://picsum.photos/seed/product3/300/300",
                category: "Pooja Items"
            }
        ]);

        // Seed Notifications
        console.log("🔔 Seeding Global Notifications...");
        await Notification.create([
            {
                title: "Daily Horoscope Ready ♌",
                body: "Your personalized horoscope for Leo is live now. Tap to reveal your luck ratings!"
            },
            {
                title: "Welcome to AstroShriyam 🚀",
                body: "Your cosmic journey starts today! Generate your free birth chart / Kundli now."
            },
            {
                title: "Consultation Complete",
                body: "Your wallet has been updated. Rate your chat with Dr. Meera Joshi now."
            }
        ]);

        console.log("🎉 Database Seed Completed Successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error.message);
        process.exit(1);
    }
};

seedData();
