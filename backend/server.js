const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const {
  rateLimit,
} = require("express-rate-limit");
const path = require("path");

require("dotenv").config();

const app = express();

const PORT =
  process.env.PORT || 5000;

/*
 * ----------------------------------------
 * Express settings
 * ----------------------------------------
 */

app.disable("x-powered-by");

/*
 * ----------------------------------------
 * Security Headers
 * ----------------------------------------
 *
 * Allow uploaded product images to be
 * displayed by the frontend.
 */

app.use(
  helmet({
    contentSecurityPolicy: false,

    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

/*
 * ----------------------------------------
 * CORS
 * ----------------------------------------
 */

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
]
  .filter(Boolean)
  .map((origin) =>
    origin.replace(/\/+$/, "")
  );

app.use(
  cors({
    origin(origin, callback) {
      /*
       * Postman, backend services and
       * same-origin requests may not
       * include an Origin header.
       */
      if (!origin) {
        return callback(
          null,
          true
        );
      }

      const cleanOrigin =
        origin.replace(/\/+$/, "");

      if (
        allowedOrigins.includes(
          cleanOrigin
        )
      ) {
        return callback(
          null,
          true
        );
      }

      return callback(
        null,
        false
      );
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],

    credentials: false,
  })
);

/*
 * ----------------------------------------
 * Body Middleware
 * ----------------------------------------
 */

app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  })
);

/*
 * ----------------------------------------
 * Static Uploads
 * ----------------------------------------
 */

app.use(
  "/uploads",
  express.static(
    path.join(
      __dirname,
      "uploads"
    )
  )
);

/*
 * ----------------------------------------
 * Rate Limiters
 * ----------------------------------------
 */

/*
 * General API limiter
 *
 * 300 requests per 15 minutes
 * per IP address.
 */

const apiLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    limit: 300,

    standardHeaders: true,

    legacyHeaders: false,

    skip: (req) =>
      req.method === "OPTIONS",

    message: {
      message:
        "Too many requests. Please try again shortly.",
    },
  });

/*
 * Admin login limiter
 */

const loginLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    limit: 10,

    standardHeaders: true,

    legacyHeaders: false,

    skipSuccessfulRequests: true,

    skip: (req) =>
      req.method === "OPTIONS",

    message: {
      message:
        "Too many login attempts. Please wait 15 minutes and try again.",
    },
  });

/*
 * Order limiter
 */

const orderLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    limit: 20,

    standardHeaders: true,

    legacyHeaders: false,

    skip: (req) =>
      req.method === "OPTIONS",

    message: {
      message:
        "Too many order attempts. Please wait a few minutes and try again.",
    },
  });

/*
 * Email limiter
 */

const emailLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    limit: 20,

    standardHeaders: true,

    legacyHeaders: false,

    skip: (req) =>
      req.method === "OPTIONS",

    message: {
      message:
        "Too many email requests. Please wait a few minutes and try again.",
    },
  });

/*
 * Apply general API protection.
 */

app.use(
  "/api",
  apiLimiter
);

/*
 * Apply stricter limits to
 * sensitive public endpoints.
 */

app.use(
  "/api/users/login",
  loginLimiter
);

app.use(
  "/api/orders/create",
  orderLimiter
);

app.use(
  "/api/email",
  emailLimiter
);

/*
 * ----------------------------------------
 * Routes
 * ----------------------------------------
 */

const userRoutes =
  require("./routes/user.route");

const productRoutes =
  require("./routes/product.route");

const productOptionRoutes =
  require(
    "./routes/productOption.route"
  );

const productVariantRoutes =
  require(
    "./routes/productVariant.route"
  );

const orderRoutes =
  require(
    "./routes/order.route.js"
  );

const emailRoutes =
  require(
    "./routes/email.route.js"
  );

const categoryRoutes =
  require(
    "./routes/category.route"
  );
  const productDeliveryRateRoutes =
  require(
    "./routes/productDeliveryRate.route"
  );
  const productReviewRoutes = require("./routes/productReview.route");

  const couponRoutes = require("./routes/coupon.route");
const paymentRoutes = require("./routes/payment.route");
const analyticsRoutes = require("./routes/analytics.route");

app.use(
  "/api/users",
  userRoutes
);

app.use(
  "/api/products",
  productRoutes
);

app.use("/api/reviews", productReviewRoutes);
app.use(
  "/api/products",
  productDeliveryRateRoutes
);
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);

app.use("/api/admin/analytics", analyticsRoutes);



app.use(
  "/api/categories",
  categoryRoutes
);

app.use(
  "/api/products",
  productOptionRoutes
);

app.use(
  "/api/products",
  productVariantRoutes
);

app.use(
  "/api/orders",
  orderRoutes
);

app.use(
  "/api/email",
  emailRoutes
);

/*
 * ----------------------------------------
 * Health Check
 * ----------------------------------------
 */

app.get("/", (req, res) => {
  res.status(200).json({
    message:
      "ShopEase API is running",
  });
});

/*
 * ----------------------------------------
 * 404 Handler
 * ----------------------------------------
 */

app.use((req, res) => {
  res.status(404).json({
    message:
      "Route not found",
  });
});

/*
 * ----------------------------------------
 * Global Error Handler
 * ----------------------------------------
 */

app.use(
  (err, req, res, next) => {
    console.error(
      "Server error:",
      err
    );

    res
      .status(
        err.status || 500
      )
      .json({
        message:
          process.env.NODE_ENV ===
          "production"
            ? "Internal server error"
            : err.message ||
              "Internal server error",
      });
  }
);

/*
 * ----------------------------------------
 * Database + Server
 * ----------------------------------------
 */

async function startServer() {
  try {
    if (
      !process.env.MONGODB_URI
    ) {
      throw new Error(
        "MONGODB_URI is not configured"
      );
    }

    if (
      !process.env.JWT_SECRET
    ) {
      throw new Error(
        "JWT_SECRET is not configured"
      );
    }

    await mongoose.connect(
      process.env.MONGODB_URI
    );

    console.log(
      "Connected to MongoDB"
    );

    app.listen(
      PORT,
      () => {
        console.log(
          `ShopEase API running on port ${PORT}`
        );
      }
    );
  } catch (error) {
    console.error(
      "Failed to start server:",
      error.message
    );

    process.exit(1);
  }
}

startServer();