const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

/**
 * Appends registration details to a Google Sheet
 * @param {Object} data 
 */
async function appendRegistrationToSheet(data) {
    try {
        const sheetId = process.env.GOOGLE_SHEET_ID;
        const credentialsPath = path.join(process.cwd(), 'credentials.json');

        if (!fs.existsSync(credentialsPath)) {
            console.warn('⚠️ Google Sheets Backup: credentials.json not found. Skipping backup.');
            return;
        }

        if (!sheetId) {
            console.warn('⚠️ Google Sheets Backup: GOOGLE_SHEET_ID not found in .env. Skipping backup.');
            return;
        }

        const auth = new google.auth.GoogleAuth({
            keyFile: credentialsPath,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        const values = [
            [
                new Date().toLocaleString(),
                data.registration_code,
                data.name,
                data.email,
                data.mobile,
                data.sports,     // String list of sports
                data.amount,
                data.txn_id,
                data.college
            ]
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId: sheetId,
            range: 'Sheet1!A:I', // Adjust if sheet name is different
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values,
            },
        });

        console.log(`✅ Google Sheets Backup: Row appended for ${data.registration_code}`);
    } catch (error) {
        console.error('❌ Google Sheets Backup Error:', error.message);
    }
}

module.exports = { appendRegistrationToSheet };
