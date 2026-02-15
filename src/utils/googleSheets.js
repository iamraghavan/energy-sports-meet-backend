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
        const credentialsJson = process.env.GOOGLE_CREDENTIALS_JSON;

        let auth;

        if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
            // Priority 1: Use individual environment variables (AWS App Runner friendly)
            try {
                auth = new google.auth.GoogleAuth({
                    credentials: {
                        client_email: process.env.GOOGLE_CLIENT_EMAIL,
                        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Handle escaped newlines
                        project_id: process.env.GOOGLE_PROJECT_ID,
                    },
                    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
                });
                console.log('✅ Google Sheets Auth: Using GOOGLE_CLIENT_EMAIL/PRIVATE_KEY env vars');
            } catch (e) {
                console.warn('⚠️ Google Sheets Backup: Failed to use individual env vars.', e);
            }
        }

        if (!auth && credentialsJson && credentialsJson.trim().startsWith('{')) {
            // Priority 1: Use environment variable (Best for Render/Heroku)
            try {
                auth = new google.auth.GoogleAuth({
                    credentials: JSON.parse(credentialsJson),
                    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
                });
                console.log('✅ Google Sheets Auth: Using Environment Variable');
            } catch (e) {
                console.warn('⚠️ Google Sheets Backup: Failed to parse GOOGLE_CREDENTIALS_JSON. Falling back to file.');
            }
        }

        if (!auth && fs.existsSync(credentialsPath)) {
            // Priority 2: Use local file
            auth = new google.auth.GoogleAuth({
                keyFile: credentialsPath,
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
            console.log('✅ Google Sheets Auth: Using credentials.json file');
        }

        if (!auth) {
            console.warn('❌ Google Sheets Backup: Neither valid GOOGLE_CREDENTIALS_JSON nor credentials.json found. Skipping.');
            return;
        }

        if (!sheetId) {
            console.warn('⚠️ Google Sheets Backup: GOOGLE_SHEET_ID not found. Skipping.');
            return;
        }

        const sheets = google.sheets({ version: 'v4', auth });

        // --- 1. Auto-Create Headers if Sheet is Empty ---
        const getRes = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: 'Sheet1!A1:Q1',
        });

        if (!getRes.data.values || getRes.data.values.length === 0) {
            const headers = [
                'Timestamp', 'Reg Code', 'Name', 'Email', 'Mobile',
                'WhatsApp', 'City', 'State', 'Sports', 'Total Amount',
                'Txn ID', 'Payment Status', 'Reg Status', 'Accommodation',
                'College', 'PD Name', 'PD WhatsApp'
            ];
            await sheets.spreadsheets.values.update({
                spreadsheetId: sheetId,
                range: 'Sheet1!A1',
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [headers] },
            });
            console.log('✅ Google Sheets Backup: Headers created.');
        }

        // --- 2. Append Data Row ---
        const values = [
            [
                new Date().toLocaleString(),
                data.registration_code,
                data.name,
                data.email,
                data.mobile,
                data.whatsapp || '-',
                data.city || '-',
                data.state || '-',
                data.sports,     // String list of sports
                data.amount,
                data.txn_id,
                data.payment_status || 'Pending',
                data.status || 'Pending',
                data.accommodation ? 'Yes' : 'No',
                data.college,
                data.pd_name || '-',
                data.pd_whatsapp || '-'
            ]
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId: sheetId,
            range: 'Sheet1!A:Q',
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
