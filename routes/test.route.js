const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

router.get("/products", async (req, res) => {
    try {
        const products = await Product.find().lean();

        let html = "";

        products.forEach((product) => {
            html += `
            <article class="astro-product" data-id="${product._id}">
                
                <div class="product-image">
                    <img
                        src="${product.thumbnail}"
                        alt="${product.name}"
                        loading="lazy"
                    />
                </div>

                <div class="product-content">

                    <h2 class="product-title">
                        ${product.name}
                    </h2>

                    <div class="product-category">
                        ${product.category?.name || ""}
                    </div>

                    <div class="price-section">
                        <span class="selling-price">
                            ₹${product.discountPrice || product.price}
                        </span>

                        ${
                            product.discountPrice
                                ? `<span class="original-price">₹${product.price}</span>`
                                : ""
                        }
                    </div>

                    <div class="product-description">
                        ${product.shortDescription || ""}
                    </div>

                    <div class="astro-benefits">
                        <h4>What You'll Get</h4>

                        <ul>
                            <li>✔ Detailed Horoscope Reading</li>
                            <li>✔ Planetary Position Analysis</li>
                            <li>✔ Career & Finance Predictions</li>
                            <li>✔ Love & Marriage Insights</li>
                            <li>✔ Health Guidance</li>
                            <li>✔ Personalized Remedies</li>
                        </ul>
                    </div>

                    <div class="product-footer">

                        <span class="delivery">
                            📄 PDF Report within 24 Hours
                        </span>

                        <button
                            class="buy-now"
                            data-product-id="${product._id}"
                        >
                            Purchase Report
                        </button>

                    </div>

                </div>

            </article>
            `;
        });

        res.type("text/html");
        res.send(html);

    } catch (error) {
        console.error(error);
        res.status(500).send("<div>Something went wrong.</div>");
    }
});

module.exports = router;