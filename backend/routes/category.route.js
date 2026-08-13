const express = require("express");

const {
  getCategories,
  createCategory,
} = require(
  "../controllers/category.controller"
);

const {
  protect,
  admin,
} = require(
  "../middleware/authMiddleware"
);

const router = express.Router();

router.get(
  "/",
  getCategories
);

router.post(
  "/",
  protect,
  admin,
  createCategory
);

module.exports = router;