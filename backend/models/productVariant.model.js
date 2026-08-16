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

    /*
     * Private supplier economics.
     * Hidden from normal storefront queries.
     */
    supplierSku: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 140,
      default: "",
      select: false,
    },

    supplierCost: {
      type: Number,
      min: 0,
      default: null,
      select: false,
    },

    expectedProfit: {
      type: Number,
      min: 0,
      default: null,
      select: false,
    },

    inventoryType: {
      type: String,
      enum: ["internal", "external"],
      default: "internal",
      select: false,
    },

    supplierLastCheckedAt: {
      type: Date,
      default: null,
      select: false,
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

productVariantSchema.pre("validate", function () {
  if (!Array.isArray(this.selectedOptions) || this.selectedOptions.length === 0) {
    this.combinationKey = "DEFAULT";
    return;
  }

  const normalizedOptions = this.selectedOptions
    .map((option) => ({
      optionId: option.optionId.toString(),
      valueId: option.valueId.toString(),
    }))
    .sort((a, b) => a.optionId.localeCompare(b.optionId));

  this.combinationKey = normalizedOptions
    .map((option) => `${option.optionId}:${option.valueId}`)
    .join("|");
});

productVariantSchema.index({
  product: 1,
  isActive: 1,
});

productVariantSchema.index({
  product: 1,
  stock: 1,
});

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
