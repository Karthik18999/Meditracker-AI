const express = require('express');
const { sendOTP, verifyOTP, registerUser, loginUser, googleAuth, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuth);
router.get('/me', protect, getMe);

module.exports = router;
