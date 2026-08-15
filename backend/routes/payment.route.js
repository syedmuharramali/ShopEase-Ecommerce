const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  getPaymentConfig,
  jazzCashReturn,
} = require("../controllers/payment.controller.js");

const router = express.Router();

const paymentReturnLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

router.get("/config", getPaymentConfig);
router.post(
  "/jazzcash/return",
  paymentReturnLimiter,
  express.urlencoded({ extended: false }),
  jazzCashReturn
);

module.exports = router;