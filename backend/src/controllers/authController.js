const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../services/notificationService');

// In-memory store for pending verification codes: Map<email, { code, expires }>
const pendingVerifications = new Map();

// Helper to sign JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'meditracker_super_secret_jwt_key_12345', {
    expiresIn: '30d',
  });
};

/**
 * @desc    Send 6-digit email OTP verification code
 * @route   POST /api/auth/send-otp
 * @access  Public
 */
const sendOTP = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email address is required.' });
  }

  try {
    const cleanEmail = email.toLowerCase().trim();
    const userExists = await User.findOne({ email: cleanEmail });

    if (userExists && userExists.isVerified) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists. Please log in.' });
    }

    // Generate 6-digit random numeric OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // Code expires in 10 minutes

    pendingVerifications.set(cleanEmail, { code, expires });

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #059669; text-align: center; margin-bottom: 20px;">MediTracker AI Verification</h2>
        <p style="font-size: 15px; color: #334155;">Hello,</p>
        <p style="font-size: 15px; color: #334155;">Thank you for signing up for MediTracker AI. Use the verification code below to complete your account setup:</p>
        <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 18px; text-align: center; border-radius: 12px; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #059669;">${code}</span>
        </div>
        <p style="font-size: 13px; color: #64748b;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
      </div>
    `;

    // Dispatch email asynchronously in background so response is instantaneous (<50ms)
    sendEmail(
      cleanEmail,
      'MediTracker AI - Verification Code',
      `Your MediTracker AI verification code is: ${code}`,
      htmlBody
    ).catch(err => console.error('[Notification Service] Background OTP dispatch error:', err.message));

    res.status(200).json({
      success: true,
      message: `Verification code sent to ${cleanEmail}. Please check your inbox or spam folder.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify 6-digit OTP code
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOTP = async (req, res, next) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ success: false, message: 'Email and verification code are required.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = code.toString().trim();

  const record = pendingVerifications.get(cleanEmail);

  if (!record) {
    return res.status(400).json({ success: false, message: 'No verification code found for this email. Please request a code.' });
  }

  if (Date.now() > record.expires) {
    pendingVerifications.delete(cleanEmail);
    return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new code.' });
  }

  if (record.code !== cleanCode) {
    return res.status(400).json({ success: false, message: 'Incorrect verification code. Please check and try again.' });
  }

  res.status(200).json({
    success: true,
    message: 'Email verified successfully.',
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res, next) => {
  const { name, email, password, role, familyEmail, patientEmail } = req.body;

  try {
    const cleanEmail = email.toLowerCase().trim();
    const userExists = await User.findOne({ email: cleanEmail });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists. Please log in.' });
    }

    const user = await User.create({
      name,
      email: cleanEmail,
      password,
      role: role || 'family',
      familyEmail: (role === 'patient' || role === 'grandpa') ? familyEmail : undefined,
      patientEmail: role === 'doctor' ? patientEmail : undefined,
      isVerified: true,
    });

    const targetUserId = await resolveTargetUserId(user);

    res.status(201).json({
      success: true,
      token: signToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        familyEmail: user.familyEmail,
        patientEmail: user.patientEmail,
        targetUserId,
      },
    });
  } catch (error) {
    next(error);
  }
};

