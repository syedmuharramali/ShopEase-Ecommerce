const mongoose = require("mongoose");

const Order = require("../models/order.model.js");
const Product = require("../models/product.model.js");
const ProductVariant = require("../models/productVariant.model.js");
const ProductDeliveryRate = require("../models/productDeliveryRate.model.js");
const sendEmail = require("../utils/sendEmail.js");
const {
  reserveCouponUsage,
  releaseCouponUsage,
} = require("../services/coupon.service.js");
const {
  assertJazzCashConfigured,
  buildJazzCashPayment,
} = require("../services/jazzcash.service.js");

const ALLOWED_PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Gilgit-Baltistan",
  "Islamabad Capital Territory",
];

const ALLOWED_PAYMENT_METHODS = ["cod", "jazzcash"];

const ALLOWED_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const STATUS_RANK = {
  pending: 0,
  confirmed: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
};

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatPrice(value) {
  return `PKR ${new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)}`;
}

function getPaymentLabel(method) {
  if (method === "jazzcash") return "JazzCash";
  if (method === "card") return "Card";
  return "Cash on Delivery";
}

function buildInitialPayment(method) {
  if (method === "jazzcash") {
    return { provider: "jazzcash", status: "pending" };
  }
  return { provider: method === "card" ? "card" : "cod", status: "unpaid" };
}

function getFrontendUrl() {
  return (process.env.FRONTEND_URL || "http://localhost:5173").replace(
    /\/+$/,
    ""
  );
}

function getBackendUrl() {
  return (
    process.env.BACKEND_URL ||
    process.env.SERVER_URL ||
    "http://localhost:5000"
  ).replace(/\/+$/, "");
}

function getProductImageUrl(product) {
  const firstImage = Array.isArray(product?.images) ? product.images[0] : null;

  const rawPath =
    typeof firstImage === "string" ? firstImage : firstImage?.url || "";

  if (!rawPath) {
    return "https://placehold.co/160x160/f8fafc/64748b?text=ShopEase";
  }

  const cleanPath = String(rawPath).replace(/\\/g, "/");

  if (/^https?:\/\//i.test(cleanPath)) {
    return cleanPath;
  }

  return `${getBackendUrl()}/${cleanPath.replace(/^\/+/, "")}`;
}

function getRawProductImage(product) {
  const firstImage = Array.isArray(product?.images) ? product.images[0] : null;
  return typeof firstImage === "string" ? firstImage : firstImage?.url || "";
}

function buildVariantSnapshot(variant) {
  return {
    sku: variant.sku,
    title: variant.title || "",
    price: Number(variant.price),
    selectedOptions: Array.isArray(variant.selectedOptions)
      ? variant.selectedOptions.map((option) => ({
          optionId: option.optionId,
          optionName: option.optionName,
          valueId: option.valueId,
          value: option.value,
        }))
      : [],
  };
}

function getSnapshotOptions(order) {
  return Array.isArray(order?.variantSnapshot?.selectedOptions)
    ? order.variantSnapshot.selectedOptions
    : [];
}

function validationError(message) {
  return {
    valid: false,
    message,
  };
}

function validateOrderInput(body = {}) {
  const variantId = cleanString(body.variantId);
  const name = cleanString(body.name);
  const email = cleanString(body.email).toLowerCase();
  const phoneNumber = String(body.phoneNumber || "").replace(/\D/g, "");
  const province = cleanString(body.province);
  const city = cleanString(body.city);
  const address = cleanString(body.address);
  const postalCode = cleanString(body.postalCode);
  const paymentMethod = cleanString(body.paymentMethod).toLowerCase() || "cod";
  const couponCode = cleanString(body.couponCode).toUpperCase();
  const quantity = Number(body.quantity);

  if (!mongoose.Types.ObjectId.isValid(variantId)) {
    return validationError("Valid variantId is required");
  }

  if (!name) {
    return validationError("Name is required");
  }

  if (name.length > 120) {
    return validationError("Name is too long");
  }

  if (!email) {
    return validationError("Email is required");
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return validationError("Please enter a valid email address");
  }

  if (!/^\d{10,15}$/.test(phoneNumber)) {
    return validationError("Please enter a valid phone number");
  }

  if (!ALLOWED_PROVINCES.includes(province)) {
    return validationError("Please select a valid province");
  }

  if (!city) {
    return validationError("City is required");
  }

  if (!address) {
    return validationError("Address is required");
  }

  if (!postalCode) {
    return validationError("Postal code is required");
  }

  if (!ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
    return validationError("Invalid payment method");
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    return validationError("Quantity must be a positive integer");
  }

  return {
    valid: true,
    data: {
      variantId,
      name,
      email,
      phoneNumber,
      province,
      city,
      address,
      postalCode,
      paymentMethod,
      couponCode,
      quantity,
    },
  };
}

// ============================================================
// CREATE ORDER
// ============================================================

