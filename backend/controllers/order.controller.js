const mongoose = require("mongoose");

const Order = require("../models/order.model.js");
const Product = require("../models/product.model.js");
const ProductVariant = require("../models/productVariant.model.js");
const sendEmail = require("../utils/sendEmail.js");

// ============================================================
// CREATE ORDER
// ============================================================

exports.createOrder = async (req, res) => {
  try {
    const {
      name,
      email,
      phoneNumber,
      province,
      city,
      address,
      postalCode,
      paymentMethod,
      quantity,
      variantId,
    } = req.body;

    const { productId } = req.params;

    // --------------------------------------------------------
    // Validate IDs
    // --------------------------------------------------------

    if (
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(variantId)
    ) {
      return res.status(400).json({
        message: "Valid variantId is required",
      });
    }

    // --------------------------------------------------------
    // Validate quantity
    // --------------------------------------------------------

    if (
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return res.status(400).json({
        message:
          "Quantity must be a positive integer",
      });
    }

    // --------------------------------------------------------
    // Get product
    // --------------------------------------------------------

    const product = await Product.findById(
      productId
    ).lean();

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // --------------------------------------------------------
    // Get selected variant
    // --------------------------------------------------------

    const variant =
      await ProductVariant.findOne({
        _id: variantId,
        product: productId,
        isActive: true,
      }).lean();

    if (!variant) {
      return res.status(404).json({
        message:
          "Selected product variant not found or is inactive",
      });
    }

    // --------------------------------------------------------
    // Check stock
    // --------------------------------------------------------

    if (variant.stock < quantity) {
      return res.status(400).json({
        message:
          `Only ${variant.stock} item(s) are available`,
      });
    }

    // --------------------------------------------------------
    // Calculate subtotal from VARIANT price
    // --------------------------------------------------------

    const subtotal =
      variant.price * quantity;

    // --------------------------------------------------------
    // Create order
    // --------------------------------------------------------

    const order = await Order.create({
      name,
      email,
      phoneNumber,
      province,
      city,
      address,
      postalCode,
      paymentMethod,
      quantity,
      subtotal,

      product: productId,

      variant: variantId,

      variantSnapshot: {
        sku: variant.sku,
        title: variant.title,
        price: variant.price,
        selectedOptions:
          variant.selectedOptions.map(
            (option) => ({
              optionId: option.optionId,
              optionName: option.optionName,
              valueId: option.valueId,
              value: option.value,
            })
          ),
      },

      status: "pending",
    });

    // --------------------------------------------------------
    // Reduce variant stock
    // --------------------------------------------------------

    const stockUpdate =
      await ProductVariant.updateOne(
        {
          _id: variantId,
          product: productId,
          isActive: true,
          stock: {
            $gte: quantity,
          },
        },
        {
          $inc: {
            stock: -quantity,
          },
        }
      );

    if (stockUpdate.modifiedCount !== 1) {
      // Roll back the order if stock changed
      // between our check and update.
      await Order.findByIdAndDelete(
        order._id
      );

      return res.status(409).json({
        message:
          "Sorry, the selected variant is no longer available in the requested quantity",
      });
    }

    // --------------------------------------------------------
    // Populate order
    // --------------------------------------------------------

    const populatedOrder =
      await Order.findById(order._id)
        .populate(
          "product",
          "name images"
        )
        .populate(
          "variant",
          "sku title price images selectedOptions"
        );

    // --------------------------------------------------------
    // Send customer email
    // --------------------------------------------------------

    try {
      await sendCustomerOrderEmail(
        populatedOrder,
        product,
        variant
      );
    } catch (emailError) {
      console.error(
        "Customer order email error:",
        emailError
      );
    }

    // --------------------------------------------------------
    // Send admin notification
    // --------------------------------------------------------

    try {
      await sendAdminOrderNotification(
        populatedOrder,
        product,
        variant
      );
    } catch (emailError) {
      console.error(
        "Admin order email error:",
        emailError
      );
    }

    return res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      order: populatedOrder,
    });
  } catch (error) {
    console.error(
      "Create order error:",
      error
    );

    return res.status(500).json({
      message: error.message,
    });
  }
};

// ============================================================
// GET ALL ORDERS
// ============================================================

