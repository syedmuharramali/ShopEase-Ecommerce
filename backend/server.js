const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

function cleanUrl(value = "") {
  return String(value).trim().replace(/\/+$/, "");
}

function isLocalUrl(value = "") {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(
    cleanUrl(value)
  );
}

function assertProductionConfig() {
  if (!isProduction) return;

  const frontendUrl = cleanUrl(process.env.FRONTEND_URL);
  const backendUrl = cleanUrl(process.env.BACKEND_URL || process.env.SERVER_URL);

  if (!frontendUrl) {
    throw new Error("FRONTEND_URL must be configured in production");
  }

  if (isLocalUrl(frontendUrl)) {
    throw new Error("FRONTEND_URL cannot point to localhost in production");
  }

  // BACKEND_URL is only required by integrations that need a public callback
  // URL (for example JazzCash). Do not block the whole API from starting when
  // those optional integrations are disabled.
  if (backendUrl && isLocalUrl(backendUrl)) {
    throw new Error("BACKEND_URL cannot point to localhost in production");
  }
}

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

const allowedOrigins = [
  ...(!isProduction ? ["http://localhost:5173"] : []),
  process.env.FRONTEND_URL,
]
  .filter(Boolean)
  .map((origin) => cleanUrl(origin));

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      const cleanOrigin = cleanUrl(origin);
      if (allowedOrigins.includes(cleanOrigin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  })
);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
  message: {
    message: "Too many requests. Please try again shortly.",
  },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: (req) => req.method === "OPTIONS",
  message: {
    message: "Too many login attempts. Please wait 15 minutes and try again.",
  },
});

const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
  message: {
    message: "Too many order attempts. Please wait a few minutes and try again.",
  },
});

const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
  message: {
    message: "Too many email requests. Please wait a few minutes and try again.",
  },
});

app.use("/api", apiLimiter);
app.use("/api/users/login", loginLimiter);
app.use("/api/orders/create", orderLimiter);
app.use("/api/email", emailLimiter);

const userRoutes = require("./routes/user.route");
const productRoutes = require("./routes/product.route");
const productOptionRoutes = require("./routes/productOption.route");
const productVariantRoutes = require("./routes/productVariant.route");
const orderRoutes = require("./routes/order.route.js");
const emailRoutes = require("./routes/email.route.js");
const categoryRoutes = require("./routes/category.route");
const productDeliveryRateRoutes = require("./routes/productDeliveryRate.route");
const productReviewRoutes = require("./routes/productReview.route");
const couponRoutes = require("./routes/coupon.route");
const paymentRoutes = require("./routes/payment.route");
const analyticsRoutes = require("./routes/analytics.route");
const markazRoutes = require("./routes/markaz.route");

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/reviews", productReviewRoutes);
app.use("/api/products", productDeliveryRateRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin/analytics", analyticsRoutes);
app.use("/api/admin/markaz", markazRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productOptionRoutes);
app.use("/api/products", productVariantRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/email", emailRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "ShopEase API is running",
  });
});

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  console.error("Server error:", err);

  res.status(err.status || 500).json({
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message || "Internal server error",
  });
});

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not configured");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    assertProductionConfig();

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`ShopEase API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
