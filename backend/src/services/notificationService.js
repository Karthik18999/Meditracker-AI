const nodemailer = require('nodemailer');

// Set up email transporter
let transporter;

try {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_USER !== 'test@example.com') {
    transporter = nodemailer.createTransport({
      service: 'gmail', // or custom SMTP
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    console.log('Email Transporter Initialized with production settings.');
  } else {
    // Mock transporter for development/testing
    transporter = {
      sendMail: async (mailOptions) => {
        console.log('\n--- [MOCK EMAIL SENT] ---');
        console.log(`To: ${mailOptions.to}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`Body: ${mailOptions.text}`);
        console.log('-------------------------\n');
        return { messageId: 'mock-id-' + Date.now() };
      }
    };
    console.log('Email Transporter Initialized with Mock service.');
  }
} catch (error) {
  console.error('Failed to initialize nodemailer:', error.message);
}

/**
 * Sends an email notification
 */
const sendEmail = async (to, subject, text, html) => {
  try {
    if (!transporter) {
      console.warn('Email transporter not initialized. Printing to console:');
      console.log(`TO: ${to}, SUBJ: ${subject}, MSG: ${text}`);
      return;
    }
    await transporter.sendMail({
      from: `"MediTracker AI" <${process.env.EMAIL_USER || 'no-reply@meditracker.ai'}>`,
      to,
      subject,
      text,
      html: html || text,
    });
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error.message);
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
