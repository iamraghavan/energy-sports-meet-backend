const nodemailer = require('nodemailer');
const aws = require('@aws-sdk/client-sesv2');
require('dotenv').config();

// Initialize SES v2 Client
const ses = new aws.SESv2({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.SMTP_USER,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.SMTP_PASS
    }
});

console.log(`[${new Date().toISOString()}] MAIL_INIT: Using AWS SES v2 API (Region: ${process.env.AWS_REGION || 'ap-south-1'})`);
console.log(`[${new Date().toISOString()}] MAIL_INIT: Sending from ${process.env.SMTP_FROM}`);

const transporter = nodemailer.createTransport({
    SES: { ses, aws }
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
