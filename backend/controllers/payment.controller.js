const mongoose = require("mongoose");
const Order = require("../models/order.model.js");
const ProductVariant = require("../models/productVariant.model.js");
const { releaseCouponUsage } = require("../services/coupon.service.js");
const {
  isJazzCashConfigured,
  jazzCashConfig,
  verifySecureHash,
} = require("../services/jazzcash.service.js");

function frontendUrl() {
  return (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
}

function redirectResult(res, status, orderNumber = "") {
  const query = new URLSearchParams({ status });
  if (orderNumber) query.set("orderNumber", orderNumber);
  return res.redirect(303, `${frontendUrl()}/payment-result?${query.toString()}`);
}

function inventoryLines(order) {
  if (Array.isArray(order.items) && order.items.length) {
    return order.items.map((item) => ({ variant: item.variant, quantity: item.quantity }));
  }
  return order.variant ? [{ variant: order.variant, quantity: order.quantity }] : [];
}

async function restoreCancelledInventory(order) {
  const lines = inventoryLines(order).filter((line) => line.variant && Number(line.quantity) > 0);
  if (!lines.length) return;

  await ProductVariant.bulkWrite(
    lines.map((line) => ({
      updateOne: {
        filter: { _id: line.variant },
        update: { $inc: { stock: Number(line.quantity) } },
      },
    }))
  );
}

async function cancelFailedPayment(order, responseCode, responseMessage) {
  if (!order || order.status === "cancelled" || order.payment?.status === "paid") return order;

  const updated = await Order.findOneAndUpdate(
    { _id: order._id, status: order.status, "payment.status": { $ne: "paid" } },
    {
      $set: {
        status: "cancelled",
        "payment.status": "failed",
        "payment.gatewayResponseCode": responseCode || "",
        "payment.gatewayResponseMessage": responseMessage || "Payment was not completed",
      },
    },
    { returnDocument: "after" }
  );

  if (!updated) return Order.findById(order._id);

  try {
    await restoreCancelledInventory(updated);
  } catch (error) {
    console.error("Payment failure stock restore error:", error);
  }

  if (updated.coupon?.couponId && !updated.couponUsageReleased) {
    try {
      await releaseCouponUsage(updated.coupon.couponId);
      await Order.updateOne(
        { _id: updated._id, couponUsageReleased: false },
        { $set: { couponUsageReleased: true } }
      );
    } catch (error) {
      console.error("Payment failure coupon release error:", error);
    }
  }

  return updated;
}

exports.getPaymentConfig = async (req, res) => {
  const config = jazzCashConfig();
  return res.json({
    jazzcash: {
      enabled: isJazzCashConfigured(),
      mode: config.mode,
    },
  });
};

exports.jazzCashReturn = async (req, res) => {
  try {
    const fields = req.body || {};
    const orderId = String(fields.ppmpf_1 || "").trim();
    const orderNumber = String(fields.pp_BillReference || fields.ppmpf_2 || "").trim();

    if (!isJazzCashConfigured()) return redirectResult(res, "failed", orderNumber);
    if (!verifySecureHash(fields)) {
      console.error("JazzCash response rejected: invalid secure hash");
      return redirectResult(res, "failed", orderNumber);
    }

    const query = mongoose.Types.ObjectId.isValid(orderId)
      ? { _id: orderId }
      : { orderNumber };

    const order = await Order.findOne(query);
    if (!order || order.paymentMethod !== "jazzcash") {
      return redirectResult(res, "failed", orderNumber);
    }

    const expectedAmount = String(Math.round(Number(order.total) * 100));
    const responseCode = String(fields.pp_ResponseCode || "").trim();
    const responseMessage = String(fields.pp_ResponseMessage || "").trim();
    const transactionRef = String(fields.pp_TxnRefNo || "").trim();

    const referencesMatch =
      transactionRef && transactionRef === String(order.payment?.transactionRef || "");
    const amountMatches = String(fields.pp_Amount || "").trim() === expectedAmount;

    if (!referencesMatch || !amountMatches) {
      console.error("JazzCash response rejected: order reference or amount mismatch");
      return redirectResult(res, "failed", order.orderNumber);
    }

    if (responseCode === "000") {
      const updated = await Order.findOneAndUpdate(
        {
          _id: order._id,
          status: { $ne: "cancelled" },
          "payment.status": { $ne: "paid" },
        },
        {
          $set: {
            status: "confirmed",
            "payment.status": "paid",
            "payment.gatewayResponseCode": responseCode,
            "payment.gatewayResponseMessage": responseMessage || "Payment completed",
            "payment.retrievalReferenceNo": String(fields.pp_RetreivalReferenceNo || ""),
            "payment.paidAt": new Date(),
          },
        },
        { returnDocument: "after" }
      );

      if (updated || order.payment?.status === "paid") {
        return redirectResult(res, "success", order.orderNumber);
      }

      return redirectResult(res, "failed", order.orderNumber);
    }

    await cancelFailedPayment(order, responseCode, responseMessage);
    return redirectResult(res, "failed", order.orderNumber);
  } catch (error) {
    console.error("JazzCash return error:", error);
    return redirectResult(res, "failed");
  }
};