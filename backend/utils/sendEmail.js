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

  const html = String(options.html || "").trim();
  const text = String(options.text || "").trim() || htmlToPlainText(html);

  const mailOptions = {
    from: `"ShopEase" <${shopEmail}>`,
    to: recipient,
    subject: options.subject,
    ...(text ? { text } : {}),
    ...(html ? { html } : {}),
  };

  if (options.replyTo) {
    mailOptions.replyTo = options.replyTo;
  }

  return transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
