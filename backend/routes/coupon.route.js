const express = require("express");
const rateLimit = require("express-rate-limit");
const { protect, admin } = require("../middleware/authMiddleware");
const {
  validateCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  archiveCoupon,
} = require("../controllers/coupon.controller.js");

const router = express.Router();

const couponLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many coupon attempts. Please wait a few minutes." },
});

router.post("/validate", couponLimiter, validateCoupon);
router.get("/admin", protect, admin, getCoupons);
router.post("/admin", protect, admin, createCoupon);
router.patch("/admin/:id", protect, admin, updateCoupon);
router.delete("/admin/:id", protect, admin, archiveCoupon);

module.exports = router;