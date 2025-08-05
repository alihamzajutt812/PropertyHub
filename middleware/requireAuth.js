const jwt = require('jsonwebtoken');
const User = require('../models/User'); // ✅ Make sure this path is correct

exports.requireAuth = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: 'Not logged in' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Fetch the full user from DB
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });

    req.user = user; // ✅ Now req.user._id and all fields are available
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

exports.requireRole = (role) => {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};