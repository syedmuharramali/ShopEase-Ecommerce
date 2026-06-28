// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/user.route.js');
const productRoutes = require('./routes/product.route.js');
const emailRoutes = require('./routes/email.route.js');
const orderRoutes=require("./routes/order.route.js")
const {createDefaultAdmin}=require("./controllers/user.controller.js")


const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/email', emailRoutes);
app.use("/api/order",orderRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async() => {
    console.log('Connected to MongoDB');
    await createDefaultAdmin();
  })
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});