const mongoose = require("mongoose");
const Order = require("../models/order.model.js");
const sendEmail = require("../utils/sendEmail.js");

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

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function nullableDay(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 90 ? parsed : NaN;
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

function deliveryWindowText(fulfillment) {
  const min = fulfillment.estimatedDeliveryMinDays;
  const max = fulfillment.estimatedDeliveryMaxDays;

  if (min && max) {
    return min === max ? `${min} day${min === 1 ? "" : "s"}` : `${min}-${max} days`;
  }

  if (min) return `${min}+ days`;
  if (max) return `up to ${max} days`;
  return "Not provided yet";
}

async function sendDeliveryUpdateEmail(order, fulfillment) {
  if (!order?.email) return;

  const frontendUrl = (
    process.env.FRONTEND_URL || "http://localhost:5173"
  ).replace(/\/+$/, "");

  const statusLabel =
    fulfillment.status === "delivered"
      ? "Delivered"
      : fulfillment.status === "shipped"
        ? "Your order is on the way"
        : "Delivery update";

  const courier = escapeHtml(fulfillment.courierName || "Not assigned yet");
  const trackingId = escapeHtml(fulfillment.trackingId || "Not available yet");
  const riderName = escapeHtml(fulfillment.riderName || "Not assigned yet");
  const riderPhone = escapeHtml(fulfillment.riderPhone || "Not available yet");
  const deliveryWindow = escapeHtml(deliveryWindowText(fulfillment));

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#0f172a;">
      <div style="background:#0f172a;padding:28px;text-align:center;border-radius:18px 18px 0 0;">
        <h1 style="margin:0;color:#fff;font-size:24px;">ShopEase</h1>
      </div>
      <div style="padding:28px;background:#f8fafc;border-radius:0 0 18px 18px;">
        <p style="font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#7c3aed;margin:0 0 8px;">${statusLabel}</p>
        <h2 style="margin:0 0 10px;">Order ${escapeHtml(order.orderNumber)}</h2>
        <p style="color:#64748b;line-height:1.6;">Hello ${escapeHtml(order.name)}, here is the latest delivery information for your ShopEase order.</p>

        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:20px;margin:22px 0;">
          <p><strong>Status:</strong> ${escapeHtml(fulfillment.status)}</p>
          <p><strong>Estimated delivery:</strong> ${deliveryWindow}</p>
          <p><strong>Courier:</strong> ${courier}</p>
          <p><strong>Tracking ID:</strong> ${trackingId}</p>
          ${fulfillment.riderName || fulfillment.riderPhone ? `
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;" />
            <p><strong>Rider:</strong> ${riderName}</p>
            <p><strong>Rider contact:</strong> ${riderPhone}</p>
          ` : ""}
        </div>

        <a href="${frontendUrl}/track-order?orderNumber=${encodeURIComponent(order.orderNumber)}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">Track my order</a>

        <p style="margin-top:22px;color:#94a3b8;font-size:12px;line-height:1.6;">Rider details only appear when the delivery partner provides them. Keep your order number and checkout contact information private.</p>
      </div>
    </div>
  `;

  await sendEmail({
    email: order.email,
    subject:
      fulfillment.status === "shipped"
        ? `Your ShopEase order ${order.orderNumber} is on the way`
        : `Delivery update for ${order.orderNumber}`,
    html,
  });
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

    const previousCustomerState = JSON.stringify({
      status: fulfillment.status,
      trackingId: fulfillment.trackingId || "",
      courierName: fulfillment.courierName || "",
      estimatedDeliveryMinDays: fulfillment.estimatedDeliveryMinDays || null,
      estimatedDeliveryMaxDays: fulfillment.estimatedDeliveryMaxDays || null,
      riderName: fulfillment.riderName || "",
      riderPhone: fulfillment.riderPhone || "",
    });

    const status =
      cleanString(req.body?.status).toLowerCase() || fulfillment.status;
    const externalOrderId = cleanString(req.body?.externalOrderId);
    const trackingId = cleanString(req.body?.trackingId);
    const courierName = cleanString(req.body?.courierName);
    const riderName = cleanString(req.body?.riderName);
    const riderPhone = cleanString(req.body?.riderPhone);
    const minDays = nullableDay(req.body?.estimatedDeliveryMinDays);
    const maxDays = nullableDay(req.body?.estimatedDeliveryMaxDays);

    if (!FULFILLMENT_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Invalid Markaz fulfillment status.",
      });
    }

    if (Number.isNaN(minDays) || Number.isNaN(maxDays)) {
      return res.status(400).json({
        message: "Estimated delivery days must be whole numbers between 1 and 90.",
      });
    }

    if (minDays && maxDays && minDays > maxDays) {
      return res.status(400).json({
        message: "Minimum delivery days cannot be greater than maximum delivery days.",
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

    if (status === "shipped" && !trackingId && !courierName) {
      return res.status(400).json({
        message: "Add a courier name or tracking ID before marking the order shipped.",
      });
    }

    fulfillment.status = status;
    fulfillment.externalOrderId = externalOrderId;
    fulfillment.trackingId = trackingId;
    fulfillment.courierName = courierName;
    fulfillment.estimatedDeliveryMinDays = minDays;
    fulfillment.estimatedDeliveryMaxDays = maxDays;
    fulfillment.riderName = riderName;
    fulfillment.riderPhone = riderPhone;
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

    const newCustomerState = JSON.stringify({
      status: fulfillment.status,
      trackingId: fulfillment.trackingId || "",
      courierName: fulfillment.courierName || "",
      estimatedDeliveryMinDays: fulfillment.estimatedDeliveryMinDays || null,
      estimatedDeliveryMaxDays: fulfillment.estimatedDeliveryMaxDays || null,
      riderName: fulfillment.riderName || "",
      riderPhone: fulfillment.riderPhone || "",
    });

    let customerEmailSent = false;
    if (
      previousCustomerState !== newCustomerState &&
      ["submitted", "shipped", "delivered"].includes(fulfillment.status)
    ) {
      try {
        await sendDeliveryUpdateEmail(order, fulfillment);
        customerEmailSent = true;
      } catch (emailError) {
        console.error("Delivery update email error:", emailError);
      }
    }

    return res.json({
      success: true,
      fulfillment,
      orderStatus: order.status,
      autoSyncedOrderStatus: markazOnlyOrder,
      customerEmailSent,
    });
  } catch (error) {
    console.error("Update Markaz fulfillment/status sync error:", error);
    return res.status(500).json({
      message: "Could not update Markaz fulfillment.",
    });
  }
};
