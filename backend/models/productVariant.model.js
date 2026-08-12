const mongoose = require("mongoose");

const selectedOptionSchema = new mongoose.Schema(
  {
    optionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductOption",
      required: true,
    },

    optionName: {
      type: String,
      required: true,
      trim: true,
    },

    valueId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    value: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const variantImageSchema = new mongoose.Schema(
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

const productVariantSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 100,
    },

    title: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    selectedOptions: {
      type: [selectedOptionSchema],
      default: [],
    },

    /*
     * Internal normalized representation of the
     * complete variant combination.
     *
     * Example:
     *
     * COLOR:<valueId>|SIZE:<valueId>
     *
     * This is generated automatically.
     */
    combinationKey: {
      type: String,
      trim: true,
      default: null,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    compareAtPrice: {
      type: Number,
      min: 0,
      default: null,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    images: {
      type: [variantImageSchema],
      default: [],
    },

    isDefault: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * ----------------------------------------
 * Generate normalized combination key
 * ----------------------------------------
 *
 * We sort by optionId so that:
 *
 * Color=Black + Size=40
 *
 * and:
 *
 * Size=40 + Color=Black
 *
 * produce the same key.
 */
productVariantSchema.pre("validate", function (next) {
  if (!Array.isArray(this.selectedOptions)) {
    this.combinationKey = "DEFAULT";
    return next();
  }

  if (this.selectedOptions.length === 0) {
    this.combinationKey = "DEFAULT";
    return next();
  }

  const normalizedOptions = this.selectedOptions
    .map((option) => ({
      optionId: option.optionId.toString(),
      valueId: option.valueId.toString(),
    }))
    .sort((a, b) =>
      a.optionId.localeCompare(b.optionId)
    );

  this.combinationKey = normalizedOptions
    .map(
      (option) =>
        `${option.optionId}:${option.valueId}`
    )
    .join("|");

  next();
});

/*
 * ----------------------------------------
 * Common query:
 * Get active variants for a product.
 * ----------------------------------------
 */
productVariantSchema.index({
  product: 1,
  isActive: 1,
});

/*
 * ----------------------------------------
 * Inventory queries.
 * ----------------------------------------
 */
productVariantSchema.index({
  product: 1,
  stock: 1,
});

/*
 * ----------------------------------------
 * Prevent duplicate variant combinations.
 *
 * Example:
 *
 * Product A + COLOR:BLACK
 *
 * can only exist once.
 * ----------------------------------------
 */
productVariantSchema.index(
  {
    product: 1,
    combinationKey: 1,
  },
  {
    unique: true,
    sparse: true,
  }
);

/*
 * ----------------------------------------
 * Only one default variant per product.
 * ----------------------------------------
 */
productVariantSchema.index(
  {
    product: 1,
    isDefault: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      isDefault: true,
    },
  }
);

module.exports = mongoose.model(
  "ProductVariant",
  productVariantSchema
);