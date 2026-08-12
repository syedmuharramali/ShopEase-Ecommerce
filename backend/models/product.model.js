const mongoose = require("mongoose");

const productImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },

    alt: {
      type: String,
      trim: true,
      default: "",
    },

    position: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    shortDescription: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    brand: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
      index: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    images: {
      type: [productImageSchema],
      default: [],
    },

    tags: {
      type: [String],
      default: [],
      index: true,
    },

    attributes: {
      type: Map,
      of: String,
      default: {},
    },

    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "draft",
      index: true,
    },

    featured: {
      type: Boolean,
      default: false,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * Useful for storefront queries such as:
 *
 * active products in a category
 * sorted by newest
 */
productSchema.index({
  category: 1,
  status: 1,
  createdAt: -1,
});

/*
 * Useful for featured product queries.
 */
productSchema.index({
  featured: 1,
  status: 1,
  createdAt: -1,
});

module.exports = mongoose.model("Product", productSchema);