const mongoose = require("mongoose");

const optionValueSchema = new mongoose.Schema(
  {
    value: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    position: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: true,
  }
);

const productOptionSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    values: {
      type: [optionValueSchema],
      default: [],
    },

    position: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * A product should not have the same option twice.
 *
 * Example:
 *
 * Product X
 *   Color       ✓
 *   Size        ✓
 *   Color       ✗
 */
productOptionSchema.index(
  {
    product: 1,
    slug: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "ProductOption",
  productOptionSchema
);