exports.createOrder = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const validation = validateOrderInput(req.body);

    if (!validation.valid) {
      return res.status(400).json({
        message: validation.message,
      });
    }

    const {
      variantId,
      name,
      email,
      phoneNumber,
      province,
      city,
      address,
      postalCode,
      paymentMethod,
      couponCode,
      quantity,
    } = validation.data;

    if (paymentMethod === "jazzcash") {
      assertJazzCashConfigured();
    }

    // Only active products can be ordered from the storefront.
    const product = await Product.findOne({
      _id: productId,
      status: "active",
    }).lean();

    if (!product) {
      return res.status(404).json({
        message: "Product not found or is not available for ordering",
      });
    }

    // The variant must belong to this exact product and still be active.
    const variant = await ProductVariant.findOne({
      _id: variantId,
      product: productId,
      isActive: true,
    }).lean();

    if (!variant) {
      return res.status(404).json({
        message: "Selected product variant not found or is inactive",
      });
    }

    const stock = Number(variant.stock);
    const unitPrice = Number(variant.price);

    if (!Number.isFinite(stock) || stock < quantity) {
      return res.status(409).json({
        message: `Only ${Math.max(stock || 0, 0)} item(s) are available`,
      });
    }

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      return res.status(409).json({
        message: "The selected variant does not currently have a valid price",
      });
    }

    const subtotal = Number((unitPrice * quantity).toFixed(2));

    /*
     * Delivery price is ALWAYS resolved on the backend.
     * Never trust a delivery amount sent by the browser.
     */
    const deliveryConfig = await ProductDeliveryRate.findOne({
      product: productId,
    }).lean();

    if (!deliveryConfig) {
      return res.status(409).json({
        message:
          "Delivery charges are not configured for this product. Please contact the store before ordering.",
      });
    }

    const deliveryRate = Array.isArray(deliveryConfig.rates)
      ? deliveryConfig.rates.find((rate) => rate.region === province)
      : null;

    if (!deliveryRate || deliveryRate.isAvailable === false) {
      return res.status(409).json({
        message: `This product is not available for delivery to ${province}`,
      });
    }

    const deliveryCharge = Number(deliveryRate.charge);

    if (!Number.isFinite(deliveryCharge) || deliveryCharge <= 0) {
      return res.status(409).json({
        message: `A valid delivery charge is not configured for ${province}`,
      });
    }

    let couponReservation = null;

    if (couponCode) {
      couponReservation = await reserveCouponUsage(couponCode, subtotal);
    }

    const discount = Number(couponReservation?.discountAmount || 0);
    const total = Number(
      Math.max(0, subtotal - discount + deliveryCharge).toFixed(2)
    );

    /*
     * Reserve stock atomically BEFORE creating the order.
     *
     * Even if two customers try to buy the final unit at the same time,
     * only one request can satisfy stock >= quantity.
     */
    const stockUpdate = await ProductVariant.updateOne(
      {
        _id: variantId,
        product: productId,
        isActive: true,
        stock: {
          $gte: quantity,
        },
      },
      {
        $inc: {
          stock: -quantity,
        },
      }
    );

    if (stockUpdate.modifiedCount !== 1) {
      if (couponReservation?.coupon?._id) {
        await releaseCouponUsage(couponReservation.coupon._id);
      }

      return res.status(409).json({
        message:
          "Sorry, the selected variant is no longer available in the requested quantity",
      });
    }

    let order;

    try {
      order = await Order.create({
        name,
        email,
        phoneNumber,
        province,
        city,
        address,
        postalCode,
        paymentMethod,
        payment: buildInitialPayment(paymentMethod),
        quantity,
        subtotal,
        discount,
        deliveryCharge,
        total,
        ...(couponReservation ? { coupon: couponReservation.snapshot } : {}),

        product: productId,
        variant: variantId,

        variantSnapshot: buildVariantSnapshot(variant),

        items: [
          {
            product: productId,
            variant: variantId,
            productSnapshot: {
              name: product.name,
              image: getRawProductImage(product),
            },
            variantSnapshot: buildVariantSnapshot(variant),
            quantity,
            subtotal,
            deliveryCharge,
            total,
          },
        ],

        status: "pending",
      });
    } catch (orderError) {
      /*
       * If Mongo rejects the order after stock was reserved,
       * immediately restore that stock.
       */
      try {
        await ProductVariant.updateOne(
          {
            _id: variantId,
            product: productId,
          },
          {
            $inc: {
              stock: quantity,
            },
          }
        );
      } catch (restoreError) {
        console.error(
          "Stock rollback failed after order creation error:",
          restoreError
        );
      }

      if (couponReservation?.coupon?._id) {
        try {
          await releaseCouponUsage(couponReservation.coupon._id);
          couponReservation = null;
        } catch (couponRollbackError) {
          console.error("Coupon rollback failed after order creation error:", couponRollbackError);
        }
      }

      throw orderError;
    }

    let payment = null;

    if (paymentMethod === "jazzcash") {
      try {
        payment = buildJazzCashPayment(order);
        order = await Order.findByIdAndUpdate(
          order._id,
          {
            $set: {
              "payment.transactionRef": payment.transactionRef,
              "payment.expiresAt": payment.expiresAt,
            },
          },
          { new: true }
        );

        if (!order) throw new Error("Payment setup could not save the order");
      } catch (paymentSetupError) {
        console.error("JazzCash setup error:", paymentSetupError);
        await ProductVariant.updateOne(
          { _id: variantId, product: productId },
          { $inc: { stock: quantity } }
        );
        if (couponReservation?.coupon?._id) {
          await releaseCouponUsage(couponReservation.coupon._id);
          couponReservation = null;
        }
        await Order.updateOne(
          { _id: order._id },
          {
            $set: {
              status: "cancelled",
              "payment.status": "failed",
              "payment.gatewayResponseMessage": "JazzCash setup failed before redirect",
              couponUsageReleased: Boolean(order.coupon?.couponId),
            },
          }
        );
        return res.status(503).json({
          message: "JazzCash could not be started. No payment was taken and the reserved stock was released.",
        });
      }
    }

    // For online payments, wait for the verified gateway return before treating
    // the order as paid/confirmed. COD can send the normal order notification now.
    if (paymentMethod === "cod") {
      try {
        await sendCustomerOrderEmail(order, product);
      } catch (emailError) {
        console.error("Customer order email error:", emailError);
      }

      try {
        await sendAdminOrderNotification(order, product);
      } catch (emailError) {
        console.error("Admin order email error:", emailError);
      }
    }

    return res.status(201).json({
      success: true,
      message:
        paymentMethod === "jazzcash"
          ? "Order reserved. Continue to JazzCash to complete payment."
          : "Order placed successfully!",
      order,
      payment,
    });
  } catch (error) {
    console.error("Create order error:", error);

    if (error?.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    if (error?.name === "ValidationError") {
      const firstMessage = Object.values(error.errors || {})[0]?.message;

      return res.status(400).json({
        message: firstMessage || "Please check your order details",
      });
    }

    if (error?.code === 11000) {
      return res.status(409).json({
        message:
          "We could not generate a unique order number. Please try placing the order again.",
      });
    }

    return res.status(500).json({
      message: "Failed to place order. Please try again.",
    });
  }
};

