const mongoose = require("mongoose");

const Product = require("../models/product.model.js");

const requireActiveProduct = async (req, res, next) => {
  try {
    const productId = req.params?.productId;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const product = await Product.exists({
      _id: productId,
      status: "active",
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return next();
  } catch (error) {
    console.error("Active product check error:", error);
    return res.status(500).json({
      message: "Failed to validate product availability",
    });
  }
};

module.exports = requireActiveProduct;
