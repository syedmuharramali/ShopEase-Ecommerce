const crypto = require("crypto");

function clean(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function jazzCashConfig() {
  return {
    enabled: clean(process.env.JAZZCASH_ENABLED).toLowerCase() === "true",
    mode: clean(process.env.JAZZCASH_MODE).toLowerCase() || "sandbox",
    paymentUrl: clean(process.env.JAZZCASH_PAYMENT_URL),
    merchantId: clean(process.env.JAZZCASH_MERCHANT_ID),
    password: clean(process.env.JAZZCASH_PASSWORD),
    integritySalt: clean(process.env.JAZZCASH_INTEGRITY_SALT),
  };
}

function isJazzCashConfigured() {
  const config = jazzCashConfig();
  return Boolean(
    config.enabled &&
      config.paymentUrl &&
      config.merchantId &&
      config.password &&
      config.integritySalt
  );
}

function assertJazzCashConfigured() {
  if (!isJazzCashConfigured()) {
    const error = new Error("JazzCash is not configured yet. Please choose Cash on Delivery.");
    error.statusCode = 503;
    throw error;
  }
}

function formatJazzCashDate(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(
    date.getHours()
  )}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function fieldsForHash(fields) {
  return Object.entries(fields)
    .filter(([key, value]) =>
      key.toLowerCase().startsWith("pp") &&
      key !== "pp_SecureHash" &&
      clean(value) !== ""
    )
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([, value]) => clean(value));
}

function createSecureHash(fields) {
  const { integritySalt } = jazzCashConfig();
  const values = fieldsForHash(fields);
  const message = [integritySalt, ...values].join("&");

  return crypto
    .createHmac("sha256", integritySalt)
    .update(message, "utf8")
    .digest("hex")
    .toUpperCase();
}

function verifySecureHash(fields) {
  const incoming = clean(fields?.pp_SecureHash).toUpperCase();
  if (!incoming) return false;

  const expected = createSecureHash(fields);
  if (incoming.length !== expected.length) return false;

  return crypto.timingSafeEqual(Buffer.from(incoming), Buffer.from(expected));
}

function getBackendUrl() {
  return clean(process.env.BACKEND_URL || process.env.SERVER_URL || "http://localhost:5000").replace(/\/+$/, "");
}

function buildJazzCashPayment(order) {
  assertJazzCashConfigured();

  const config = jazzCashConfig();
  const now = new Date();
  const expiry = new Date(now.getTime() + 30 * 60 * 1000);
  const txnRef = `T${formatJazzCashDate(now)}${Math.floor(100 + Math.random() * 900)}`;
  const amount = String(Math.round(Number(order.total) * 100));

  const fields = {
    pp_Version: "1.1",
    pp_TxnType: "MWALLET",
    pp_Language: "EN",
    pp_MerchantID: config.merchantId,
    pp_SubMerchantID: "",
    pp_Password: config.password,
    pp_BankID: "TBANK",
    pp_ProductID: "RETL",
    pp_TxnRefNo: txnRef,
    pp_Amount: amount,
    pp_TxnCurrency: "PKR",
    pp_TxnDateTime: formatJazzCashDate(now),
    pp_BillReference: order.orderNumber,
    pp_Description: `ShopEase order ${order.orderNumber}`,
    pp_TxnExpiryDateTime: formatJazzCashDate(expiry),
    pp_ReturnURL: `${getBackendUrl()}/api/payments/jazzcash/return`,
    ppmpf_1: String(order._id),
    ppmpf_2: order.orderNumber,
    ppmpf_3: "ShopEase",
    ppmpf_4: "",
    ppmpf_5: "",
  };

  fields.pp_SecureHash = createSecureHash(fields);

  return {
    provider: "jazzcash",
    redirectUrl: config.paymentUrl,
    fields,
    transactionRef: txnRef,
    expiresAt: expiry,
  };
}

module.exports = {
  jazzCashConfig,
  isJazzCashConfigured,
  assertJazzCashConfigured,
  buildJazzCashPayment,
  createSecureHash,
  verifySecureHash,
};