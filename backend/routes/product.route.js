const express = require("express");
const mongoose = require("mongoose");

const {
  getProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminProducts,
  getAdminProductById,
} = require("../controllers/product.controller");

const {
  protect,
  admin,
  allowAdminProductRead,
} = require("../middleware/authMiddleware");
const {
  optimizeProductImages,
} = require("../middleware/optimizeProductImages");

const upload = require(
  "../middleware/uploadMiddleware.js"
);

const router = express.Router();
const optimizeStorefrontImages = optimizeProductImages({ maxWidth: 1440 });
const optimizeStorefrontList = optimizeProductImages({
  maxWidth: 960,
  stripVariants: true,
});

const cachePublicStorefrontList = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      // Product prices and stock are always checked again by the ordering APIs.
      // A short browser/edge cache makes repeat storefront visits much faster
      // without allowing stale client values to decide the final order total.
      res.set(
        "Cache-Control",
        "public, max-age=30, s-maxage=60, stale-while-revalidate=120"
      );
    } else {
      res.set("Cache-Control", "no-store");
    }

    return originalJson(body);
  };

  next();
};

/*
 * Reject malformed MongoDB product IDs before they reach Mongoose.
 * This applies to every route in this router that uses the :id parameter,
 * including public product detail and protected admin update/archive routes.
 */
router.param("id", (req, res, next, id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      message: "Invalid product ID",
    });
  }

  return next();
});

router.get("/", cachePublicStorefrontList, optimizeStorefrontList, getProducts);

router.get(
  "/slug/:slug",
  optimizeStorefrontImages,
  getProductBySlug
);
router.get(
  "/admin/catalog",
  protect,
  admin,
  getAdminProducts
);

router.get(
  "/admin/:id",
  protect,
  admin,
  getAdminProductById
);
router.get(
  "/:id",
  allowAdminProductRead,
  optimizeStorefrontImages,
  getProductById
);

router.post(
  "/",
  protect,
  admin,
  upload.array("images", 8),
  createProduct
);

router.patch(
  "/:id",
  protect,
  admin,
  upload.array("images", 8),
  updateProduct
);

router.delete(
  "/:id",
  protect,
  admin,
  deleteProduct
);

module.exports = router;
