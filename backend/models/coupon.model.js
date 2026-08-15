const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: [/^[A-Z0-9_-]+$/, "Coupon code can only use letters, numbers, - and _"],
      index: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0.01,
    },
    minSubtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    startsAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    usageLimit: {
      type: Number,
      default: 0,
      min: 0,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

couponSchema.pre("validate", function () {
  if (this.discountType === "percentage" && Number(this.value) > 100) {
    this.invalidate("value", "Percentage discount cannot exceed 100%");
  }

  if (this.startsAt && this.expiresAt && this.expiresAt <= this.startsAt) {
    this.invalidate("expiresAt", "Expiry must be after the start date");
  }
});

module.exports = mongoose.model("Coupon", couponSchema);