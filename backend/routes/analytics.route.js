// backend/routes/analytics.route.js

const express = require("express");
const { protect, admin } = require("../middleware/authMiddleware");
const {
  getAdminAnalytics,
} = require("../controllers/analytics.controller.js");

const router = express.Router();

router.get("/", protect, admin, getAdminAnalytics);

module.exports = router;