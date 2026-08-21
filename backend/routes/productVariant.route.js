const express = require("express");

const {
  createProductVariant,
  getProductVariants,
  getProductVariant,
  updateProductVariant,
  deleteProductVariant,
} = require("../controllers/productVariant.controller");

const {
  protect,
  admin,
  allowAdminProductRead,
} = require("../middleware/authMiddleware");
const requireActiveProduct = require(
  "../middleware/requireActiveProduct.js"
);

const router = express.Router();

/*
 * /api/products/:productId/variants
 */

router.post(
  "/:productId/variants",
  protect,
  admin,
  createProductVariant
);

router.get(
  "/:productId/variants",
  allowAdminProductRead,
  requireActiveProduct,
  getProductVariants
);

router.get(
  "/:productId/variants/:variantId",
  allowAdminProductRead,
  requireActiveProduct,
  getProductVariant
);

router.patch(
  "/:productId/variants/:variantId",
  protect,
  admin,
  updateProductVariant
);

router.delete(
  "/:productId/variants/:variantId",
  protect,
  admin,
  deleteProductVariant
);

module.exports = router;