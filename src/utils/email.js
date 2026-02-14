const nodemailer = require('nodemailer');
require('dotenv').config();

console.log(`[${new Date().toISOString()}] MAIL_INIT: Connecting to ${process.env.SMTP_HOST}:${process.env.SMTP_PORT} (Secure: ${process.env.SMTP_SECURE})`);
console.log(`[${new Date().toISOString()}] MAIL_INIT: Sending from ${process.env.SMTP_FROM}`);

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465', // true for 465, false for other ports
    pool: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    // High timeouts for cloud environments like Render
    connectionTimeout: 20000, // 20 seconds
    greetingTimeout: 20000,
    socketTimeout: 30000,
    // Force IPv4 is essential to avoid Render's IPv6 networking quirks
    family: 4,
    headers: {
        'X-Entity-Ref-ID': 'energy-sports-meet-2026',
        'Precedence': 'bulk',
        'X-Auto-Response-Suppress': 'OOF, AutoReply'
    }
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
