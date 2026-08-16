const Order = require("../models/order.model.js");

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function buildPublicDeliveryDetails(order) {
  const fulfillments = Array.isArray(order.supplierFulfillments)
    ? order.supplierFulfillments
    : [];

  return fulfillments
    .filter((entry) => entry.provider === "markaz")
    .map((entry) => ({
      status: entry.status,
      trackingId: entry.trackingId || "",
      courierName: entry.courierName || "",
      estimatedDeliveryMinDays:
        Number.isFinite(Number(entry.estimatedDeliveryMinDays))
          ? Number(entry.estimatedDeliveryMinDays)
          : null,
      estimatedDeliveryMaxDays:
        Number.isFinite(Number(entry.estimatedDeliveryMaxDays))
          ? Number(entry.estimatedDeliveryMaxDays)
          : null,
      riderName: entry.riderName || "",
      riderPhone: entry.riderPhone || "",
      lastUpdatedAt: entry.lastUpdatedAt || null,
    }));
}

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

    const order = await Order.findOne({
      orderNumber,
      ...contactFilter,
    })
      .select("+supplierFulfillments")
      .populate("product", "name images")
      .populate("variant", "sku title")
      .lean();

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
      sku: item.variantSnapshot?.sku || item.variant?.sku || "",
      variantTitle:
        item.variantSnapshot?.title || item.variant?.title || "",
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
        paymentStatus:
          order.payment?.status ||
          (order.paymentMethod === "cod" ? "unpaid" : "pending"),
        province: order.province,
        city: order.city,
        paymentMethod: order.paymentMethod,
        items,
        delivery: buildPublicDeliveryDetails(order),
      },
    });
  } catch (error) {
    console.error("Track order error:", error);
    return res.status(500).json({
      message: "We couldn't track this order right now. Please try again.",
    });
  }
};
