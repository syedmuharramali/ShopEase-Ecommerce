// backend/utils/sendEmail.js
const nodemailer = require("nodemailer");

function normalizeEmail(value = "") {
  return String(value).trim().toLowerCase();
}

const sendEmail = async (options = {}) => {
  const shopEmail = normalizeEmail(process.env.EMAIL_USER);
  const emailPassword = String(process.env.EMAIL_PASS || "").trim();

  if (!shopEmail || !emailPassword) {
    throw new Error("EMAIL_USER and EMAIL_PASS must be configured");
  }

  const requestedRecipient = normalizeEmail(options.email);
  const legacyAdminEmail = normalizeEmail(process.env.ADMIN_EMAIL);

  /*
   * EMAIL_USER is the single ShopEase mailbox.
   *
   * - All outgoing messages are sent from EMAIL_USER.
   * - Any message explicitly marked `toShop` is delivered to EMAIL_USER.
   * - Existing admin-notification callers that still pass ADMIN_EMAIL (or the
   *   old admin@shopease.com fallback) are also routed to EMAIL_USER. This
   *   keeps ADMIN_EMAIL free to remain an admin-login/bootstrap identity rather
   *   than a second mail destination.
   */
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

  const mailOptions = {
    from: `"ShopEase" <${shopEmail}>`,
    to: recipient,
    subject: options.subject,
    html: options.html,
  };

  if (options.text) {
    mailOptions.text = options.text;
  }

  if (options.replyTo) {
    mailOptions.replyTo = options.replyTo;
  }

  return transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
