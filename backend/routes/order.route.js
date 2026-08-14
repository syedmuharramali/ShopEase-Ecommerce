const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware");
const {
  createOrder,
  createCartOrder,
  getAllOrders,
  getOrderById,
  trackOrder,
  updateOrderStatus,
} = require("../controllers/order.controller.js");

// Cart checkout gets its own abuse protection. The existing server-level
// limiter can continue protecting the single-item /create/:productId route.
const cartOrderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message: "Too many checkout attempts. Please wait a few minutes and try again.",
  },
});

const trackingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message: "Too many tracking attempts. Please wait a few minutes and try again.",
  },
});

router.post("/create/:productId", createOrder);
router.post("/create-cart", cartOrderLimiter, createCartOrder);
router.post("/track", trackingLimiter, trackOrder);

router.get("/", protect, admin, getAllOrders);
router.get("/:id", protect, admin, getOrderById);
router.put("/:id/status", protect, admin, updateOrderStatus);

module.exports = router;
