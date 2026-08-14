const express = require("express");

const {
  loginAdmin,
} = require("../controllers/user.controller.js");

const router = express.Router();

/*
 * Admin authentication.
 *
 * Password-reset-code endpoint removed because the old
 * implementation exposed a generated code directly in
 * the HTTP response without verifying ownership of email.
 */
router.post(
  "/login",
  loginAdmin
);

module.exports = router;