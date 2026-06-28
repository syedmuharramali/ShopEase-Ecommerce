// backend/models/order.model.js
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },
        subtotal: {
            type: Number,
            required: true,
            min: 0
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
        },
        phoneNumber: {
            type: String,
            required: true,
            match: [/^\d{10,15}$/, 'Please enter a valid phone number']
        },
        province: {
            type: String,
            required: true,
            enum: ['Punjab', 'KPK', 'Sindh', 'Balochistan', 'AJK', 'Gilgit Baltistan']
        },
        city: {
            type: String,
            required: true,
            trim: true
        },
        address: {
            type: String,
            required: true,
            trim: true
        },
        postalCode: {
            type: String,
            required: true,
            trim: true
        },
        paymentMethod: {
            type: String,
            enum: ['cod', 'card'],
            default: 'cod',
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
            default: 'pending'
        },
        orderNumber: {
            type: String,
            unique: true,
            sparse: true
        }
    },
    {
        timestamps: true
    }
);

// Generate order number before saving - USE REGULAR FUNCTION, NOT ARROW FUNCTION
orderSchema.pre('save', function(next) {
    const order = this;
    
    if (!order.orderNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        order.orderNumber = `ORD-${year}${month}${day}-${random}`;
    }
    
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;