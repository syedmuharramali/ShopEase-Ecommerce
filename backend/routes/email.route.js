// backend/routes/email.route.js
const express = require("express");
const router = express.Router();

const { sendProductInfo } = require("../controllers/email.controller.js");
const { sendContactMessage } = require("../controllers/contact.controller.js");

router.post("/send-product-info", sendProductInfo);
router.post("/contact", sendContactMessage);

module.exports = router;
