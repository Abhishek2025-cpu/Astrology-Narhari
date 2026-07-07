const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

router.get("/products", async (req, res) => {
    try {
        const products = await Product.find()
            .populate("category")
            .lean();

        const html = products.map(product => `
<section class="astro-product" data-id="${product._id}">

    <div class="product-gallery">
        <img
            src="${product.thumbnail || "https://placehold.co/800x500?text=Astrology+Product"}"
            alt="${product.name}"
            loading="lazy"
        />
    </div>

    <div class="product-details">

        <span class="badge">
            ⭐ Bestseller
        </span>

        <h1>${product.name}</h1>

        <p class="category">
            ${product.category?.name || "Astrology Service"}
        </p>

        <div class="price-box">

            <span class="price">
                ₹${product.discountPrice || product.price}
            </span>

            ${
                product.discountPrice
                    ? `<span class="mrp">₹${product.price}</span>`
                    : ""
            }

        </div>

        <div class="description">
            ${product.description || product.shortDescription || ""}
        </div>

        <h3>Highlights</h3>

        <ul>

            <li>✨ 100% Personalized Report</li>

            <li>🔮 Prepared by Experienced Astrologers</li>

            <li>📄 PDF Delivered within 24 Hours</li>

            <li>🪐 Based on Vedic Astrology</li>

            <li>📱 Mobile Friendly Report</li>

            <li>💬 Lifetime Support</li>

        </ul>

        <h3>Benefits</h3>

        <p>
            This report helps you understand your career, marriage,
            relationships, finances, health, lucky periods,
            planetary strengths and personalized remedies.
        </p>

        <table>

            <tr>
                <td>Delivery</td>
                <td>24 Hours</td>
            </tr>

            <tr>
                <td>Language</td>
                <td>English / Hindi</td>
            </tr>

            <tr>
                <td>Format</td>
                <td>PDF</td>
            </tr>

            <tr>
                <td>Support</td>
                <td>Lifetime</td>
            </tr>

        </table>

        <div class="cta">

            <button
                class="buy-now"
                data-product="${product._id}">
                Buy Now
            </button>

        </div>

    </div>

</section>
        `).join("");

        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.send(html);

    } catch (err) {
        console.error(err);
        res.status(500).send("<p>Something went wrong.</p>");
    }
});

module.exports = router;