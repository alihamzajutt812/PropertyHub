const { verifyToken } = require('../config/jwt'); // adjust as needed
const jwt = require('jsonwebtoken')
const User = require('../models/User')

const getUserFromToken = async (req) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      console.log('⚠️ No token found in cookies');
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) {
      console.log('⚠️ Token decoded but missing user ID');
      return null;
    }

    const user = await User.findById(decoded.id).select('name email role');
    return user;
  } catch (error) {
    console.log('❌ Token invalid or expired:', error.message);
    return null;
  }
};

module.exports = { getUserFromToken };