const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

router.get("/products/html", async (req, res) => {
    try {
        const products = await Product.find().lean();

        let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Products</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background: #f5f5f5;
                    padding: 20px;
                }

                h1 {
                    text-align: center;
                }

                .container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 20px;
                }

                .card {
                    width: 280px;
                    background: #fff;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,.1);
                    overflow: hidden;
                }

                .card img {
                    width: 100%;
                    height: 220px;
                    object-fit: cover;
                }

                .content {
                    padding: 15px;
                }

                .price {
                    color: green;
                    font-size: 20px;
                    font-weight: bold;
                }

                .description {
                    color: #666;
                    margin-top: 10px;
                }
            </style>
        </head>
        <body>

        <h1>Products</h1>

        <div class="container">
        `;

        products.forEach(product => {
            html += `
                <div class="card">
                    <img src="${product.image || 'https://via.placeholder.com/300'}" alt="${product.name}">
                    <div class="content">
                        <h2>${product.name}</h2>
                        <div class="price">₹${product.price}</div>
                        <p class="description">${product.description || ""}</p>
                        <p><strong>Category:</strong> ${product.category || "-"}</p>
                        <p><strong>Stock:</strong> ${product.stock || 0}</p>
                    </div>
                </div>
            `;
        });

        html += `
            </div>
        </body>
        </html>
        `;

        res.setHeader("Content-Type", "text/html");
        res.send(html);

    } catch (err) {
        console.error(err);
        res.status(500).send("<h1>Internal Server Error</h1>");
    }
});

module.exports = router;