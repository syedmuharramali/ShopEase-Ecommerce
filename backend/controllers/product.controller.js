// backend/controllers/productController.js
const Product = require('../models/product.model.js');
const path = require('path');
const fs = require('fs');

// Get all products (public)
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single product (public)
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getProductByName=async(req,res)=>{
  try {
    const {name}=req.query;
    const products=await Product.find({name});
    return res.status(200).json(products)
  } catch (error) {
    res.status(500).json({message:error.message})
  }
}

// Create product (admin only)
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, category } = req.body;
    
    let images = [];
    if (req.files) {
      images=req.files.map((image)=>`uploads/${image.filename}`)
    }
    
    const product = await Product.create({
      name,
      description,
      price,
      category,
      images,
      createdBy: req.user._id
    });
    
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  Update product (admin only)
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Update basic fields
    product.name = req.body.name || product.name;
    product.description = req.body.description || product.description;
    product.price = req.body.price || product.price;
    product.category = req.body.category || product.category;
    
    // Handle new images if uploaded
    if (req.files && req.files.length > 0) {
      // Delete old images from filesystem
      if (product.images && product.images.length > 0) {
        product.images.forEach((image) => {
          const oldImagePath = path.join(__dirname, '..', image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        });
      }
      
      // Add new images
      const newImages = req.files.map((image) => `uploads/${image.filename}`);
      product.images = newImages;
    }
    
    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete product (admin only)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Delete image
    if (product.images) {
      product.images.forEach((image)=>{
        const imagePath = path.join(__dirname, '..', image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
      })
    }
    
    await product.deleteOne();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};