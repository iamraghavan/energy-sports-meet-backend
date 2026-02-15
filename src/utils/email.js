const nodemailer = require('nodemailer');
const { SESClient, SendRawEmailCommand } = require('@aws-sdk/client-ses');
require('dotenv').config();

// Initialize SES Client (standard v3)
const ses = new SESClient({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.SMTP_USER,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.SMTP_PASS
    }
});

console.log(`[${new Date().toISOString()}] MAIL_INIT: Using AWS SES API (Standard V3)`);

// Pass SendRawEmailCommand in the 'aws' property so Nodemailer knows how to use it
const transporter = nodemailer.createTransport({
    SES: { ses, aws: { SendRawEmailCommand } }
});

/**
 * Send professional multipart email
 * @param {Object} options - { to, subject, text, html, attachments }
 */
exports.sendEmail = async ({ to, subject, text, html, attachments = [] }) => {
    try {
        const mailOptions = {
            from: {
                name: 'Energy Sports Meet 2026',
                address: process.env.SMTP_FROM || process.env.SMTP_USER
            },
            to,
            subject,
            text, // fallback plain text
            html, // professional html
            attachments,
            // Header for List-Unsubscribe (Standard practice)
            list: {
                unsubscribe: {
                    url: 'https://energy.egspgroup.in/unsubscribe',
                    comment: 'Unsubscribe from Energy Sports Meet updates'
                }
            }
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        throw error;
    }
};
