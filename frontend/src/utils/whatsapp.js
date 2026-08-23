const normalizeWhatsAppNumber = (phoneNumber = "") => {
  const digits = String(phoneNumber).replace(/\D/g, "");

  if (!digits) return "";

  if (digits.startsWith("92")) {
    return digits;
  }

  if (digits.startsWith("0")) {
    return `92${digits.slice(1)}`;
  }

  if (digits.length === 10 && digits.startsWith("3")) {
    return `92${digits}`;
  }

  return digits;
};

const getStatusMessage = (order) => {
  const customerName = order?.name || "Customer";
  const orderNumber = order?.orderNumber || "your order";
  const status = String(order?.status || "pending").toLowerCase();

  const messages = {
    pending: `Assalam-o-Alaikum ${customerName},

Thank you for placing your order with ShopEase.

Order: ${orderNumber}
Status: Pending

We have received your order and will update you once it is confirmed.`,

    confirmed: `Assalam-o-Alaikum ${customerName},

Your ShopEase order has been confirmed.

Order: ${orderNumber}
Status: Confirmed

We are preparing your order for processing.`,

    processing: `Assalam-o-Alaikum ${customerName},

Your ShopEase order is currently being processed.

Order: ${orderNumber}
Status: Processing

We will update you again once your order is shipped.`,

    shipped: `Assalam-o-Alaikum ${customerName},

Good news! Your ShopEase order has been shipped 🚚

Order: ${orderNumber}
Status: Shipped

You can use the ShopEase Track Order page to follow the latest delivery status.`,

    delivered: `Assalam-o-Alaikum ${customerName},

Your ShopEase order has been marked as delivered.

Order: ${orderNumber}
Status: Delivered

Thank you for shopping with ShopEase. We hope you enjoy your purchase.`,

    cancelled: `Assalam-o-Alaikum ${customerName},

Your ShopEase order has been cancelled.

Order: ${orderNumber}
Status: Cancelled

If you need any assistance regarding this order, please reply to this message.`,
  };

  return (
    messages[status] ||
    `Assalam-o-Alaikum ${customerName},

Here is an update regarding your ShopEase order.

Order: ${orderNumber}
Status: ${status}

Please contact ShopEase if you need any assistance.`
  );
};

export const getWhatsAppLink = (order) => {
  const phoneNumber = normalizeWhatsAppNumber(order?.phoneNumber);

  if (!phoneNumber) {
    return "";
  }

  const message = getStatusMessage(order);

  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
};

export { normalizeWhatsAppNumber };