const nodemailer = require('nodemailer');

// Set up email transporter
let transporter;

const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const emailHost = process.env.EMAIL_HOST;
  const emailPort = process.env.EMAIL_PORT;

  if (emailHost && emailUser && emailPass) {
    // Custom SMTP server (SendGrid, Brevo, Mailgun, Amazon SES, Postmark, etc.)
    return nodemailer.createTransport({
      host: emailHost,
      port: Number(emailPort) || 587,
      secure: Number(emailPort) === 465,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
  } else if (emailUser && emailPass && emailUser !== 'test@example.com') {
    // Gmail or standard service
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
  } else {
    // Mock transporter for local development / testing without SMTP configured
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
    const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'no-reply@meditracker.ai';
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
