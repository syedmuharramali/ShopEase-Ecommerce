// backend/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductByName
} = require('../controllers/product.controller.js');

// Public routes
router.get('/', getProducts);
router.get('/:id', getProductById);
router.get('/searchByName/:name',getProductByName);

// Admin only routes
router.post('/', protect, admin, upload.array("images"), createProduct);
router.put('/:id', protect, admin, upload.array("images"), updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;