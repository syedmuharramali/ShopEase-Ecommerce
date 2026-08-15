const express = require("express");
const rateLimit = require("express-rate-limit");
const { protect, admin } = require("../middleware/authMiddleware");
const {
  getProductReviews,
  createProductReview,
  getAdminReviews,
  moderateReview,
} = require("../controllers/productReview.controller");

const router = express.Router();

const reviewSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message: "Too many review attempts. Please wait a few minutes and try again.",
  },
});

router.get("/product/:productId", getProductReviews);
router.post("/product/:productId", reviewSubmitLimiter, createProductReview);

router.get("/admin", protect, admin, getAdminReviews);
router.patch("/admin/:reviewId/status", protect, admin, moderateReview);

module.exports = router;
