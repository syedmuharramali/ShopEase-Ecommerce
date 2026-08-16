const mongoose = require("mongoose");

const Product = require("../models/product.model.js");
const ProductVariant = require("../models/productVariant.model.js");
const Order = require("../models/order.model.js");

const FULFILLMENT_STATUSES = [
  "not_submitted",
  "submitted",
  "shipped",
  "delivered",
  "cancelled",
];

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function nullableMoney(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : NaN;
}

async function loadPrivateProducts(filter = {}) {
  return Product.find(filter)
    .select("+supplier +supplierProductCode +fulfillmentType +supplierLastCheckedAt")
    .populate("category", "name slug")
    .sort({ createdAt: -1 })
    .lean();
}

async function loadPrivateVariants(productIds = []) {
  if (!productIds.length) return [];

  return ProductVariant.find({ product: { $in: productIds } })
    .select("+supplierSku +supplierCost +expectedProfit +inventoryType +supplierLastCheckedAt")
    .sort({ product: 1, isDefault: -1, createdAt: 1 })
    .lean();
}

function groupVariantsByProduct(variants) {
  const grouped = new Map();

  variants.forEach((variant) => {
    const key = String(variant.product);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(variant);
  });

  return grouped;
}

exports.getMarkazProducts = async (req, res) => {
  try {
    const products = await loadPrivateProducts();
    const variants = await loadPrivateVariants(products.map((product) => product._id));
    const variantMap = groupVariantsByProduct(variants);

    return res.json({
      products: products.map((product) => ({
        ...product,
        variants: variantMap.get(String(product._id)) || [],
      })),
    });
  } catch (error) {
    console.error("Get Markaz products error:", error);
    return res.status(500).json({ message: "Could not load Markaz product settings." });
  }
};

exports.updateMarkazProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID." });
    }

    const supplier = cleanString(req.body?.supplier).toLowerCase() || "internal";
    const supplierProductCode = cleanString(req.body?.supplierProductCode);
    const incomingVariants = Array.isArray(req.body?.variants) ? req.body.variants : [];

    if (!["internal", "markaz"].includes(supplier)) {
      return res.status(400).json({ message: "Supplier must be internal or markaz." });
    }

    if (supplier === "markaz" && !supplierProductCode) {
      return res.status(400).json({ message: "Markaz product code is required." });
    }

    const product = await Product.findById(productId)
      .select("+supplier +supplierProductCode +fulfillmentType +supplierLastCheckedAt");

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    product.supplier = supplier;
    product.supplierProductCode = supplier === "markaz" ? supplierProductCode : "";
    product.fulfillmentType = supplier === "markaz" ? "dropship" : "internal";
    product.supplierLastCheckedAt = supplier === "markaz" ? new Date() : null;
    await product.save();

    for (const incoming of incomingVariants) {
      const variantId = cleanString(incoming?._id);
      if (!mongoose.Types.ObjectId.isValid(variantId)) continue;

      const variant = await ProductVariant.findOne({
        _id: variantId,
        product: productId,
      }).select("+supplierSku +supplierCost +expectedProfit +inventoryType +supplierLastCheckedAt");

      if (!variant) continue;

      if (supplier === "markaz") {
        const supplierSku = cleanString(incoming.supplierSku).toUpperCase();
        const supplierCost = nullableMoney(incoming.supplierCost);
        const expectedProfit = nullableMoney(incoming.expectedProfit);

        if (!supplierSku) {
          return res.status(400).json({
            message: `Markaz SKU is required for variant ${variant.title || variant.sku}.`,
          });
        }

        if (Number.isNaN(supplierCost) || Number.isNaN(expectedProfit)) {
          return res.status(400).json({
            message: `Supplier cost and expected profit must be valid positive amounts for ${variant.title || variant.sku}.`,
          });
        }

        variant.supplierSku = supplierSku;
        variant.supplierCost = supplierCost;
        variant.expectedProfit = expectedProfit;
        variant.inventoryType = "external";
        variant.supplierLastCheckedAt = new Date();
      } else {
        variant.supplierSku = "";
        variant.supplierCost = null;
        variant.expectedProfit = null;
        variant.inventoryType = "internal";
        variant.supplierLastCheckedAt = null;
      }

      await variant.save();
    }

    const refreshedProducts = await loadPrivateProducts({ _id: productId });
    const refreshedVariants = await loadPrivateVariants([productId]);

    return res.json({
      success: true,
      product: {
        ...refreshedProducts[0],
        variants: refreshedVariants,
      },
    });
  } catch (error) {
    console.error("Update Markaz product error:", error);
    return res.status(500).json({ message: "Could not save Markaz product settings." });
  }
};

