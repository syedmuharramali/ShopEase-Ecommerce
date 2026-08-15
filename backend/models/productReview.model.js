const mongoose = require("mongoose");

const productReviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    reviewerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: "Rating must be a whole number between 1 and 5",
      },
    },
    title: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 1500,
    },
    verifiedPurchase: {
      type: Boolean,
      default: true,
      immutable: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    moderatedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// One review per purchased product per order.
productReviewSchema.index(
  { product: 1, order: 1 },
  { unique: true }
);

productReviewSchema.index({ product: 1, status: 1, createdAt: -1 });
productReviewSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("ProductReview", productReviewSchema);
