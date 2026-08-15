const mongoose = require("mongoose");
const Coupon = require("../models/coupon.model.js");
const {
  getCouponQuote,
  normalizeCouponCode,
} = require("../services/coupon.service.js");

function cleanNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function couponPayload(body = {}) {
  return {
    code: normalizeCouponCode(body.code),
    discountType: body.discountType,
    value: cleanNumber(body.value),
    minSubtotal: Math.max(0, cleanNumber(body.minSubtotal)),
    maxDiscount: Math.max(0, cleanNumber(body.maxDiscount)),
    startsAt: body.startsAt ? new Date(body.startsAt) : new Date(),
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    usageLimit: Math.max(0, Math.floor(cleanNumber(body.usageLimit))),
    isActive: body.isActive !== false && body.isActive !== "false",
  };
}

exports.validateCoupon = async (req, res) => {
  try {
    const subtotal = Number(req.body?.subtotal);
    const quote = await getCouponQuote(req.body?.code, subtotal);

    return res.json({
      valid: true,
      coupon: {
        code: quote.coupon.code,
        discountType: quote.coupon.discountType,
        value: quote.coupon.value,
        minSubtotal: quote.coupon.minSubtotal,
        maxDiscount: quote.coupon.maxDiscount,
        expiresAt: quote.coupon.expiresAt,
      },
      discountAmount: quote.discountAmount,
      totalAfterDiscount: Number(Math.max(0, subtotal - quote.discountAmount).toFixed(2)),
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      valid: false,
      message: error.message || "Coupon could not be applied",
    });
  }
};

exports.getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    return res.json({ coupons });
  } catch (error) {
    console.error("Get coupons error:", error);
    return res.status(500).json({ message: "Failed to load coupons" });
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const payload = couponPayload(req.body);

    if (!payload.code) return res.status(400).json({ message: "Coupon code is required" });
    if (!["percentage", "fixed"].includes(payload.discountType)) {
      return res.status(400).json({ message: "Choose percentage or fixed discount" });
    }
    if (!payload.expiresAt || Number.isNaN(payload.expiresAt.getTime())) {
      return res.status(400).json({ message: "A valid expiry date is required" });
    }

    const coupon = await Coupon.create({
      ...payload,
      createdBy: req.user?._id || null,
    });

    return res.status(201).json({ message: "Coupon created", coupon });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "A coupon with this code already exists" });
    }
    if (error?.name === "ValidationError") {
      return res.status(400).json({
        message: Object.values(error.errors || {})[0]?.message || "Invalid coupon",
      });
    }
    console.error("Create coupon error:", error);
    return res.status(500).json({ message: "Failed to create coupon" });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid coupon ID" });
    }

    const payload = couponPayload(req.body);
    if (!payload.code) return res.status(400).json({ message: "Coupon code is required" });
    if (!["percentage", "fixed"].includes(payload.discountType)) {
      return res.status(400).json({ message: "Choose percentage or fixed discount" });
    }
    if (!payload.expiresAt || Number.isNaN(payload.expiresAt.getTime())) {
      return res.status(400).json({ message: "A valid expiry date is required" });
    }

    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      { $set: payload },
      { new: true, runValidators: true }
    );

    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    return res.json({ message: "Coupon updated", coupon });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "A coupon with this code already exists" });
    }
    if (error?.name === "ValidationError") {
      return res.status(400).json({
        message: Object.values(error.errors || {})[0]?.message || "Invalid coupon",
      });
    }
    console.error("Update coupon error:", error);
    return res.status(500).json({ message: "Failed to update coupon" });
  }
};

exports.archiveCoupon = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid coupon ID" });
    }

    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    return res.json({ message: "Coupon disabled", coupon });
  } catch (error) {
    console.error("Archive coupon error:", error);
    return res.status(500).json({ message: "Failed to disable coupon" });
  }
};