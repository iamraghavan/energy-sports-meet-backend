const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    // Force IPv4 as some clouds (Render) have IPv6 routing issues with Gmail SMTP
    family: 4,
    // Deliverability Headers
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
                address: process.env.SMTP_USER
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
