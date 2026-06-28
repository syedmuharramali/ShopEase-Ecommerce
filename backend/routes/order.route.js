// backend/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    createOrder,
    getAllOrders,
    getOrderById,
    updateOrderStatus
} = require('../controllers/order.controller.js');

// Public route - create order (no authentication needed)
router.post('/create/:productId', createOrder);

// Admin only routes
router.get('/', protect, admin, getAllOrders);
router.get('/:id', protect, admin, getOrderById);
router.put('/:id/status', protect, admin, updateOrderStatus);

module.exports = router;