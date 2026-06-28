// backend/controllers/authController.js
const User=require("../models/user.model.js")
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

const generateCode=()=>{
  let code;
  let number=()=>{
    return Math.floor(Math.random()*9)+1
  };
  code=`${number()} ${number()} ${number()} ${number()}`
  return code;
}

// Admin Login
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (user && await user.matchPassword(password)) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create default admin (run once)
exports.createDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({ email: 'aleehuccaini@gmail.com' });
    if (!adminExists) {
      await User.create({
        name: 'Syed Muharram Ali',
        email: 'aleehuccaini@gmail.com',
        password: 'Admin123!',
        role: 'admin'
      });
      console.log('Default admin created');
    }
  } catch (error) {
    console.error('Error creating admin:', error);
  }
};

exports.resetPassword=async(req,res)=>{
  const {email}=req.query;

  // const user=await User.findOne({email})
  // if(!user){
  //   res.status(400).json({message:"User doesn't exists"});
  // }
  let code=generateCode()
  res.status(200).json({code});
}
