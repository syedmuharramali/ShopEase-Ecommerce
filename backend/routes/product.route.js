const express = require("express");

const {
  getProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminProducts,
  getAdminProductById
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

router.get("/", optimizeStorefrontImages, getProducts);

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