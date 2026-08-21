const express = require("express");
const mongoose = require("mongoose");

const {
  getProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminProducts,
  getAdminProductById,
} = require("../controllers/product.controller");

const {
  protect,
  admin,
} = require("../middleware/authMiddleware");
const {
  optimizeProductImages,
} = require("../middleware/optimizeProductImages");

const upload = require(
  "../middleware/uploadMiddleware.js"
);

const router = express.Router();
const optimizeStorefrontImages = optimizeProductImages({ maxWidth: 1600 });
const optimizeStorefrontList = optimizeProductImages({
  maxWidth: 1200,
  stripVariants: true,
});

/*
 * Reject malformed MongoDB product IDs before they reach Mongoose.
 * This applies to every route in this router that uses the :id parameter,
 * including public product detail and protected admin update/archive routes.
 */
router.param("id", (req, res, next, id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      message: "Invalid product ID",
    });
  }

  return next();
});

router.get("/", optimizeStorefrontList, getProducts);

router.get(
  "/slug/:slug",
  optimizeStorefrontImages,
  getProductBySlug
);
router.get(
  "/admin/catalog",
  protect,
  admin,
  getAdminProducts
);

router.get(
  "/admin/:id",
  protect,
  admin,
  getAdminProductById
);
router.get(
  "/:id",
  optimizeStorefrontImages,
  getProductById
);

router.post(
  "/",
  protect,
  admin,
  upload.array("images", 8),
  createProduct
);

router.patch(
  "/:id",
  protect,
  admin,
  upload.array("images", 8),
  updateProduct
);

router.delete(
  "/:id",
  protect,
  admin,
  deleteProduct
);

module.exports = router;