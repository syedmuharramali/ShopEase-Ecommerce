const mongoose = require("mongoose");
const Coupon = require("../models/coupon.model.js");

function normalizeCouponCode(value) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function calculateDiscount(coupon, subtotal) {
  const safeSubtotal = Math.max(0, Number(subtotal) || 0);
  let discount = 0;

  if (coupon.discountType === "percentage") {
    discount = safeSubtotal * (Number(coupon.value) / 100);
    if (Number(coupon.maxDiscount) > 0) {
      discount = Math.min(discount, Number(coupon.maxDiscount));
    }
  } else {
    discount = Number(coupon.value) || 0;
  }

  return Number(Math.min(safeSubtotal, Math.max(0, discount)).toFixed(2));
}

function activeCouponQuery(code, subtotal, now = new Date()) {
  return {
    code: normalizeCouponCode(code),
    isActive: true,
    startsAt: { $lte: now },
    expiresAt: { $gt: now },
    minSubtotal: { $lte: Number(subtotal) || 0 },
    $or: [
      { usageLimit: 0 },
      { $expr: { $lt: ["$usedCount", "$usageLimit"] } },
    ],
  };
}

function toCouponSnapshot(coupon, discountAmount) {
  return {
    couponId: coupon._id,
    code: coupon.code,
    discountType: coupon.discountType,
    value: Number(coupon.value),
    discountAmount: Number(discountAmount),
  };
}

async function getCouponQuote(code, subtotal) {
  const normalizedCode = normalizeCouponCode(code);
  const safeSubtotal = Number(subtotal);

  if (!normalizedCode) {
    const error = new Error("Enter a coupon code");
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isFinite(safeSubtotal) || safeSubtotal < 0) {
    const error = new Error("Invalid order subtotal");
    error.statusCode = 400;
    throw error;
  }

  const coupon = await Coupon.findOne(activeCouponQuery(normalizedCode, safeSubtotal)).lean();

  if (!coupon) {
    const error = new Error("This coupon is invalid, expired, inactive, or has reached its usage limit");
    error.statusCode = 400;
    throw error;
  }

  const discountAmount = calculateDiscount(coupon, safeSubtotal);

  return {
    coupon,
    discountAmount,
    snapshot: toCouponSnapshot(coupon, discountAmount),
  };
}

async function reserveCouponUsage(code, subtotal) {
  const normalizedCode = normalizeCouponCode(code);

  if (!normalizedCode) return null;

  const safeSubtotal = Number(subtotal);
  const now = new Date();

  const coupon = await Coupon.findOneAndUpdate(
    activeCouponQuery(normalizedCode, safeSubtotal, now),
    { $inc: { usedCount: 1 } },
    { returnDocument: "after", runValidators: true }
  ).lean();

  if (!coupon) {
    const error = new Error("This coupon is no longer available. Please refresh your total and try again");
    error.statusCode = 409;
    throw error;
  }

  const discountAmount = calculateDiscount(coupon, safeSubtotal);

  return {
    coupon,
    discountAmount,
    snapshot: toCouponSnapshot(coupon, discountAmount),
  };
}

async function releaseCouponUsage(couponId) {
  if (!couponId || !mongoose.Types.ObjectId.isValid(couponId)) return;

  await Coupon.updateOne(
    { _id: couponId, usedCount: { $gt: 0 } },
    { $inc: { usedCount: -1 } }
  );
}

module.exports = {
  normalizeCouponCode,
  calculateDiscount,
  getCouponQuote,
  reserveCouponUsage,
  releaseCouponUsage,
};