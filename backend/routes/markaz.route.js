const express = require("express");

const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware.js");
const {
  getMarkazProducts,
  updateMarkazProduct,
  getMarkazOrders,
  updateMarkazFulfillment,
} = require("../controllers/markaz.controller.js");

router.use(protect, admin);

router.get("/products", getMarkazProducts);
router.put("/products/:productId", updateMarkazProduct);

router.get("/orders", getMarkazOrders);
router.put(
  "/orders/:orderId/fulfillments/:fulfillmentId",
  updateMarkazFulfillment
);

module.exports = router;
