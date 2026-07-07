const Product = require("../models/Product");
const { successResponse, errorResponse } = require("../utils/response");

exports.getProducts = async (req, res) => {
    try {
        const { category } = req.query;
        const filter = {};
        if (category && category !== "All") {
            filter.category = category;
        }

        const products = await Product.find(filter);
        return successResponse(res, "Products retrieved successfully", products);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        if (!product) {
            return errorResponse(res, "Product not found", 404);
        }
        return successResponse(res, "Product details retrieved successfully", product);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};
