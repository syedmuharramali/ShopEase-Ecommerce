// backend/controllers/emailController.js
const sendEmail = require("../utils/sendEmail.js")
const Product = require("../models/product.model.js")

exports.sendProductInfo = async (req, res) => {
  try {
    const { name, email, productId } = req.body;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">ShopEase</h1>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #333;">Hello ${name}!</h2>
          <p style="color: #666; line-height: 1.6;">Thank you for your interest in our product. Here are the details:</p>
          
          <div style="background: white; border-radius: 10px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #667eea; margin-top: 0;">${product.name}</h3>
            <p style="color: #666;">${product.description}</p>
            <p style="font-size: 24px; color: #667eea; font-weight: bold;">$${product.price}</p>
            <p style="color: #999; font-size: 14px;">Category: ${product.category}</p>
          </div>
          
          <a href="${process.env.FRONTEND_URL}/product/${product._id}" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 10px;">
            View Product
          </a>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            This email was sent to ${email}. You requested information about this product.
          </p>
        </div>
      </div>
    `;
    
    await sendEmail({
      email: email,
      subject: `Product Information: ${product.name}`,
      html: emailHtml
    });
    
    res.json({ message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ message: 'Failed to send email' });
  }
};