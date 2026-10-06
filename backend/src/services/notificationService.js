const nodemailer = require('nodemailer');

// Set up email transporter
let transporter;

const createTransporter = () => {
  const brevoUser = process.env.BREVO_USER || process.env.EMAIL_USER;
  const brevoKey = process.env.BREVO_KEY || process.env.BREVO_API_KEY || process.env.EMAIL_PASS;
  
  // Detect if Brevo is configured or requested
  const isBrevo = process.env.EMAIL_SERVICE === 'brevo' || !!process.env.BREVO_USER || !!process.env.BREVO_KEY || !!process.env.BREVO_API_KEY;
  const emailHost = process.env.EMAIL_HOST || (isBrevo ? 'smtp-relay.brevo.com' : null);
  const emailPort = process.env.EMAIL_PORT || 587;

  if (emailHost && brevoUser && brevoKey && brevoUser !== 'test@example.com') {
    console.log(`[Notification Service] Initialized Brevo/SMTP Transporter (${emailHost}:${emailPort}) for ${brevoUser}`);
    return nodemailer.createTransport({
      host: emailHost,
      port: Number(emailPort),
      secure: Number(emailPort) === 465,
      auth: {
        user: brevoUser,
        pass: brevoKey,
      },
    });
  } else if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_USER !== 'test@example.com') {
    // Gmail or custom service fallback
    console.log(`[Notification Service] Initialized Transporter via ${process.env.EMAIL_SERVICE || 'gmail'}`);
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    // Mock transporter for local development / testing without SMTP configured
    console.log('[Notification Service] Initialized Mock Transporter (Dev mode active).');
    return {
      sendMail: async (mailOptions) => {
        console.log('\n========================================');
        console.log('--- [MOCK EMAIL DISPATCHED] ---');
        console.log(`TO:      ${mailOptions.to}`);
        console.log(`SUBJECT: ${mailOptions.subject}`);
        console.log(`BODY:\n${mailOptions.text}`);
        console.log('========================================\n');
        return { messageId: 'mock-id-' + Date.now() };
      }
    };
  }
};

try {
  transporter = createTransporter();
  console.log('[Notification Service] Transporter configured successfully.');
} catch (error) {
  console.error('[Notification Service] Failed to initialize nodemailer:', error.message);
}

/**
 * Sends an email notification
 */
const sendEmail = async (to, subject, text, html) => {
  try {
    if (!transporter) {
      transporter = createTransporter();
    }
    const fromAddress = process.env.EMAIL_FROM || process.env.BREVO_USER || process.env.EMAIL_USER || 'no-reply@meditracker.ai';
    const info = await transporter.sendMail({
      from: `"MediTracker AI" <${fromAddress}>`,
      to,
      subject,
      text,
      html: html || text,
    });
    return info;
  } catch (error) {
    console.error(`[Notification Service] Error sending email to ${to}:`, error.message);
    throw error;
  }
};

/**
 * Sends an SMS notification (Simulated)
 */
const sendSMS = async (phoneNumber, message) => {
  try {
    console.log('\n--- [MOCK SMS SENT] ---');
    console.log(`Phone: ${phoneNumber}`);
    console.log(`Message: ${message}`);
    console.log('------------------------\n');
  } catch (error) {
    console.error(`Error sending SMS to ${phoneNumber}:`, error.message);
  }
};

module.exports = {
  sendEmail,
  sendSMS,
};
