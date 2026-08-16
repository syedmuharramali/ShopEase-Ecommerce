const sendEmail = require("../utils/sendEmail.js");

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

exports.sendContactMessage = async (req, res) => {
  try {
    const name = cleanString(req.body?.name);
    const email = cleanString(req.body?.email).toLowerCase();
    const subject = cleanString(req.body?.subject);
    const message = cleanString(req.body?.message);

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        message: "Name, email, subject and message are required",
      });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address",
      });
    }

    if (name.length > 120) {
      return res.status(400).json({ message: "Name is too long" });
    }

    if (subject.length > 180) {
      return res.status(400).json({ message: "Subject is too long" });
    }

    if (message.length < 10) {
      return res.status(400).json({
        message: "Please provide a little more detail",
      });
    }

    if (message.length > 5000) {
      return res.status(400).json({ message: "Message is too long" });
    }

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");

    const emailHtml = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#0f172a;">
        <div style="background:#0f172a;padding:28px 30px;border-radius:18px 18px 0 0;">
          <h1 style="margin:0;color:#fff;font-size:24px;">ShopEase</h1>
          <p style="margin:8px 0 0;color:#cbd5e1;font-size:13px;">New contact message</p>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:0;padding:30px;border-radius:0 0 18px 18px;background:#fff;">
          <p><strong>From:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Subject:</strong> ${safeSubject}</p>
          <div style="margin-top:24px;padding:20px;background:#f8fafc;border-radius:14px;line-height:1.7;color:#334155;">
            ${safeMessage}
          </div>
          <p style="margin-top:24px;color:#64748b;font-size:12px;line-height:1.6;">
            Reply to this email to respond directly to ${safeName}.
          </p>
        </div>
      </div>
    `;

    await sendEmail({
      toShop: true,
      subject: `[ShopEase Contact] ${subject}`,
      html: emailHtml,
      replyTo: email,
    });

    return res.status(200).json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("sendContactMessage error:", error);

    return res.status(500).json({
      message: "We couldn't send your message right now. Please try again.",
    });
  }
};
