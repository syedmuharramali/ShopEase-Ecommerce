const express = require("express");

const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware.js");
const validateMarkazProductSettings = require(
  "../middleware/validateMarkazProductSettings.js"
);
const {
  getMarkazProducts,
  updateMarkazProduct,
  getMarkazOrders,
} = require("../controllers/markaz.controller.js");
const {
  updateMarkazFulfillmentWithStatusSync,
} = require("../controllers/markazFulfillment.controller.js");

router.use(protect, admin);

router.get("/products", getMarkazProducts);
router.put(
  "/products/:productId",
  validateMarkazProductSettings,
  updateMarkazProduct
);

router.get("/orders", getMarkazOrders);
router.put(
  "/orders/:orderId/fulfillments/:fulfillmentId",
  updateMarkazFulfillmentWithStatusSync
);

module.exports = router;
