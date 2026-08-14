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

const upload = require(
  "../middleware/uploadMiddleware.js"
);

const router = express.Router();

router.get("/", getProducts);

router.get(
  "/slug/:slug",
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