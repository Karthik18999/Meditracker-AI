const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'meditracker_super_secret_jwt_key_12345');

      const currentUser = await User.findById(decoded.id).select('-password');
      if (!currentUser) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }

      req.user = currentUser;

      // Transparently route grandpa requests to the linked family account
      if (currentUser.role === 'grandpa' && currentUser.familyEmail) {
        const familyUser = await User.findOne({ email: currentUser.familyEmail });
        if (familyUser) {
          req.grandpaUser = currentUser;
          req.user._id = familyUser._id; // This also overrides req.user.id getter
        }
      }
      next();
    } catch (error) {
      console.error('JWT verification error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user ? req.user.role : 'none'}) is not authorized to access this route`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
