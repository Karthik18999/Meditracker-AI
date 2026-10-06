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
      req.targetUserId = currentUser._id;

      // Transparently route patient/grandpa & doctor requests to the linked household/patient targetUserId
      if ((currentUser.role === 'patient' || currentUser.role === 'grandpa') && currentUser.familyEmail) {
        const familyUser = await User.findOne({ email: currentUser.familyEmail.toLowerCase().trim() });
        if (familyUser) {
          req.patientUser = currentUser;
          req.grandpaUser = currentUser;
          req.targetUserId = familyUser._id;
        }
      } else if (currentUser.role === 'doctor') {
        let targetUser = null;
        if (currentUser.patientEmail) {
          targetUser = await User.findOne({ email: currentUser.patientEmail.toLowerCase().trim() });
        }
        if (!targetUser && currentUser.familyEmail) {
          targetUser = await User.findOne({ email: currentUser.familyEmail.toLowerCase().trim() });
        }

        if (targetUser) {
          req.doctorUser = currentUser;
          if ((targetUser.role === 'patient' || targetUser.role === 'grandpa') && targetUser.familyEmail) {
            const familyUser = await User.findOne({ email: targetUser.familyEmail.toLowerCase().trim() });
            if (familyUser) {
              req.targetUserId = familyUser._id;
            } else {
              req.targetUserId = targetUser._id;
            }
          } else {
            req.targetUserId = targetUser._id;
          }
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
