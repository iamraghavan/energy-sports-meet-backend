const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Send email with attachment
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Email body text
 * @param {Array} attachments - Array of attachment objects { filename, content }
 */
exports.sendEmail = async (to, subject, text, attachments = []) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_USER, // sender address
            to, // list of receivers
            subject, // Subject line
            text, // plain text body
            attachments
        });
        console.log('Message sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};
