const express = require("express");

const {
  getCategories,
  createCategory,
  updateCategory,
  archiveCategory,
} = require("../controllers/category.controller");

const {
  protect,
  admin,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getCategories);

router.post(
  "/",
  protect,
  admin,
  createCategory
);

router.patch(
  "/:id",
  protect,
  admin,
  updateCategory
);

router.delete(
  "/:id",
  protect,
  admin,
  archiveCategory
);

module.exports = router;