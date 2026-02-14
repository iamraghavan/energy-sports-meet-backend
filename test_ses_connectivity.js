const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
    console.log('Testing Email with SES...');
    console.log('Host:', process.env.SMTP_HOST);
    console.log('From:', process.env.SMTP_FROM);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: 465,
        secure: true, // SMTPS
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        debug: true,
        logger: true
    });

    const recipients = ['raghavan@egspec.org', 'raghavanofficials@gmail.com'];

    for (const to of recipients) {
        try {
            console.log(`\n--- Sending to ${to} ---`);
            const info = await transporter.sendMail({
                from: `"Energy Sports Meet" <${process.env.SMTP_FROM}>`,
                to: to,
                subject: 'SES Final Verification Test',
                text: 'If you receive this, your Amazon SES SMTP configuration is fully working.',
                html: '<b>If you receive this, your Amazon SES SMTP configuration is fully working.</b>'
            });
            console.log(`✅ Success for ${to}! Message ID:`, info.messageId);
        } catch (error) {
            console.error(`❌ Failed for ${to}:`, error.message);
        }
    }
}

testEmail();
