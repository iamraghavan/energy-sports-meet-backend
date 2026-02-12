require('dotenv').config();
const { appendRegistrationToSheet } = require('../src/utils/googleSheets');

async function runTest() {
    console.log('🚀 Starting Google Sheets Connection Test...');

    // Mock data for testing
    const testData = {
        registration_code: 'TEST-' + Math.random().toString(36).substring(7).toUpperCase(),
        name: 'Test Participant',
        email: 'test@example.com',
        mobile: '1234567890',
        whatsapp: '9876543210',
        city: 'Nagapattinam',
        state: 'Tamil Nadu',
        sports: 'Badminton, Chess',
        amount: 800,
        txn_id: 'TXN-00000001',
        payment_status: 'Pending',
        status: 'Pending',
        accommodation: true,
        college: 'Test University',
        pd_name: 'Dr. Smith',
        pd_whatsapp: '9988776655'
    };

    console.log('Sending data:', testData);

    try {
        await appendRegistrationToSheet(testData);
        console.log('✨ Test completed successfully!');
        console.log('Check your Google Sheet to verify the new row.');
    } catch (error) {
        console.error('❌ Test Failed:', error.message);
    }
}

runTest();
