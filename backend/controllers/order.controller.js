// backend/controllers/orderController.js
const Order = require('../models/order.model.js');
const Product = require('../models/product.model.js');
const sendEmail = require('../utils/sendEmail.js');

// Create new order
exports.createOrder = async (req, res) => {
    try {
        const {
            name,
            email,
            phoneNumber,
            province,
            city,
            address,
            postalCode,
            paymentMethod,
            quantity
        } = req.body;
        
        const { productId } = req.params;
        
        // Get product details
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        // Calculate subtotal
        const subtotal = product.price * quantity;
        
        // Create order
        const order = await Order.create({
            name,
            email,
            phoneNumber,
            province,
            city,
            address,
            postalCode,
            paymentMethod,
            quantity,
            subtotal,
            product: productId,
            status: 'pending'
        });
        
        // Populate product details
        const populatedOrder = await Order.findById(order._id).populate('product', 'name price images');
        
        // Send confirmation email to customer
        await sendCustomerOrderEmail(populatedOrder, product);
        
        // Send notification email to admin
        await sendAdminOrderNotification(populatedOrder, product);
        
        res.status(201).json({
            success: true,
            message: 'Order placed successfully!',
            order: populatedOrder
        });
        
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get all orders (admin only)
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('product', 'name price images')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single order by ID
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('product', 'name price images');
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update order status (admin only)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        order.status = status;
        await order.save();
        
        // Send status update email to customer
        await sendOrderStatusEmail(order);
        
        res.json({ success: true, message: 'Order status updated', order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Send order confirmation email to customer
const sendCustomerOrderEmail = async (order, product) => {
    const productImage = product.images && product.images.length > 0 
        ? `http://localhost:5000/${product.images[0].replace(/\\/g, '/')}`
        : 'https://via.placeholder.com/100';
    
    const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">ShopEase</h1>
                <p style="color: white; opacity: 0.9; margin-top: 10px;">Order Confirmation</p>
            </div>
            
            <div style="padding: 30px; background: white;">
                <h2 style="color: #333; margin-top: 0;">Thank you for your order, ${order.name}!</h2>
                <p style="color: #666;">Your order has been placed successfully. Here are the details:</p>
                
                <div style="background: #f3f4f6; border-radius: 10px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #333; margin-top: 0;">Order Details</h3>
                    <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                    <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
                    <p><strong>Status:</strong> ${order.status}</p>
                </div>
                
                <div style="background: #f3f4f6; border-radius: 10px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #333; margin-top: 0;">Product Details</h3>
                    <div style="display: flex; gap: 15px; align-items: center;">
                        <img src="${productImage}" alt="${product.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">
                        <div>
                            <p><strong>${product.name}</strong></p>
                            <p>Quantity: ${order.quantity}</p>
                            <p>Price: $${product.price.toFixed(2)}</p>
                        </div>
                    </div>
                    <p style="margin-top: 15px;"><strong>Subtotal:</strong> $${order.subtotal.toFixed(2)}</p>
                </div>
                
                <div style="background: #f3f4f6; border-radius: 10px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #333; margin-top: 0;">Shipping Address</h3>
                    <p>${order.name}</p>
                    <p>${order.address}</p>
                    <p>${order.city}, ${order.province}</p>
                    <p>Postal Code: ${order.postalCode}</p>
                    <p>Phone: ${order.phoneNumber}</p>
                </div>
                
                <div style="background: #f3f4f6; border-radius: 10px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #333; margin-top: 0;">Payment Method</h3>
                    <p>${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Credit/Debit Card'}</p>
                </div>
                
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
                
                <p style="color: #666; font-size: 14px;">We'll notify you once your order is shipped.</p>
                <p style="color: #666; font-size: 14px;">Thank you for shopping with ShopEase!</p>
            </div>
            
            <div style="padding: 20px; text-align: center; background: #f3f4f6;">
                <p style="color: #999; font-size: 12px;">&copy; ${new Date().getFullYear()} ShopEase. All rights reserved.</p>
            </div>
        </div>
    `;
    
    await sendEmail({
        email: order.email,
        subject: `Order Confirmation - ${order.orderNumber}`,
        html: emailHtml
    });
};

// Send admin notification email
const sendAdminOrderNotification = async (order, product) => {
    const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>New Order Received!</h2>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Customer:</strong> ${order.name}</p>
            <p><strong>Email:</strong> ${order.email}</p>
            <p><strong>Phone:</strong> ${order.phoneNumber}</p>
            <p><strong>Product:</strong> ${product.name}</p>
            <p><strong>Quantity:</strong> ${order.quantity}</p>
            <p><strong>Total:</strong> $${order.subtotal.toFixed(2)}</p>
            <p><strong>Payment Method:</strong> ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card'}</p>
            <p><strong>Shipping Address:</strong> ${order.address}, ${order.city}, ${order.province}</p>
            <a href="${process.env.FRONTEND_URL}/admin/orders/${order._id}" style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Order</a>
        </div>
    `;
    
    await sendEmail({
        email: process.env.ADMIN_EMAIL || 'admin@shopease.com',
        subject: `New Order - ${order.orderNumber}`,
        html: emailHtml
    });
};

// Send order status update email
const sendOrderStatusEmail = async (order) => {
    const statusMessages = {
        confirmed: 'Your order has been confirmed!',
        processing: 'Your order is being processed.',
        shipped: 'Your order has been shipped!',
        delivered: 'Your order has been delivered. Enjoy your purchase!',
        cancelled: 'Your order has been cancelled.'
    };
    
    const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                <h1 style="color: white;">ShopEase</h1>
            </div>
            <div style="padding: 30px;">
                <h2>Order Status Update</h2>
                <p>Dear ${order.name},</p>
                <p>${statusMessages[order.status] || `Your order status has been updated to: ${order.status}`}</p>
                <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p><strong>Status:</strong> ${order.status}</p>
                <a href="${process.env.FRONTEND_URL}/track-order/${order._id}" style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Track Order</a>
            </div>
        </div>
    `;
    
    await sendEmail({
        email: order.email,
        subject: `Order Status Update - ${order.orderNumber}`,
        html: emailHtml
    });
};