// backend/routes/emailRoutes.js
const express = require('express');
const router = express.Router();
const { sendProductInfo } = require('../controllers/email.controller.js');

router.post('/send-product-info', sendProductInfo);

module.exports = router;