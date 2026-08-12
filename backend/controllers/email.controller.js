const sendEmail = require("../utils/sendEmail.js");

const Product = require(
  "../models/product.model.js"
);

const ProductVariant = require(
  "../models/productVariant.model.js"
);

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatPrice(value) {
  return `PKR ${new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)}`;
}

exports.sendProductInfo = async (req, res) => {
  try {
    const {
      name,
      email,
      productId,
    } = req.body;

    /*
     * Basic validation
     */
    if (
      !name?.trim() ||
      !email?.trim() ||
      !productId
    ) {
      return res.status(400).json({
        message:
          "Name, email and product are required",
      });
    }

    if (
      !/^\S+@\S+\.\S+$/.test(
        email.trim()
      )
    ) {
      return res.status(400).json({
        message:
          "Please enter a valid email address",
      });
    }

    /*
     * Find product
     */
    const product =
      await Product.findById(productId)
        .populate(
          "category",
          "name"
        )
        .lean();

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    /*
     * Find default/available variant
     */
    const variant =
      await ProductVariant.findOne({
        product: productId,
        isActive: true,
      })
        .sort({
          isDefault: -1,
          stock: -1,
          createdAt: 1,
        })
        .lean();

    if (!variant) {
      return res.status(400).json({
        message:
          "This product has no active variant",
      });
    }

    /*
     * Safe values for email HTML
     */
    const safeName =
      escapeHtml(name.trim());

    const safeProductName =
      escapeHtml(product.name);

    const safeDescription =
      escapeHtml(
        product.description || ""
      );

    const safeCategory =
      escapeHtml(
        product.category?.name ||
          "Uncategorized"
      );

    const safeVariant =
      escapeHtml(
        variant.title ||
          variant.sku ||
          "Default"
      );

    /*
     * Variant options
     */
    const optionText =
      variant.selectedOptions?.length
        ? variant.selectedOptions
            .map(
              (option) =>
                `${escapeHtml(
                  option.optionName
                )}: ${escapeHtml(
                  option.value
                )}`
            )
            .join(" · ")
        : "Default variant";

    /*
     * Frontend URL
     */
    const frontendUrl = (
      process.env.FRONTEND_URL ||
      "http://localhost:5173"
    ).replace(/\/+$/, "");

    /*
     * Email HTML
     */
    const emailHtml = `
      <div
        style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 0 auto;
          color: #0f172a;
        "
      >
        <div
          style="
            background: #0f172a;
            padding: 30px;
            text-align: center;
          "
        >
          <h1
            style="
              color: white;
              margin: 0;
            "
          >
            ShopEase
          </h1>
        </div>

        <div
          style="
            padding: 30px;
            background: #f8fafc;
          "
        >
          <h2>
            Hello ${safeName}!
          </h2>

          <p
            style="
              color: #64748b;
              line-height: 1.6;
            "
          >
            Here are the product details
            you requested.
          </p>

          <div
            style="
              background: white;
              border-radius: 16px;
              padding: 24px;
              margin: 20px 0;
            "
          >
            <h3
              style="
                margin-top: 0;
                color: #0f172a;
              "
            >
              ${safeProductName}
            </h3>

            <p
              style="
                color: #64748b;
                line-height: 1.6;
              "
            >
              ${safeDescription}
            </p>

            <p
              style="
                font-size: 24px;
                font-weight: bold;
                color: #0f172a;
              "
            >
              ${formatPrice(variant.price)}
            </p>

            <p>
              <strong>Variant:</strong>
              ${safeVariant}
            </p>

            <p>
              <strong>Options:</strong>
              ${optionText}
            </p>

            <p>
              <strong>Category:</strong>
              ${safeCategory}
            </p>

            <p>
              <strong>Stock:</strong>
              ${
                Number(variant.stock) > 0
                  ? `${variant.stock} available`
                  : "Out of stock"
              }
            </p>
          </div>

          <a
            href="${frontendUrl}/product/${product._id}"
            style="
              display: inline-block;
              background: #0f172a;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 10px;
            "
          >
            View Product
          </a>

          <hr
            style="
              margin: 30px 0;
              border: none;
              border-top: 1px solid #e2e8f0;
            "
          />

          <p
            style="
              color: #94a3b8;
              font-size: 12px;
              text-align: center;
            "
          >
            You requested information
            about this ShopEase product.
          </p>
        </div>
      </div>
    `;

    /*
     * Send email
     */
    await sendEmail({
      email:
        email.trim().toLowerCase(),

      subject:
        `Product Information: ${product.name}`,

      html: emailHtml,
    });

    return res.status(200).json({
      message:
        "Product information sent successfully",
    });
  } catch (error) {
    console.error(
      "sendProductInfo error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to send product information",
    });
  }
};