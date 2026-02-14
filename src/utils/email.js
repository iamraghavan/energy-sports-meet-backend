const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('--- Initializing Email Utility ---');
console.log('SMTP Host:', process.env.SMTP_HOST || 'NOT SET');
console.log('SMTP Port:', process.env.SMTP_PORT || '587');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // Use STARTTLS for 587
    pool: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    // Increase timeouts to prevent "Connection timeout" on slow networks
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
    // CRITICAL: Force IPv4 to prevent ENETUNREACH/IPv6 errors on some servers
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