exports.getAllOrders = async (req, res) => {
  try {
    const orders =
      await Order.find()
        .populate(
          "product",
          "name images"
        )
        .populate(
          "variant",
          "sku title price images selectedOptions"
        )
        .sort({
          createdAt: -1,
        });

    return res.json(orders);
  } catch (error) {
    console.error(
      "Get all orders error:",
      error
    );

    return res.status(500).json({
      message: error.message,
    });
  }
};

// ============================================================
// GET SINGLE ORDER
// ============================================================

exports.getOrderById = async (
  req,
  res
) => {
  try {
    const order =
      await Order.findById(req.params.id)
        .populate(
          "product",
          "name images"
        )
        .populate(
          "variant",
          "sku title price images selectedOptions"
        );

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    return res.json(order);
  } catch (error) {
    console.error(
      "Get order error:",
      error
    );

    return res.status(500).json({
      message: error.message,
    });
  }
};

// ============================================================
// UPDATE ORDER STATUS
// ============================================================

exports.updateOrderStatus = async (
  req,
  res
) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (
      !allowedStatuses.includes(status)
    ) {
      return res.status(400).json({
        message: "Invalid order status",
      });
    }

    const order =
      await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    order.status = status;

    await order.save();

    try {
      await sendOrderStatusEmail(
        order
      );
    } catch (emailError) {
      console.error(
        "Order status email error:",
        emailError
      );
    }

    return res.json({
      success: true,
      message: "Order status updated",
      order,
    });
  } catch (error) {
    console.error(
      "Update order status error:",
      error
    );

    return res.status(500).json({
      message: error.message,
    });
  }
};

// ============================================================
// CUSTOMER ORDER EMAIL
// ============================================================

