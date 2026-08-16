const mongoose = require("mongoose");

const selectedOptionSnapshotSchema = new mongoose.Schema(
  {
    optionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    optionName: { type: String, required: true, trim: true },
    valueId: { type: mongoose.Schema.Types.ObjectId, required: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const variantSnapshotSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, trim: true },
    title: { type: String, default: "", trim: true },
    price: { type: Number, required: true, min: 0 },
    selectedOptions: { type: [selectedOptionSnapshotSchema], default: [] },
  },
  { _id: false }
);

const productSnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    image: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: "ProductVariant", required: true },
    productSnapshot: { type: productSnapshotSchema, required: true },
    variantSnapshot: { type: variantSnapshotSchema, required: true },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryCharge: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const supplierFulfillmentSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
    },
    provider: {
      type: String,
      enum: ["markaz"],
      required: true,
    },
    supplierProductCode: {
      type: String,
      trim: true,
      default: "",
    },
    supplierSku: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    supplierCost: {
      type: Number,
      min: 0,
      default: null,
    },
    expectedProfit: {
      type: Number,
      min: 0,
      default: null,
    },
    quantity: {
      type: Number,
      min: 1,
      required: true,
    },
    status: {
      type: String,
      enum: ["not_submitted", "submitted", "shipped", "delivered", "cancelled"],
      default: "not_submitted",
      index: true,
    },
    externalOrderId: {
      type: String,
      trim: true,
      default: "",
    },
    trackingId: {
      type: String,
      trim: true,
      default: "",
    },

    /*
     * Customer-safe delivery details copied from the supplier/courier view.
     * These live beside the private Markaz ledger but are only exposed through
     * a dedicated public projection that never returns costs or supplier IDs.
     */
    courierName: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    estimatedDeliveryMinDays: {
      type: Number,
      min: 1,
      max: 90,
      default: null,
    },
    estimatedDeliveryMaxDays: {
      type: Number,
      min: 1,
      max: 90,
      default: null,
    },
    riderName: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    riderPhone: {
      type: String,
      trim: true,
      maxlength: 30,
      default: "",
    },

    submittedAt: {
      type: Date,
      default: null,
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const couponSnapshotSchema = new mongoose.Schema(
  {
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" },
    code: { type: String, trim: true, uppercase: true },
    discountType: { type: String, enum: ["percentage", "fixed"] },
    value: { type: Number, min: 0 },
    discountAmount: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

const paymentSnapshotSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ["cod", "card", "jazzcash"],
      default: "cod",
    },
    status: {
      type: String,
      enum: ["unpaid", "pending", "paid", "failed", "refunded"],
      default: "unpaid",
      index: true,
    },
    transactionRef: { type: String, default: "", trim: true },
    gatewayResponseCode: { type: String, default: "", trim: true },
    gatewayResponseMessage: { type: String, default: "", trim: true },
    retrievalReferenceNo: { type: String, default: "", trim: true },
    paidAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, sparse: true, index: true },
    name: { type: String, required: [true, "Name is required"], trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"] },
    phoneNumber: { type: String, required: true, match: [/^\d{10,15}$/, "Please enter a valid phone number"] },

    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", index: true },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: "ProductVariant", index: true },
    variantSnapshot: { type: variantSnapshotSchema },
    quantity: { type: Number, min: 1, default: 1 },

    items: { type: [orderItemSchema], default: [] },

    /*
     * Private supplier fulfillment ledger.
     * select:false prevents tracking/customer endpoints from leaking Markaz
     * costs, supplier identifiers, or fulfillment references by accident.
     */
    supplierFulfillments: {
      type: [supplierFulfillmentSchema],
      default: [],
      select: false,
    },

    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    deliveryCharge: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0, default: 0 },
    coupon: { type: couponSnapshotSchema, default: undefined },
    couponUsageReleased: { type: Boolean, default: false },

    province: {
      type: String,
      required: true,
      enum: [
        "Punjab",
        "Sindh",
        "Khyber Pakhtunkhwa",
        "Balochistan",
        "Gilgit-Baltistan",
        "Islamabad Capital Territory",
        "Azad Jammu & Kashmir",
        "KPK",
        "AJK",
        "Gilgit Baltistan",
      ],
    },
    city: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    paymentMethod: { type: String, enum: ["cod", "card", "jazzcash"], default: "cod", required: true },
    payment: { type: paymentSnapshotSchema, default: () => ({ provider: "cod", status: "unpaid" }) },
    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

orderSchema.pre("validate", function () {
  const hasItems = Array.isArray(this.items) && this.items.length > 0;
  const hasLegacySingle = this.product && this.variant && this.variantSnapshot;

  if (!hasItems && !hasLegacySingle) {
    this.invalidate("items", "Order must contain at least one product item");
  }
});

/*
 * Freeze supplier economics at the moment the order is created. This keeps a
 * historical Markaz SKU/cost/profit snapshot even if the catalog is edited
 * later. The hook stays fail-safe: if supplier models are unavailable, normal
 * ShopEase order creation still proceeds.
 */
orderSchema.pre("save", async function () {
  if (!this.isNew || (this.supplierFulfillments || []).length > 0) return;
  if (!mongoose.models.Product || !mongoose.models.ProductVariant) return;

  const sourceItems =
    Array.isArray(this.items) && this.items.length > 0
      ? this.items
      : this.product && this.variant
        ? [
            {
              product: this.product,
              variant: this.variant,
              quantity: this.quantity || 1,
            },
          ]
        : [];

  if (!sourceItems.length) return;

  try {
    const Product = mongoose.model("Product");
    const ProductVariant = mongoose.model("ProductVariant");

    const productIds = [...new Set(sourceItems.map((item) => String(item.product)))];
    const variantIds = [...new Set(sourceItems.map((item) => String(item.variant)))];

    const [products, variants] = await Promise.all([
      Product.find({ _id: { $in: productIds } })
        .select("+supplier +supplierProductCode +fulfillmentType")
        .lean(),
      ProductVariant.find({ _id: { $in: variantIds } })
        .select("+supplierSku +supplierCost +expectedProfit +inventoryType")
        .lean(),
    ]);

    const productMap = new Map(products.map((product) => [String(product._id), product]));
    const variantMap = new Map(variants.map((variant) => [String(variant._id), variant]));

    this.supplierFulfillments = sourceItems
      .map((item) => {
        const product = productMap.get(String(item.product));
        const variant = variantMap.get(String(item.variant));

        if (!product || !variant || product.supplier !== "markaz") return null;

        return {
          product: item.product,
          variant: item.variant,
          provider: "markaz",
          supplierProductCode: product.supplierProductCode || "",
          supplierSku: variant.supplierSku || variant.sku || "",
          supplierCost:
            variant.supplierCost === null || variant.supplierCost === undefined
              ? null
              : Number(variant.supplierCost),
          expectedProfit:
            variant.expectedProfit === null || variant.expectedProfit === undefined
              ? null
              : Number(variant.expectedProfit),
          quantity: Math.max(1, Number(item.quantity) || 1),
          status: "not_submitted",
          lastUpdatedAt: new Date(),
        };
      })
      .filter(Boolean);
  } catch (error) {
    console.error("Supplier snapshot creation error:", error);
  }
});

orderSchema.pre("save", function () {
  if (this.orderNumber) return;
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const uniquePart = `${Date.now().toString().slice(-7)}${Math.floor(100 + Math.random() * 900)}`;
  this.orderNumber = `ORD-${year}${month}${day}-${uniquePart}`;
});

module.exports = mongoose.model("Order", orderSchema);