async function ensureSupplierFulfillments(order) {
  if (!order || !Array.isArray(order.items) || order.items.length === 0) return order;

  const existingKeys = new Set(
    (order.supplierFulfillments || []).map(
      (entry) => `${entry.product}:${entry.variant}`
    )
  );

  const productIds = [...new Set(order.items.map((item) => String(item.product)))];
  const variantIds = [...new Set(order.items.map((item) => String(item.variant)))];

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

  let changed = false;

  for (const item of order.items) {
    const product = productMap.get(String(item.product));
    const variant = variantMap.get(String(item.variant));
    const key = `${item.product}:${item.variant}`;

    if (!product || !variant || product.supplier !== "markaz" || existingKeys.has(key)) {
      continue;
    }

    order.supplierFulfillments.push({
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
    });

    existingKeys.add(key);
    changed = true;
  }

  if (changed) await order.save();
  return order;
}

exports.getMarkazOrders = async (req, res) => {
  try {
    const orders = await Order.find({ status: { $ne: "cancelled" } })
      .select("+supplierFulfillments")
      .sort({ createdAt: -1 })
      .limit(200);

    const markazOrders = [];

    for (const order of orders) {
      await ensureSupplierFulfillments(order);
      if (Array.isArray(order.supplierFulfillments) && order.supplierFulfillments.length > 0) {
        markazOrders.push(order);
      }
    }

    return res.json({ orders: markazOrders });
  } catch (error) {
    console.error("Get Markaz orders error:", error);
    return res.status(500).json({ message: "Could not load Markaz fulfillment orders." });
  }
};

exports.updateMarkazFulfillment = async (req, res) => {
  try {
    const { orderId, fulfillmentId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(orderId) ||
      !mongoose.Types.ObjectId.isValid(fulfillmentId)
    ) {
      return res.status(400).json({ message: "Invalid fulfillment reference." });
    }

    const order = await Order.findById(orderId).select("+supplierFulfillments");

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    await ensureSupplierFulfillments(order);

    const fulfillment = order.supplierFulfillments.id(fulfillmentId);

    if (!fulfillment) {
      return res.status(404).json({ message: "Markaz fulfillment record not found." });
    }

    const status = cleanString(req.body?.status).toLowerCase() || fulfillment.status;
    const externalOrderId = cleanString(req.body?.externalOrderId);
    const trackingId = cleanString(req.body?.trackingId);

    if (!FULFILLMENT_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid Markaz fulfillment status." });
    }

    if (["submitted", "shipped", "delivered"].includes(status) && !externalOrderId) {
      return res.status(400).json({ message: "Enter the Markaz order ID before marking this fulfillment submitted." });
    }

    fulfillment.status = status;
    fulfillment.externalOrderId = externalOrderId;
    fulfillment.trackingId = trackingId;
    fulfillment.lastUpdatedAt = new Date();

    if (status !== "not_submitted" && !fulfillment.submittedAt) {
      fulfillment.submittedAt = new Date();
    }

    await order.save();

    return res.json({
      success: true,
      fulfillment,
    });
  } catch (error) {
    console.error("Update Markaz fulfillment error:", error);
    return res.status(500).json({ message: "Could not update Markaz fulfillment." });
  }
};
