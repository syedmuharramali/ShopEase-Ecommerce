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

    // Legacy/single-item fields. Kept for backward compatibility and Buy Now.
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", index: true },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: "ProductVariant", index: true },
    variantSnapshot: { type: variantSnapshotSchema },
    quantity: { type: Number, min: 1, default: 1 },

    // New cart-safe structure. New single-item orders also write one item here.
    items: { type: [orderItemSchema], default: [] },

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