const { sendEmail } = require('../src/utils/email');
const logger = require('../src/utils/logger');
require('dotenv').config();

const testEmail = async () => {
    try {
        console.log('🚀 Starting Email Test...');
        console.log(`Using AWS Region: ${process.env.AWS_REGION}`);
        console.log(`Sending from: ${process.env.SMTP_FROM}`);

        const targetEmail = 'raghavanofficials@gmail.com';

        const info = await sendEmail({
            to: targetEmail,
            subject: 'Manual Test: Energy Sports Meet SES Integration',
            text: 'This is a manual test to verify the AWS SES API integration from the local environment.',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
                    <h2 style="color: #0056b3;">SES API Test Success!</h2>
                    <p>If you received this email, the <strong>@aws-sdk/client-ses</strong> integration is working correctly.</p>
                    <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
                    <p><strong>Region:</strong> ${process.env.AWS_REGION}</p>
                </div>
            `
        });

        console.log('✅ Test Email Sent Successfully!');
        console.log('Message ID:', info.messageId);
        process.exit(0);
    } catch (error) {
        console.error('❌ Test Email Failed:', error);
        process.exit(1);
    }
};

testEmail();
