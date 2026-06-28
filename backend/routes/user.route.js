// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { loginAdmin, resetPassword } = require('../controllers/user.controller.js');

router.post('/login', loginAdmin);
router.get('/getCode/:email',resetPassword)
module.exports = router;