const sendCustomerOrderEmail = async (
  order,
  product,
  variant
) => {
  const productImage =
    product.images &&
    product.images.length > 0
      ? `http://localhost:5000/${String(
          product.images[0]
        ).replace(/\\/g, "/")}`
      : "https://via.placeholder.com/100";

  const selectedOptions =
    variant.selectedOptions &&
    variant.selectedOptions.length
      ? variant.selectedOptions
          .map(
            (option) =>
              `<p><strong>${option.optionName}:</strong> ${option.value}</p>`
          )
          .join("")
      : "";

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb;">

      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">ShopEase</h1>
        <p style="color: white; opacity: 0.9;">
          Order Confirmation
        </p>
      </div>

      <div style="padding: 30px; background: white;">

        <h2 style="color: #333;">
          Thank you for your order, ${order.name}!
        </h2>

        <p style="color: #666;">
          Your order has been placed successfully.
        </p>

        <div style="background: #f3f4f6; border-radius: 10px; padding: 20px; margin: 20px 0;">
          <h3>Order Details</h3>

          <p>
            <strong>Order Number:</strong>
            ${order.orderNumber}
          </p>

          <p>
            <strong>Order Date:</strong>
            ${new Date(
              order.createdAt
            ).toLocaleString()}
          </p>

          <p>
            <strong>Status:</strong>
            ${order.status}
          </p>
        </div>

        <div style="background: #f3f4f6; border-radius: 10px; padding: 20px; margin: 20px 0;">

          <h3>Product Details</h3>

          <div style="display: flex; gap: 15px; align-items: center;">

            <img
              src="${productImage}"
              alt="${product.name}"
              style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;"
            >

            <div>

              <p>
                <strong>${product.name}</strong>
              </p>

              <p>
                <strong>SKU:</strong>
                ${variant.sku}
              </p>

              ${
                variant.title
                  ? `<p><strong>Variant:</strong> ${variant.title}</p>`
                  : ""
              }

              ${selectedOptions}

              <p>
                Quantity: ${order.quantity}
              </p>

              <p>
                Price: $${variant.price.toFixed(2)}
              </p>

            </div>

          </div>

          <p style="margin-top: 15px;">
            <strong>Subtotal:</strong>
            $${order.subtotal.toFixed(2)}
          </p>

        </div>

        <div style="background: #f3f4f6; border-radius: 10px; padding: 20px; margin: 20px 0;">

          <h3>Shipping Address</h3>

          <p>${order.name}</p>
          <p>${order.address}</p>
          <p>${order.city}, ${order.province}</p>
          <p>Postal Code: ${order.postalCode}</p>
          <p>Phone: ${order.phoneNumber}</p>

        </div>

        <div style="background: #f3f4f6; border-radius: 10px; padding: 20px; margin: 20px 0;">

          <h3>Payment Method</h3>

          <p>
            ${
              order.paymentMethod === "cod"
                ? "Cash on Delivery"
                : "Credit/Debit Card"
            }
          </p>

        </div>

        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">

        <p style="color: #666; font-size: 14px;">
          We'll notify you once your order is shipped.
        </p>

        <p style="color: #666; font-size: 14px;">
          Thank you for shopping with ShopEase!
        </p>

      </div>

      <div style="padding: 20px; text-align: center; background: #f3f4f6;">

        <p style="color: #999; font-size: 12px;">
          &copy; ${new Date().getFullYear()}
          ShopEase. All rights reserved.
        </p>

      </div>

    </div>
  `;

  await sendEmail({
    email: order.email,
    subject: `Order Confirmation - ${order.orderNumber}`,
    html: emailHtml,
  });
};

// ============================================================
// ADMIN ORDER EMAIL
// ============================================================

const sendAdminOrderNotification = async (
  order,
  product,
  variant
) => {
  const selectedOptions =
    variant.selectedOptions &&
    variant.selectedOptions.length
      ? variant.selectedOptions
          .map(
            (option) =>
              `${option.optionName}: ${option.value}`
          )
          .join(" | ")
      : "Default variant";

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">

      <h2>New Order Received!</h2>

      <p>
        <strong>Order Number:</strong>
        ${order.orderNumber}
      </p>

      <p>
        <strong>Customer:</strong>
        ${order.name}
      </p>

      <p>
        <strong>Email:</strong>
        ${order.email}
      </p>

      <p>
        <strong>Phone:</strong>
        ${order.phoneNumber}
      </p>

      <p>
        <strong>Product:</strong>
        ${product.name}
      </p>

      <p>
        <strong>SKU:</strong>
        ${variant.sku}
      </p>

      <p>
        <strong>Variant:</strong>
        ${selectedOptions}
      </p>

      <p>
        <strong>Quantity:</strong>
        ${order.quantity}
      </p>

      <p>
        <strong>Total:</strong>
        $${order.subtotal.toFixed(2)}
      </p>

      <p>
        <strong>Payment Method:</strong>
        ${
          order.paymentMethod === "cod"
            ? "Cash on Delivery"
            : "Card"
        }
      </p>

      <p>
        <strong>Shipping Address:</strong>
        ${order.address},
        ${order.city},
        ${order.province}
      </p>

      <a
        href="${process.env.FRONTEND_URL}/admin/orders/${order._id}"
        style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;"
      >
        View Order
      </a>

    </div>
  `;

  await sendEmail({
    email:
      process.env.ADMIN_EMAIL ||
      "admin@shopease.com",

    subject:
      `New Order - ${order.orderNumber}`,

    html: emailHtml,
  });
};

// ============================================================
// ORDER STATUS EMAIL
// ============================================================

const sendOrderStatusEmail = async (
  order
) => {
  const statusMessages = {
    pending:
      "Your order is awaiting confirmation.",

    confirmed:
      "Your order has been confirmed!",

    processing:
      "Your order is being processed.",

    shipped:
      "Your order has been shipped!",

    delivered:
      "Your order has been delivered. Enjoy your purchase!",

    cancelled:
      "Your order has been cancelled.",
  };

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">

      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
        <h1 style="color: white;">
          ShopEase
        </h1>
      </div>

      <div style="padding: 30px;">

        <h2>Order Status Update</h2>

        <p>
          Dear ${order.name},
        </p>

        <p>
          ${
            statusMessages[order.status] ||
            `Your order status has been updated to: ${order.status}`
          }
        </p>

        <p>
          <strong>Order Number:</strong>
          ${order.orderNumber}
        </p>

        <p>
          <strong>Status:</strong>
          ${order.status}
        </p>

        <a
          href="${process.env.FRONTEND_URL}/track-order/${order._id}"
          style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;"
        >
          Track Order
        </a>

      </div>

    </div>
  `;

  await sendEmail({
    email: order.email,
    subject:
      `Order Status Update - ${order.orderNumber}`,
    html: emailHtml,
  });
};