// ============================================================
// CREATE CART ORDER
// ============================================================

exports.createCartOrder = async (req, res) => {
  const reserved = [];
  let couponReservation = null;

  const rollbackReservedStock = async () => {
    const linesToRestore = reserved.splice(0).reverse();

    for (const line of linesToRestore) {
      try {
        await ProductVariant.updateOne(
          { _id: line.variantId, product: line.productId },
          { $inc: { stock: line.quantity } }
        );
      } catch (rollbackError) {
        console.error("Cart stock rollback error:", rollbackError);
      }
    }
  };

  try {
    const name = cleanString(req.body?.name);
    const email = cleanString(req.body?.email).toLowerCase();
    const phoneNumber = String(req.body?.phoneNumber || "").replace(/\D/g, "");
    const province = cleanString(req.body?.province);
    const city = cleanString(req.body?.city);
    const address = cleanString(req.body?.address);
    const postalCode = cleanString(req.body?.postalCode);
    const paymentMethod = cleanString(req.body?.paymentMethod).toLowerCase() || "cod";
    const couponCode = cleanString(req.body?.couponCode).toUpperCase();
    const requestedItems = Array.isArray(req.body?.items) ? req.body.items : [];

    if (!name || name.length > 120) return res.status(400).json({ message: "A valid name is required" });
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: "Please enter a valid email address" });
    if (!/^\d{10,15}$/.test(phoneNumber)) return res.status(400).json({ message: "Please enter a valid phone number" });
    if (!ALLOWED_PROVINCES.includes(province)) return res.status(400).json({ message: "Please select a valid province" });
    if (!city) return res.status(400).json({ message: "City is required" });
    if (!address) return res.status(400).json({ message: "Address is required" });
    if (!postalCode) return res.status(400).json({ message: "Postal code is required" });
    if (!ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) return res.status(400).json({ message: "Invalid payment method" });
    if (paymentMethod === "jazzcash") assertJazzCashConfigured();
    if (requestedItems.length < 1 || requestedItems.length > 10) {
      return res.status(400).json({ message: "Cart must contain between 1 and 10 different items" });
    }

    const cleanedItems = [];
    const seenVariants = new Set();

    for (const item of requestedItems) {
      const productId = cleanString(item?.productId);
      const variantId = cleanString(item?.variantId);
      const quantity = Number(item?.quantity);

      if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(variantId)) {
        return res.status(400).json({ message: "Cart contains an invalid product or variant" });
      }
      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ message: "Every cart quantity must be a positive whole number" });
      }
      if (seenVariants.has(variantId)) {
        return res.status(400).json({ message: "The same variant cannot appear twice in the cart" });
      }
      seenVariants.add(variantId);
      cleanedItems.push({ productId, variantId, quantity });
    }

    const productIds = [...new Set(cleanedItems.map((item) => item.productId))];
    const variantIds = cleanedItems.map((item) => item.variantId);

    const [products, variants, deliveryConfigs] = await Promise.all([
      Product.find({ _id: { $in: productIds }, status: "active" }).lean(),
      ProductVariant.find({ _id: { $in: variantIds }, isActive: true }).lean(),
      ProductDeliveryRate.find({ product: { $in: productIds } }).lean(),
    ]);

    const productMap = new Map(products.map((product) => [String(product._id), product]));
    const variantMap = new Map(variants.map((variant) => [String(variant._id), variant]));
    const deliveryMap = new Map(deliveryConfigs.map((config) => [String(config.product), config]));
    const deliveryChargedForProducts = new Set();
    const orderItems = [];

    for (const requested of cleanedItems) {
      const product = productMap.get(requested.productId);
      const variant = variantMap.get(requested.variantId);

      if (!product) return res.status(409).json({ message: "One of the products in your cart is no longer available" });
      if (!variant || String(variant.product) !== requested.productId) {
        return res.status(409).json({ message: `${product.name}: selected variant is no longer available` });
      }

      const stock = Number(variant.stock);
      const price = Number(variant.price);
      if (!Number.isFinite(stock) || stock < requested.quantity) {
        return res.status(409).json({ message: `${product.name}: only ${Math.max(stock || 0, 0)} item(s) are available` });
      }
      if (!Number.isFinite(price) || price < 0) {
        return res.status(409).json({ message: `${product.name}: price is currently unavailable` });
      }

      const config = deliveryMap.get(requested.productId);
      const rate = Array.isArray(config?.rates)
        ? config.rates.find((candidate) => candidate.region === province && candidate.isAvailable !== false)
        : null;
      const configuredCharge = Number(rate?.charge);
      if (!rate || !Number.isFinite(configuredCharge) || configuredCharge <= 0) {
        return res.status(409).json({ message: `${product.name} is not available for delivery to ${province}` });
      }

      const subtotal = Number((price * requested.quantity).toFixed(2));
      // Product-specific delivery is charged once per unique product in this cart,
      // even when two variants of the same product are purchased together.
      const deliveryCharge = deliveryChargedForProducts.has(requested.productId)
        ? 0
        : configuredCharge;
      deliveryChargedForProducts.add(requested.productId);

      orderItems.push({
        productId: requested.productId,
        variantId: requested.variantId,
        quantity: requested.quantity,
        subtotal,
        deliveryCharge,
        total: Number((subtotal + deliveryCharge).toFixed(2)),
        product,
        variant,
      });
    }

    // Reserve every variant atomically. If any line fails, restore every line
    // already reserved so a partial cart can never become an order.
    for (const item of orderItems) {
      const update = await ProductVariant.updateOne(
        {
          _id: item.variantId,
          product: item.productId,
          isActive: true,
          stock: { $gte: item.quantity },
        },
        { $inc: { stock: -item.quantity } }
      );

      if (update.modifiedCount !== 1) {
        await rollbackReservedStock();
        return res.status(409).json({ message: `${item.product.name}: requested stock changed. Review your cart and try again.` });
      }

      reserved.push({ variantId: item.variantId, productId: item.productId, quantity: item.quantity });
    }

    const subtotal = Number(orderItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
    const deliveryCharge = Number(orderItems.reduce((sum, item) => sum + item.deliveryCharge, 0).toFixed(2));

    if (couponCode) {
      couponReservation = await reserveCouponUsage(couponCode, subtotal);
    }

    const discount = Number(couponReservation?.discountAmount || 0);
    const total = Number(
      Math.max(0, subtotal - discount + deliveryCharge).toFixed(2)
    );

    let order;
    try {
      order = await Order.create({
        name,
        email,
        phoneNumber,
        province,
        city,
        address,
        postalCode,
        paymentMethod,
        payment: buildInitialPayment(paymentMethod),
        subtotal,
        discount,
        deliveryCharge,
        total,
        ...(couponReservation ? { coupon: couponReservation.snapshot } : {}),
        items: orderItems.map((item) => ({
          product: item.productId,
          variant: item.variantId,
          productSnapshot: {
            name: item.product.name,
            image: getRawProductImage(item.product),
          },
          variantSnapshot: buildVariantSnapshot(item.variant),
          quantity: item.quantity,
          subtotal: item.subtotal,
          deliveryCharge: item.deliveryCharge,
          total: item.total,
        })),
        status: "pending",
      });
    } catch (orderError) {
      await rollbackReservedStock();
      if (couponReservation?.coupon?._id) {
        try {
          await releaseCouponUsage(couponReservation.coupon._id);
          couponReservation = null;
        } catch (couponRollbackError) {
          console.error("Cart coupon rollback error:", couponRollbackError);
        }
      }
      throw orderError;
    }

    let payment = null;

    if (paymentMethod === "jazzcash") {
      try {
        payment = buildJazzCashPayment(order);
        order = await Order.findByIdAndUpdate(
          order._id,
          {
            $set: {
              "payment.transactionRef": payment.transactionRef,
              "payment.expiresAt": payment.expiresAt,
            },
          },
          { new: true }
        );

        if (!order) throw new Error("Payment setup could not save the order");
      } catch (paymentSetupError) {
        console.error("Cart JazzCash setup error:", paymentSetupError);
        await rollbackReservedStock();
        if (couponReservation?.coupon?._id) {
          await releaseCouponUsage(couponReservation.coupon._id);
          couponReservation = null;
        }
        await Order.updateOne(
          { _id: order._id },
          {
            $set: {
              status: "cancelled",
              "payment.status": "failed",
              "payment.gatewayResponseMessage": "JazzCash setup failed before redirect",
              couponUsageReleased: Boolean(order.coupon?.couponId),
            },
          }
        );
        return res.status(503).json({
          message: "JazzCash could not be started. No payment was taken and the reserved stock was released.",
        });
      }
    }

    if (paymentMethod === "cod") {
      try {
        await sendCartCustomerOrderEmail(order);
      } catch (emailError) {
        console.error("Cart customer email error:", emailError);
      }
      try {
        await sendCartAdminOrderNotification(order);
      } catch (emailError) {
        console.error("Cart admin email error:", emailError);
      }
    }

    return res.status(201).json({
      success: true,
      message:
        paymentMethod === "jazzcash"
          ? "Cart reserved. Continue to JazzCash to complete payment."
          : "Cart order placed successfully!",
      order,
      payment,
    });
  } catch (error) {
    console.error("Create cart order error:", error);
    if (reserved.length) await rollbackReservedStock();
    if (couponReservation?.coupon?._id) {
      try {
        await releaseCouponUsage(couponReservation.coupon._id);
      } catch (couponRollbackError) {
        console.error("Cart coupon rollback error:", couponRollbackError);
      }
    }

    if (error?.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    if (error?.name === "ValidationError") {
      const firstMessage = Object.values(error.errors || {})[0]?.message;
      return res.status(400).json({ message: firstMessage || "Please check your order details" });
    }
    if (error?.code === 11000) {
      return res.status(409).json({ message: "We could not generate a unique order number. Please try again." });
    }
    return res.status(500).json({ message: "Failed to place cart order. Please try again." });
  }
};

