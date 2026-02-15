const { sendEmail } = require('../src/utils/email');
const {
    getOTPEmailTemplate,
    getRegistrationReceiptTemplate,
    getRegistrationApprovalTemplate,
    getRegistrationRejectionTemplate,
    getMatchScheduledTemplate,
    getMatchLiveTemplate,
    getMatchResultTemplate
} = require('../src/utils/emailTemplates');
require('dotenv').config();

const recipients = [
    'raghavanofficials@gmail.com',
    'test-ixgzvrfw9@srv1.mail-tester.com'
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const testEmails = async () => {
    console.log('🚀 Starting Comprehensive Email Template Test...');
    console.log(`📡 Sending to: ${recipients.join(', ')}`);

    // 1. OTP Email
    const otpData = '482910';
    await sendTestEmail('OTP Verification', getOTPEmailTemplate(otpData));

    // 2. Registration Receipt
    const receiptData = {
        name: 'Raghavan Jeeva',
        sportName: 'Cricket (Men)',
        regCode: 'EGSP-CRICKET-2026-X8Y9Z'
    };
    await sendTestEmail('Registration Receipt', getRegistrationReceiptTemplate(receiptData));

    // 3. Registration Approval
    const approvalData = {
        name: 'Raghavan Jeeva',
        sportName: 'Cricket (Men)',
        regCode: 'EGSP-CRICKET-2026-X8Y9Z'
    };
    // Note: In a real scenario, we'd attach a PDF. Here we just test the template.
    await sendTestEmail('Registration Approval', getRegistrationApprovalTemplate(approvalData));

    // 4. Registration Rejection
    const rejectionData = {
        name: 'Raghavan Jeeva',
        sportName: 'Football (Men)',
        reason: 'Uploaded payment screenshot is blurry. Transaction ID not visible.'
    };
    await sendTestEmail('Registration Rejection', getRegistrationRejectionTemplate(rejectionData));

    // 5. Match Scheduled
    const scheduleData = {
        sportName: 'Volleyball (Women)',
        teamAName: 'EGSPEC Kings',
        teamBName: 'SEC Strikers',
        startTime: 'March 12, 2026 at 10:00 AM',
        venue: 'Court 1'
    };
    await sendTestEmail('Match Scheduled', getMatchScheduledTemplate(scheduleData));

    // 6. Match Live
    const liveData = {
        sportName: 'Basketball (Men)',
        teamAName: 'EGSPEC Titans',
        teamBName: 'AVC Warriors'
    };
    await sendTestEmail('Match Live', getMatchLiveTemplate(liveData));

    // 7. Match Result
    const resultData = {
        teamAName: 'EGSPEC Titans',
        teamBName: 'AVC Warriors',
        winnerName: 'EGSPEC Titans',
        finalScore: '58 - 45',
        matchId: 'MATCH-123'
    };
    await sendTestEmail('Match Result', getMatchResultTemplate(resultData));

    console.log('✅ All test emails sent successfully!');
    process.exit(0);
};

const sendTestEmail = async (testName, template) => {
    console.log(`\n📨 Sending ${testName} template...`);
    
    // Send to all recipients
    for (const email of recipients) {
        try {
            await sendEmail({
                to: email,
                subject: `[TEST] ${testName} - Energy Sports Meet`,
                html: template.html,
                text: template.text
            });
            console.log(`   -> Sent to ${email}`);
            // Small delay to avoid rate limits if any
            await sleep(500); 
        } catch (error) {
            console.error(`   ❌ Failed to send to ${email}:`, error.message);
        }
    }
};

testEmails();
