const { sendEmail } = require('../src/utils/email');
const { getRegistrationReceiptTemplate } = require('../src/utils/emailTemplates');

async function testMail() {
    console.log('🚀 Starting Mail Test...');

    const testData = {
        name: 'Raghavan Jeeva',
        sportName: 'Badminton & Chess',
        regCode: 'REG-TEST-2026-XYZ'
    };

    const template = getRegistrationReceiptTemplate(testData);
    const recipients = [
        'raghavanofficials@gmail.com',
        'test-ww56tdo2d@srv1.mail-tester.com'
    ];

    for (const to of recipients) {
        try {
            console.log(`Sending to: ${to}...`);
            await sendEmail({
                to,
                subject: '🚨 Test: Energy Sports Meet 2026 Registration Receipt',
                text: template.text,
                html: template.html
            });
            console.log(`✅ Successfully sent to ${to}`);
        } catch (error) {
            console.error(`❌ Failed to send to ${to}:`, error.message);
        }
    }

    console.log('✨ Mail test finished.');
}

testMail();
