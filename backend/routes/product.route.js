const express = require("express");

const {
  getProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/product.controller");

const {
  protect,
  admin,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getProducts);

router.get("/slug/:slug", getProductBySlug);

router.get("/:id", getProductById);

router.post(
  "/",
  protect,
  admin,
  createProduct
);

router.patch(
  "/:id",
  protect,
  admin,
  updateProduct
);

router.delete(
  "/:id",
  protect,
  admin,
  deleteProduct
);

module.exports = router;