const resolveTargetUserId = async (user) => {
  if (!user) return null;
  if ((user.role === 'patient' || user.role === 'grandpa') && user.familyEmail) {
    const familyUser = await User.findOne({ email: user.familyEmail.toLowerCase().trim() });
    if (familyUser) return familyUser._id;
  } else if (user.role === 'doctor') {
    let targetUser = null;
    if (user.patientEmail) {
      targetUser = await User.findOne({ email: user.patientEmail.toLowerCase().trim() });
    }
    if (!targetUser && user.familyEmail) {
      targetUser = await User.findOne({ email: user.familyEmail.toLowerCase().trim() });
    }
    if (targetUser) {
      if ((targetUser.role === 'patient' || targetUser.role === 'grandpa') && targetUser.familyEmail) {
        const familyUser = await User.findOne({ email: targetUser.familyEmail.toLowerCase().trim() });
        if (familyUser) return familyUser._id;
      }
      return targetUser._id;
    }
  }
  return user._id;
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const targetUserId = await resolveTargetUserId(user);

    res.status(200).json({
      success: true,
      token: signToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        familyEmail: user.familyEmail,
        patientEmail: user.patientEmail,
        targetUserId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        familyEmail: req.user.familyEmail,
        patientEmail: req.user.patientEmail,
        targetUserId: req.targetUserId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate or Register via Google OAuth
 * @route   POST /api/auth/google
 * @access  Public
 */
const googleAuth = async (req, res, next) => {
  const { email, name, googleId, role, familyEmail, patientEmail, isRegister } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Google email address is required.' });
  }

  try {
    const cleanEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail });

    if (!user) {
      if (isRegister === false && !role) {
        return res.status(404).json({
          success: false,
          code: 'ACCOUNT_NOT_FOUND',
          message: 'No account found with this Google email. Please complete registration below.',
        });
      }

      // New user registering via Google
      const randomPassword = Math.random().toString(36).slice(-10) + 'G1!';
      user = await User.create({
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        password: randomPassword,
        role: role || 'family',
        familyEmail: (role === 'patient' || role === 'grandpa') ? familyEmail : undefined,
        patientEmail: role === 'doctor' ? patientEmail : undefined,
        isVerified: true,
        googleId,
      });
    } else {
      // Existing user logging in via Google
      if (googleId && !user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    }

    const targetUserId = await resolveTargetUserId(user);

    res.status(200).json({
      success: true,
      token: signToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        familyEmail: user.familyEmail,
        patientEmail: user.patientEmail,
        targetUserId,
      },
    });
  } catch (error) {
    next(error);
  }
};

// In-memory store for password reset codes: Map<email, { code, expires }>
const resetPasswordVerifications = new Map();

/**
 * @desc    Send password reset OTP verification code
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email address is required.' });
  }

  try {
    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address.',
      });
    }

    // Generate 6-digit random numeric OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // Code expires in 10 minutes

    resetPasswordVerifications.set(cleanEmail, { code, expires });

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #059669; text-align: center; margin-bottom: 20px;">MediTracker AI Password Reset</h2>
        <p style="font-size: 15px; color: #334155;">Hello ${user.name},</p>
        <p style="font-size: 15px; color: #334155;">We received a request to reset your password. Use the verification code below to set a new password:</p>
        <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 18px; text-align: center; border-radius: 12px; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #059669;">${code}</span>
        </div>
        <p style="font-size: 13px; color: #64748b;">This code will expire in 10 minutes. If you did not request a password reset, please ignore this email.</p>
      </div>
    `;

    const isMock = (!process.env.BREVO_KEY && !process.env.BREVO_API_KEY && !process.env.EMAIL_PASS && !process.env.EMAIL_USER);

    // Dispatch email asynchronously in background
    sendEmail(
      cleanEmail,
      'MediTracker AI - Password Reset Code',
      `Your MediTracker AI password reset code is: ${code}`,
      htmlBody
    ).catch(err => console.error('[Notification Service] Password reset OTP error:', err.message));

    res.status(200).json({
      success: true,
      message: `Password reset code sent to ${cleanEmail}. Please check your inbox.`,
      devCode: isMock ? code : undefined,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password using 6-digit verification code
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ success: false, message: 'Email, verification code, and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
  }

  try {
    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.toString().trim();

    const record = resetPasswordVerifications.get(cleanEmail);

    if (!record) {
      return res.status(400).json({ success: false, message: 'No reset request found for this email. Please request a new code.' });
    }

    if (Date.now() > record.expires) {
      resetPasswordVerifications.delete(cleanEmail);
      return res.status(400).json({ success: false, message: 'Reset code has expired. Please request a new code.' });
    }

    if (record.code !== cleanCode) {
      return res.status(400).json({ success: false, message: 'Incorrect verification code. Please check and try again.' });
    }

    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Clear reset record
    resetPasswordVerifications.delete(cleanEmail);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  registerUser,
  loginUser,
  googleAuth,
  getMe,
  forgotPassword,
  resetPassword,
};
