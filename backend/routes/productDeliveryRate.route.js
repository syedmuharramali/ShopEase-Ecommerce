const express =
  require("express");

const {
  getProductDeliveryRates,
  getAdminProductDeliveryRates,
  saveProductDeliveryRates,
} = require(
  "../controllers/productDeliveryRate.controller"
);

const {
  protect,
  admin,
} = require(
  "../middleware/authMiddleware"
);

const router =
  express.Router();

/*
 * Admin GET
 *
 * Important:
 * Put this before the public dynamic route.
 */

router.get(
  "/admin/:productId/delivery-rates",
  protect,
  admin,
  getAdminProductDeliveryRates
);

/*
 * Admin create/update
 */

router.put(
  "/:productId/delivery-rates",
  protect,
  admin,
  saveProductDeliveryRates
);

/*
 * Public checkout endpoint
 */

router.get(
  "/:productId/delivery-rates",
  getProductDeliveryRates
);

module.exports =
  router;