// ============================================================
// GET ALL ORDERS
// ============================================================

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("product", "name images")
      .populate("variant", "sku title price images selectedOptions")
      .populate("items.product", "name images")
      .populate("items.variant", "sku title price images selectedOptions")
      .sort({
        createdAt: -1,
      });

    return res.json(orders);
  } catch (error) {
    console.error("Get all orders error:", error);

    return res.status(500).json({
      message: "Failed to load orders",
    });
  }
};

// ============================================================
// GET SINGLE ORDER
// ============================================================

exports.getOrderById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(req.params.id)
      .populate("product", "name images")
      .populate("variant", "sku title price images selectedOptions")
      .populate("items.product", "name images")
      .populate("items.variant", "sku title price images selectedOptions");

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    return res.json(order);
  } catch (error) {
    console.error("Get order error:", error);

    return res.status(500).json({
      message: "Failed to load order",
    });
  }
};

// ============================================================
// PUBLIC ORDER TRACKING
// ============================================================

exports.trackOrder = async (req, res) => {
  try {
    const orderNumber = cleanString(req.body?.orderNumber).toUpperCase();
    const contact = cleanString(req.body?.contact);

    if (
      !orderNumber ||
      orderNumber.length < 8 ||
      orderNumber.length > 60 ||
      !/^ORD-[A-Z0-9-]+$/.test(orderNumber)
    ) {
      return res.status(400).json({
        message: "Enter a valid ShopEase order number.",
      });
    }

    if (!contact || contact.length > 254) {
      return res.status(400).json({
        message: "Enter the email address or phone number used for the order.",
      });
    }

    const contactFilter = contact.includes("@")
      ? { email: contact.toLowerCase() }
      : { phoneNumber: contact.replace(/\D/g, "") };

    if (
      contactFilter.phoneNumber !== undefined &&
      !/^\d{10,15}$/.test(contactFilter.phoneNumber)
    ) {
      return res.status(400).json({
        message: "Enter a valid email address or phone number.",
      });
    }

    if (
      contactFilter.email !== undefined &&
      !/^\S+@\S+\.\S+$/.test(contactFilter.email)
    ) {
      return res.status(400).json({
        message: "Enter a valid email address or phone number.",
      });
    }

    /*
     * Requiring both order number AND the customer's contact detail prevents
     * someone from enumerating order numbers and reading another customer's
     * order information.
     */
    const order = await Order.findOne({
      orderNumber,
      ...contactFilter,
    })
      .populate("product", "name images")
      .populate("variant", "sku title")
      .lean();

    /*
     * Keep this response intentionally generic. Do not reveal whether the
     * order number exists when the supplied contact detail does not match.
     */
    if (!order) {
      return res.status(404).json({
        message:
          "Order not found. Check the order number and the email or phone used at checkout.",
      });
    }

    const sourceItems =
      Array.isArray(order.items) && order.items.length > 0
        ? order.items
        : [
            {
              product: order.product,
              variant: order.variant,
              productSnapshot: {
                name: order.product?.name || "ShopEase product",
                image:
                  Array.isArray(order.product?.images) &&
                  order.product.images.length > 0
                    ? typeof order.product.images[0] === "string"
                      ? order.product.images[0]
                      : order.product.images[0]?.url || ""
                    : "",
              },
              variantSnapshot: order.variantSnapshot,
              quantity: order.quantity || 1,
              subtotal: order.subtotal || 0,
              deliveryCharge: order.deliveryCharge || 0,
              total: order.total || order.subtotal || 0,
            },
          ];

    const items = sourceItems.map((item) => ({
      productName:
        item.productSnapshot?.name ||
        item.product?.name ||
        "ShopEase product",
      image:
        item.productSnapshot?.image ||
        (Array.isArray(item.product?.images)
          ? typeof item.product.images[0] === "string"
            ? item.product.images[0]
            : item.product.images[0]?.url || ""
          : ""),
      sku:
        item.variantSnapshot?.sku ||
        item.variant?.sku ||
        "",
      variantTitle:
        item.variantSnapshot?.title ||
        item.variant?.title ||
        "",
      selectedOptions: Array.isArray(item.variantSnapshot?.selectedOptions)
        ? item.variantSnapshot.selectedOptions.map((option) => ({
            optionName: option.optionName,
            value: option.value,
          }))
        : [],
      quantity: Number(item.quantity || 1),
      subtotal: Number(item.subtotal || 0),
      deliveryCharge: Number(item.deliveryCharge || 0),
      total: Number(item.total || item.subtotal || 0),
    }));

    return res.status(200).json({
      order: {
        orderNumber: order.orderNumber,
        customerName: order.name,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        subtotal: Number(order.subtotal || 0),
        discount: Number(order.discount || 0),
        deliveryCharge: Number(order.deliveryCharge || 0),
        total: Number(order.total || order.subtotal || 0),
        couponCode: order.coupon?.code || "",
        paymentStatus: order.payment?.status || (order.paymentMethod === "cod" ? "unpaid" : "pending"),
        province: order.province,
        city: order.city,
        paymentMethod: order.paymentMethod,
        items,
      },
    });
  } catch (error) {
    console.error("Track order error:", error);

    return res.status(500).json({
      message: "We couldn't track this order right now. Please try again.",
    });
  }
};

