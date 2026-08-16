const mongoose = require("mongoose");
const Order = require("../models/order.model.js");

const FULFILLMENT_STATUSES = [
  "not_submitted",
  "submitted",
  "shipped",
  "delivered",
  "cancelled",
];

const ORDER_STATUS_RANK = {
  pending: 0,
  confirmed: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
};

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function itemKey(product, variant) {
  return `${String(product)}:${String(variant)}`;
}

function getOrderItemKeys(order) {
  const sourceItems =
    Array.isArray(order.items) && order.items.length > 0
      ? order.items
      : order.product && order.variant
        ? [{ product: order.product, variant: order.variant }]
        : [];

  return new Set(
    sourceItems.map((item) => itemKey(item.product, item.variant))
  );
}

function getRelevantMarkazFulfillments(order, orderItemKeys) {
  return (order.supplierFulfillments || []).filter(
    (entry) =>
      entry.provider === "markaz" &&
      orderItemKeys.has(itemKey(entry.product, entry.variant))
  );
}

function isMarkazOnlyOrder(order) {
  const orderItemKeys = getOrderItemKeys(order);
  if (orderItemKeys.size === 0) return false;

  const markazFulfillments = getRelevantMarkazFulfillments(
    order,
    orderItemKeys
  );

  const markazKeys = new Set(
    markazFulfillments.map((entry) =>
      itemKey(entry.product, entry.variant)
    )
  );

  return [...orderItemKeys].every((key) => markazKeys.has(key));
}

function deriveMarkazOnlyOrderStatus(order) {
  if (!isMarkazOnlyOrder(order)) return null;

  const orderItemKeys = getOrderItemKeys(order);
  const fulfillments = getRelevantMarkazFulfillments(order, orderItemKeys);

  if (fulfillments.length === 0) return null;

  if (fulfillments.every((entry) => entry.status === "cancelled")) {
    return "cancelled";
  }

  const active = fulfillments.filter(
    (entry) => entry.status !== "cancelled"
  );

  if (active.length === 0) return "cancelled";

  if (active.every((entry) => entry.status === "delivered")) {
    return "delivered";
  }

  if (
    active.every((entry) =>
      ["shipped", "delivered"].includes(entry.status)
    )
  ) {
    return "shipped";
  }

  if (
    active.some((entry) =>
      ["submitted", "shipped", "delivered"].includes(entry.status)
    )
  ) {
    return "processing";
  }

  // A Markaz-only order that has not been submitted yet should keep whatever
  // normal ShopEase status it already has (usually pending/confirmed).
  return null;
}

function applyForwardOrderStatus(order, desiredStatus) {
  if (!desiredStatus) return;

  if (desiredStatus === "cancelled") {
    order.status = "cancelled";
    return;
  }

  const currentRank = ORDER_STATUS_RANK[order.status] ?? 0;
  const desiredRank = ORDER_STATUS_RANK[desiredStatus] ?? 0;

  if (desiredRank > currentRank) {
    order.status = desiredStatus;
  }
}

exports.updateMarkazFulfillmentWithStatusSync = async (req, res) => {
  try {
    const { orderId, fulfillmentId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(orderId) ||
      !mongoose.Types.ObjectId.isValid(fulfillmentId)
    ) {
      return res.status(400).json({ message: "Invalid fulfillment reference." });
    }

    const order = await Order.findById(orderId).select(
      "+supplierFulfillments"
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    const fulfillment = order.supplierFulfillments.id(fulfillmentId);

    if (!fulfillment) {
      return res.status(404).json({
        message: "Markaz fulfillment record not found.",
      });
    }

    const status =
      cleanString(req.body?.status).toLowerCase() || fulfillment.status;
    const externalOrderId = cleanString(req.body?.externalOrderId);
    const trackingId = cleanString(req.body?.trackingId);

    if (!FULFILLMENT_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Invalid Markaz fulfillment status.",
      });
    }

    if (
      ["submitted", "shipped", "delivered"].includes(status) &&
      !externalOrderId
    ) {
      return res.status(400).json({
        message:
          "Enter the Markaz order ID before marking this fulfillment submitted.",
      });
    }

    fulfillment.status = status;
    fulfillment.externalOrderId = externalOrderId;
    fulfillment.trackingId = trackingId;
    fulfillment.lastUpdatedAt = new Date();

    if (status !== "not_submitted" && !fulfillment.submittedAt) {
      fulfillment.submittedAt = new Date();
    }

    const markazOnlyOrder = isMarkazOnlyOrder(order);

    if (markazOnlyOrder) {
      const desiredOrderStatus = deriveMarkazOnlyOrderStatus(order);
      applyForwardOrderStatus(order, desiredOrderStatus);
    }

    await order.save();

    return res.json({
      success: true,
      fulfillment,
      orderStatus: order.status,
      autoSyncedOrderStatus: markazOnlyOrder,
    });
  } catch (error) {
    console.error("Update Markaz fulfillment/status sync error:", error);
    return res.status(500).json({
      message: "Could not update Markaz fulfillment.",
    });
  }
};
