const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
      index: true,
    },

    // Snapshot of the variant at the time of purchase.
    // This protects historical orders if the product/variant
    // is changed later.
    variantSnapshot: {
      sku: {
        type: String,
        required: true,
        trim: true,
      },

      title: {
        type: String,
        default: "",
        trim: true,
      },

      price: {
        type: Number,
        required: true,
        min: 0,
      },

      selectedOptions: {
        type: [
          {
            optionId: mongoose.Schema.Types.ObjectId,
            optionName: String,
            valueId: mongoose.Schema.Types.ObjectId,
            value: String,
          },
        ],
        default: [],
      },
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [
        /^\S+@\S+\.\S+$/,
        "Please enter a valid email",
      ],
    },

    phoneNumber: {
      type: String,
      required: true,
      match: [
        /^\d{10,15}$/,
        "Please enter a valid phone number",
      ],
    },

    province: {
      type: String,
      required: true,
      enum: [
        "Punjab",
        "KPK",
        "Sindh",
        "Balochistan",
        "AJK",
        "Gilgit Baltistan",
      ],
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    postalCode: {
      type: String,
      required: true,
      trim: true,
    },

    paymentMethod: {
      type: String,
      enum: ["cod", "card"],
      default: "cod",
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },

    orderNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generate order number before saving.
orderSchema.pre("save", function (next) {
  if (!this.orderNumber) {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    const random = Math.floor(
      Math.random() * 10000
    )
      .toString()
      .padStart(4, "0");

    this.orderNumber =
      `ORD-${year}${month}${day}-${random}`;
  }

  
});

const Order = mongoose.model(
  "Order",
  orderSchema
);

module.exports = Order;
