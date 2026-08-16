const mongoose = require("mongoose");

/*
 * Keep this list aligned with the current storefront checkout and admin
 * product form. AJK will be enabled in a separate end-to-end delivery pass
 * once checkout, order validation and the admin UI all support it together.
 */
const DELIVERY_REGIONS = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Gilgit-Baltistan",
  "Islamabad Capital Territory",
  "Azad Jammu & Kashmir",
];

const deliveryRateSchema = new mongoose.Schema(
  {
    region: {
      type: String,
      required: true,
      enum: DELIVERY_REGIONS,
    },

    charge: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: false,
  }
);

const productDeliveryRateSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      unique: true,
      index: true,
    },

    rates: {
      type: [deliveryRateSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "ProductDeliveryRate",
  productDeliveryRateSchema
);

module.exports.DELIVERY_REGIONS = DELIVERY_REGIONS;
