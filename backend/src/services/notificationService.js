const nodemailer = require('nodemailer');
const https = require('https');

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
    console.log(`[Notification Service] Initialized Pooled SMTP Transporter (${emailHost}:${emailPort}) for ${brevoUser}`);
    return nodemailer.createTransport({
      host: emailHost,
      port: Number(emailPort),
      secure: Number(emailPort) === 465,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
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

// Brevo REST API Helper (with 3-second fast timeout)
const sendViaBrevoAPI = (to, subject, text, html) => {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.BREVO_KEY || process.env.BREVO_API_KEY || process.env.EMAIL_PASS;
    const senderEmail = process.env.BREVO_USER || process.env.EMAIL_USER || 'karthikchitikela187@gmail.com';
    const payload = JSON.stringify({
      sender: { name: 'MediTracker AI', email: senderEmail },
      to: [{ email: to }],
      subject: subject,
      htmlContent: html || `<p>${text}</p>`,
    });

    const req = https.request({
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      timeout: 3000,
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(payload),
      },
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve({ messageId: 'brevo-success' });
          }
        } else {
          reject(new Error(`Brevo API Error (${res.statusCode}): ${body}`));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Brevo REST API request timed out'));
    });

    req.on('error', err => reject(err));
    req.write(payload);
    req.end();
  });
};

/**
 * Sends an email notification
 */
const sendEmail = async (to, subject, text, html) => {
  const brevoKey = process.env.BREVO_KEY || process.env.BREVO_API_KEY;
  
  // Use Brevo REST API only if key is an API v3 key (starts with 'xkeysib-')
  if (brevoKey && brevoKey.startsWith('xkeysib-')) {
    try {
      return await sendViaBrevoAPI(to, subject, text, html);
    } catch (apiError) {
      console.warn('[Notification Service] Brevo REST API attempt failed, falling back to SMTP:', apiError.message);
    }
  }

  // Use Nodemailer SMTP Transporter (supports 'xsmtpsib-' SMTP Relay keys, Gmail, etc.)
  try {
    if (!transporter) {
      transporter = createTransporter();
    }
    const fromAddress = process.env.EMAIL_FROM || process.env.BREVO_USER || process.env.EMAIL_USER || 'karthikchitikela187@gmail.com';
    const info = await transporter.sendMail({
      from: `"MediTracker AI" <${fromAddress}>`,
      to,
      subject,
      text,
      html: html || text,
    });
    console.log(`[Notification Service] Email successfully sent to ${to} (MessageID: ${info.messageId})`);
    return info;
  } catch (error) {
    console.error(`[Notification Service] SMTP dispatch error to ${to}:`, error.message);
    return { error: error.message };
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
