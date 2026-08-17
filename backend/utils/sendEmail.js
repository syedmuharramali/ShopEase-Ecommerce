// backend/utils/sendEmail.js
const nodemailer = require("nodemailer");

function normalizeEmail(value = "") {
  return String(value).trim().toLowerCase();
}

function htmlToPlainText(html = "") {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#039;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function prepareOrderConfirmation(subject = "", html = "") {
  const match = String(subject).match(/^Order Confirmation\s*-\s*(.+)$/i);

  if (!match) {
    return {
      subject: String(subject || "").trim(),
      html: String(html || "").trim(),
    };
  }

  const orderNumber = String(match[1] || "").trim();

  let cleanHtml = String(html || "").trim();

  /*
   * Keep order confirmations strictly transactional.
   *
   * - Product images are unnecessary for a receipt and local development can
   *   otherwise produce localhost image URLs that are useless to recipients.
   * - "Continue shopping" mixes a promotional CTA into a transactional order
   *   message. Customers can return to ShopEase normally after reading their
   *   receipt.
   */
  cleanHtml = cleanHtml
    .replace(/<img\b[^>]*>/gi, "")
    .replace(
      /<a\b[^>]*>[\s\S]*?Continue\s+shopping[\s\S]*?<\/a>/gi,
      ""
    )
    .replace(/Cart order confirmation/gi, "Order received")
    .replace(/Order confirmation/gi, "Order received");

  const transactionalFooter = `
    <div style="max-width:620px;margin:18px auto 0;font-family:Arial,sans-serif;color:#64748b;font-size:12px;line-height:1.6;text-align:center;">
      You received this message because this email address was used to place an order with ShopEase. This email contains order information only.
    </div>
  `;

  return {
    subject: orderNumber
      ? `ShopEase order received — ${orderNumber}`
      : "ShopEase order received",
    html: `${cleanHtml}${transactionalFooter}`,
  };
}

const sendEmail = async (options = {}) => {
  const shopEmail = normalizeEmail(process.env.EMAIL_USER);
  const emailPassword = String(process.env.EMAIL_PASS || "").trim();

  if (!shopEmail || !emailPassword) {
    throw new Error("EMAIL_USER and EMAIL_PASS must be configured");
  }

  const requestedRecipient = normalizeEmail(options.email);
  const legacyAdminEmail = normalizeEmail(process.env.ADMIN_EMAIL);

  const isLegacyAdminDestination =
    requestedRecipient === "admin@shopease.com" ||
    (legacyAdminEmail && requestedRecipient === legacyAdminEmail);

  const recipient =
    options.toShop || isLegacyAdminDestination
      ? shopEmail
      : requestedRecipient;

  if (!recipient) {
    throw new Error("Email recipient is required");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: shopEmail,
      pass: emailPassword,
    },
  });

  const prepared = prepareOrderConfirmation(options.subject, options.html);
  const html = prepared.html;
  const text = String(options.text || "").trim() || htmlToPlainText(html);

  const mailOptions = {
    from: `"ShopEase" <${shopEmail}>`,
    to: recipient,
    subject: prepared.subject || options.subject,
    ...(text ? { text } : {}),
    ...(html ? { html } : {}),
  };

  if (options.replyTo) {
    mailOptions.replyTo = options.replyTo;
  }

  return transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
