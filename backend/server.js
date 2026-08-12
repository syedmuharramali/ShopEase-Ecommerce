const express = require("express");
const mongoose = require("mongoose");
const cors=require('cors');
const path = require("path");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 5000;

/*
 * ----------------------------------------
 * Middleware
 * ----------------------------------------
 */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors())
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

/*
 * ----------------------------------------
 * Routes
 * ----------------------------------------
 */

const userRoutes = require("./routes/user.route");
const productRoutes = require("./routes/product.route");
const productOptionRoutes = require(
  "./routes/productOption.route"
);
const productVariantRoutes = require(
  "./routes/productVariant.route"
);
const orderRoutes = require("./routes/order.route.js");

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use(
  "/api/products",
  productOptionRoutes
);
app.use(
  "/api/products",
  productVariantRoutes
);
app.use("/api/orders", orderRoutes);
/*
 * ----------------------------------------
 * Health Check
 * ----------------------------------------
 */

app.get("/", (req, res) => {
  res.status(200).json({
    message: "ShopEase API is running",
  });
});

/*
 * ----------------------------------------
 * 404 Handler
 * ----------------------------------------
 */

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

/*
 * ----------------------------------------
 * Global Error Handler
 * ----------------------------------------
 */

app.use((err, req, res, next) => {
  console.error("Server error:", err);

  res.status(err.status || 500).json({
    message:
      err.message || "Internal server error",
  });
});

/*
 * ----------------------------------------
 * Database + Server
 * ----------------------------------------
 */

async function startServer() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI
    );

    console.log("Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(
        `ShopEase API running on port ${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Failed to start server:",
      error
    );

    process.exit(1);
  }
}

startServer();