// ============================================================
// UPDATE ORDER STATUS
// ============================================================

exports.updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const status = cleanString(req.body?.status).toLowerCase();

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Invalid order status",
      });
    }

    const existingOrder = await Order.findById(orderId);

    if (!existingOrder) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    const previousStatus = existingOrder.status;

    if (
      existingOrder.paymentMethod === "jazzcash" &&
      existingOrder.payment?.status !== "paid" &&
      status !== "cancelled"
    ) {
      return res.status(400).json({
        message: "JazzCash payment must be completed before this order can move forward",
      });
    }

    if (status === previousStatus) {
      return res.json({
        success: true,
        message: "Order is already in this status",
        order: existingOrder,
      });
    }

    if (previousStatus === "cancelled") {
      return res.status(400).json({
        message: "A cancelled order cannot be moved to another status",
      });
    }

    if (previousStatus === "delivered") {
      return res.status(400).json({
        message: "A delivered order cannot be changed",
      });
    }

    /*
     * Prevent normal status movement backwards.
     * Cancellation is handled separately and can happen before delivery.
     */
    if (
      status !== "cancelled" &&
      STATUS_RANK[status] < STATUS_RANK[previousStatus]
    ) {
      return res.status(400).json({
        message: `Order cannot move from ${previousStatus} back to ${status}`,
      });
    }

    /*
     * Use the previous status in the update filter.
     * This prevents two simultaneous admin requests from both changing
     * the same order and, importantly, from restoring stock twice.
     */
    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: orderId,
        status: previousStatus,
      },
      {
        $set: {
          status,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedOrder) {
      return res.status(409).json({
        message:
          "This order changed while you were updating it. Refresh and try again.",
      });
    }

    if (status === "cancelled") {
      const inventoryLines =
        Array.isArray(updatedOrder.items) && updatedOrder.items.length > 0
          ? updatedOrder.items.map((item) => ({
              variant: item.variant,
              quantity: item.quantity,
            }))
          : [{ variant: updatedOrder.variant, quantity: updatedOrder.quantity }];

      const existingVariants = await ProductVariant.countDocuments({
        _id: { $in: inventoryLines.map((line) => line.variant) },
      });

      if (existingVariants !== inventoryLines.length) {
        await Order.updateOne(
          { _id: orderId, status: "cancelled" },
          { $set: { status: previousStatus } }
        );
        return res.status(409).json({
          message: "Order could not be cancelled because one or more variant records are missing",
        });
      }

      try {
        await ProductVariant.bulkWrite(
          inventoryLines.map((line) => ({
            updateOne: {
              filter: { _id: line.variant },
              update: { $inc: { stock: line.quantity } },
            },
          }))
        );
      } catch (restoreError) {
        await Order.updateOne(
          { _id: orderId, status: "cancelled" },
          { $set: { status: previousStatus } }
        );
        console.error("Order cancellation stock restore error:", restoreError);
        return res.status(409).json({
          message: "Order could not be cancelled because inventory could not be restored",
        });
      }

      if (updatedOrder.coupon?.couponId && !updatedOrder.couponUsageReleased) {
        try {
          await releaseCouponUsage(updatedOrder.coupon.couponId);
          updatedOrder.couponUsageReleased = true;
          await updatedOrder.save();
        } catch (couponReleaseError) {
          console.error("Order cancellation coupon release error:", couponReleaseError);
        }
      }
    }

    try {
      await sendOrderStatusEmail(updatedOrder);
    } catch (emailError) {
      console.error("Order status email error:", emailError);
    }

    return res.json({
      success: true,
      message:
        status === "cancelled"
          ? "Order cancelled and stock restored"
          : "Order status updated",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Update order status error:", error);

    return res.status(500).json({
      message: "Failed to update order status",
    });
  }
};

// ============================================================
// CUSTOMER ORDER EMAIL
// ============================================================

const sendCustomerOrderEmail = async (order, product) => {
  const snapshot = order.variantSnapshot || {};
  const productImage = escapeHtml(getProductImageUrl(product));

  const selectedOptions = getSnapshotOptions(order)
    .map(
      (option) =>
        `<p style="margin: 5px 0;"><strong>${escapeHtml(
          option.optionName
        )}:</strong> ${escapeHtml(option.value)}</p>`
    )
    .join("");

  const safeName = escapeHtml(order.name);
  const safeProductName = escapeHtml(product.name);
  const safeSku = escapeHtml(snapshot.sku || "");
  const safeTitle = escapeHtml(snapshot.title || "");
  const safeAddress = escapeHtml(order.address);
  const safeCity = escapeHtml(order.city);
  const safeProvince = escapeHtml(order.province);
  const safePostalCode = escapeHtml(order.postalCode);
  const safePhone = escapeHtml(order.phoneNumber);
  const safeOrderNumber = escapeHtml(order.orderNumber);
  const safeStatus = escapeHtml(order.status);

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #f8fafc; color: #0f172a;">
      <div style="background: #0f172a; padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">ShopEase</h1>
        <p style="color: #cbd5e1; margin: 8px 0 0;">Order confirmation</p>
      </div>

      <div style="padding: 30px;">
        <h2 style="margin-top: 0;">Thank you for your order, ${safeName}!</h2>

        <p style="color: #64748b; line-height: 1.6;">
          Your order has been placed successfully.
        </p>

        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Order details</h3>

          <p>
            <strong>Order number:</strong>
            ${safeOrderNumber}
          </p>

          <p>
            <strong>Order date:</strong>
            ${escapeHtml(new Date(order.createdAt).toLocaleString("en-PK"))}
          </p>

          <p>
            <strong>Status:</strong>
            ${safeStatus}
          </p>
        </div>

        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Product details</h3>

          <div style="display: flex; gap: 15px; align-items: flex-start;">
            <img
              src="${productImage}"
              alt="${safeProductName}"
              style="width: 90px; height: 90px; object-fit: cover; border-radius: 10px;"
            >

            <div>
              <p style="margin-top: 0;">
                <strong>${safeProductName}</strong>
              </p>

              ${
                safeSku
                  ? `<p><strong>SKU:</strong> ${safeSku}</p>`
                  : ""
              }

              ${
                safeTitle
                  ? `<p><strong>Variant:</strong> ${safeTitle}</p>`
                  : ""
              }

              ${selectedOptions}

              <p>
                <strong>Quantity:</strong>
                ${order.quantity}
              </p>

              <p>
                <strong>Unit price:</strong>
                ${formatPrice(snapshot.price)}
              </p>
            </div>
          </div>

          <div style="margin-top: 18px; border-top: 1px solid #e2e8f0; padding-top: 14px;">
            <p style="margin: 6px 0;">
              <strong>Subtotal:</strong>
              ${formatPrice(order.subtotal)}
            </p>

            <p style="margin: 6px 0;">
              <strong>Delivery to ${safeProvince}:</strong>
              ${formatPrice(order.deliveryCharge)}
            </p>

            <p style="margin: 10px 0 0; font-size: 19px;">
              <strong>Total:</strong>
              ${formatPrice(order.total)}
            </p>
          </div>
        </div>

        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Shipping address</h3>

          <p>${safeName}</p>
          <p>${safeAddress}</p>
          <p>${safeCity}, ${safeProvince}</p>
          <p>Postal code: ${safePostalCode}</p>
          <p>Phone: ${safePhone}</p>
        </div>

        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Payment method</h3>
          <p>
            ${getPaymentLabel(order.paymentMethod)}
          </p>
        </div>

        <a
          href="${getFrontendUrl()}/products"
          style="display: inline-block; background: #0f172a; color: white; padding: 12px 20px; text-decoration: none; border-radius: 10px;"
        >
          Continue shopping
        </a>

        <p style="color: #64748b; font-size: 13px; margin-top: 28px;">
          We will notify you when your order status changes.
        </p>
      </div>
    </div>
  `;

  await sendEmail({
    email: order.email,
    subject: `Order Confirmation - ${order.orderNumber}`,
    html: emailHtml,
  });
};

// ============================================================
// ADMIN ORDER EMAIL
// ============================================================

const sendAdminOrderNotification = async (order, product) => {
  const snapshot = order.variantSnapshot || {};

  const selectedOptions = getSnapshotOptions(order).length
    ? getSnapshotOptions(order)
        .map(
          (option) =>
            `${escapeHtml(option.optionName)}: ${escapeHtml(option.value)}`
        )
        .join(" | ")
    : "Default variant";

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #0f172a;">
      <h2>New Order Received</h2>

      <p>
        <strong>Order number:</strong>
        ${escapeHtml(order.orderNumber)}
      </p>

      <p>
        <strong>Customer:</strong>
        ${escapeHtml(order.name)}
      </p>

      <p>
        <strong>Email:</strong>
        ${escapeHtml(order.email)}
      </p>

      <p>
        <strong>Phone:</strong>
        ${escapeHtml(order.phoneNumber)}
      </p>

      <p>
        <strong>Product:</strong>
        ${escapeHtml(product.name)}
      </p>

      <p>
        <strong>SKU:</strong>
        ${escapeHtml(snapshot.sku || "")}
      </p>

      <p>
        <strong>Variant:</strong>
        ${selectedOptions}
      </p>

      <p>
        <strong>Quantity:</strong>
        ${order.quantity}
      </p>

      <p>
        <strong>Unit price:</strong>
        ${formatPrice(snapshot.price)}
      </p>

      <p>
        <strong>Subtotal:</strong>
        ${formatPrice(order.subtotal)}
      </p>

      <p>
        <strong>Delivery (${escapeHtml(order.province)}):</strong>
        ${formatPrice(order.deliveryCharge)}
      </p>

      <p>
        <strong>Total:</strong>
        ${formatPrice(order.total)}
      </p>

      <p>
        <strong>Payment method:</strong>
        ${getPaymentLabel(order.paymentMethod)}
      </p>

      <p>
        <strong>Shipping address:</strong>
        ${escapeHtml(order.address)},
        ${escapeHtml(order.city)},
        ${escapeHtml(order.province)}
      </p>

      <a
        href="${getFrontendUrl()}/admin/dashboard"
        style="display: inline-block; background: #0f172a; color: white; padding: 10px 18px; text-decoration: none; border-radius: 8px;"
      >
        Open admin dashboard
      </a>
    </div>
  `;

  await sendEmail({
    email: process.env.ADMIN_EMAIL || "admin@shopease.com",
    subject: `New Order - ${order.orderNumber}`,
    html: emailHtml,
  });
};

// ============================================================
// CART ORDER EMAILS
// ============================================================

function cartItemsHtml(order) {
  return (order.items || [])
    .map((item) => {
      const productName = escapeHtml(item.productSnapshot?.name || "Product");
      const sku = escapeHtml(item.variantSnapshot?.sku || "");
      const title = escapeHtml(item.variantSnapshot?.title || "");
      const options = (item.variantSnapshot?.selectedOptions || [])
        .map((option) => `${escapeHtml(option.optionName)}: ${escapeHtml(option.value)}`)
        .join(" | ");
      return `<div style="padding:14px 0;border-bottom:1px solid #e2e8f0;">
        <p style="margin:0 0 6px;"><strong>${productName}</strong></p>
        ${sku ? `<p style="margin:4px 0;">SKU: ${sku}</p>` : ""}
        ${title ? `<p style="margin:4px 0;">Variant: ${title}</p>` : ""}
        ${options ? `<p style="margin:4px 0;">${options}</p>` : ""}
        <p style="margin:4px 0;">Quantity: ${item.quantity}</p>
        <p style="margin:4px 0;">Subtotal: ${formatPrice(item.subtotal)}</p>
        <p style="margin:4px 0;">Delivery: ${formatPrice(item.deliveryCharge)}</p>
      </div>`;
    })
    .join("");
}

const sendCartCustomerOrderEmail = async (order) => {
  const html = `<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#0f172a;background:#f8fafc;">
    <div style="background:#0f172a;padding:30px;text-align:center;color:white;"><h1 style="margin:0;">ShopEase</h1><p style="color:#cbd5e1;">Cart order confirmation</p></div>
    <div style="padding:30px;">
      <h2>Thank you, ${escapeHtml(order.name)}!</h2>
      <p>Your order <strong>${escapeHtml(order.orderNumber)}</strong> has been placed successfully.</p>
      <div style="background:white;border:1px solid #e2e8f0;border-radius:14px;padding:20px;margin:20px 0;">${cartItemsHtml(order)}</div>
      <div style="background:white;border:1px solid #e2e8f0;border-radius:14px;padding:20px;">
        <p>Product subtotal: <strong>${formatPrice(order.subtotal)}</strong></p>
        ${order.discount > 0 ? `<p>Discount${order.coupon?.code ? ` (${escapeHtml(order.coupon.code)})` : ""}: <strong>-${formatPrice(order.discount)}</strong></p>` : ""}
        <p>Delivery to ${escapeHtml(order.province)}: <strong>${formatPrice(order.deliveryCharge)}</strong></p>
        <p style="font-size:19px;">Total: <strong>${formatPrice(order.total)}</strong></p>
      </div>
      <p style="color:#64748b;">Delivery address: ${escapeHtml(order.address)}, ${escapeHtml(order.city)}, ${escapeHtml(order.province)}</p>
    </div></div>`;
  await sendEmail({ email: order.email, subject: `Order Confirmation - ${order.orderNumber}`, html });
};

const sendCartAdminOrderNotification = async (order) => {
  const html = `<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#0f172a;">
    <h2>New Cart Order Received</h2>
    <p><strong>Order:</strong> ${escapeHtml(order.orderNumber)}</p>
    <p><strong>Customer:</strong> ${escapeHtml(order.name)} — ${escapeHtml(order.phoneNumber)}</p>
    <div style="border:1px solid #e2e8f0;border-radius:14px;padding:20px;">${cartItemsHtml(order)}</div>
    <p><strong>Subtotal:</strong> ${formatPrice(order.subtotal)}</p>
    ${order.discount > 0 ? `<p><strong>Discount${order.coupon?.code ? ` (${escapeHtml(order.coupon.code)})` : ""}:</strong> -${formatPrice(order.discount)}</p>` : ""}
    <p><strong>Delivery:</strong> ${formatPrice(order.deliveryCharge)}</p>
    <p><strong>Total:</strong> ${formatPrice(order.total)}</p>
    <p><strong>Ship to:</strong> ${escapeHtml(order.address)}, ${escapeHtml(order.city)}, ${escapeHtml(order.province)}</p>
  </div>`;
  await sendEmail({
    email: process.env.ADMIN_EMAIL || "admin@shopease.com",
    subject: `New Order - ${order.orderNumber}`,
    html,
  });
};

// ============================================================
// ORDER STATUS EMAIL
// ============================================================

const sendOrderStatusEmail = async (order) => {
  const statusMessages = {
    pending: "Your order is awaiting confirmation.",
    confirmed: "Your order has been confirmed!",
    processing: "Your order is being processed.",
    shipped: "Your order has been shipped!",
    delivered: "Your order has been delivered. Enjoy your purchase!",
    cancelled: "Your order has been cancelled.",
  };

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #0f172a;">
      <div style="background: #0f172a; padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">ShopEase</h1>
      </div>

      <div style="padding: 30px;">
        <h2>Order Status Update</h2>

        <p>
          Dear ${escapeHtml(order.name)},
        </p>

        <p>
          ${
            statusMessages[order.status] ||
            `Your order status has been updated to: ${escapeHtml(order.status)}`
          }
        </p>

        <p>
          <strong>Order number:</strong>
          ${escapeHtml(order.orderNumber)}
        </p>

        <p>
          <strong>Status:</strong>
          ${escapeHtml(order.status)}
        </p>

        <a
          href="${getFrontendUrl()}/products"
          style="display: inline-block; background: #0f172a; color: white; padding: 10px 18px; text-decoration: none; border-radius: 8px;"
        >
          Visit ShopEase
        </a>
      </div>
    </div>
  `;

  await sendEmail({
    email: order.email,
    subject: `Order Status Update - ${order.orderNumber}`,
    html: emailHtml,
  });
};