const express = require("express");

const {
  createProductOption,
  getProductOptions,
  updateProductOption,
  deleteProductOption,
} = require("../controllers/productOption.controller");

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
 * /api/products/:productId/options
 */

router.post(
  "/:productId/options",
  protect,
  admin,
  createProductOption
);

router.get(
  "/:productId/options",
  allowAdminProductRead,
  requireActiveProduct,
  getProductOptions
);

router.patch(
  "/:productId/options/:optionId",
  protect,
  admin,
  updateProductOption
);

router.delete(
  "/:productId/options/:optionId",
  protect,
  admin,
  deleteProductOption
);

module.exports = router;
