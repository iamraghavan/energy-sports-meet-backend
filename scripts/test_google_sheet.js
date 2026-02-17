require('dotenv').config();
const { appendRegistrationToSheet } = require('../src/utils/googleSheets');

async function testGoogleSheet() {
    console.log('--- Starting Google Sheet Connection Test ---');

    const dummyData = {
        registration_code: 'TEST-SHEET-' + Date.now(),
        name: 'Test Student',
        email: 'test.student@example.com',
        mobile: '9999999999',
        whatsapp: '9999999999',
        city: 'Test City',
        state: 'Test State',
        sports: 'Cricket, Football',
        amount: '500.00',
        txn_id: 'TXN123456789',
        payment_status: 'paid',
        status: 'approved',
        accommodation: true,
        college: 'Test College of Engineering',
        pd_name: 'Test PD',
        pd_whatsapp: '8888888888'
    };

    console.log('Attempting to append data:', dummyData);

    try {
        await appendRegistrationToSheet(dummyData);
        console.log('--- Test Completed. Check the Google Sheet. ---');
    } catch (error) {
        console.error('--- Test Failed ---');
        console.error(error);
    }
}

testGoogleSheet();
