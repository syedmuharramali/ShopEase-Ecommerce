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
  requireActiveProduct,
  getProductVariants
);

router.get(
  "/admin/:productId/variants",
  protect,
  admin,
  getProductVariants
);

router.get(
  "/:productId/variants/:variantId",
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