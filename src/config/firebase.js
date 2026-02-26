const admin = require('firebase-admin');
require('dotenv').config();

let db = null;

try {
    let serviceAccount = null;

    // Option 1: Direct JSON String (User preferred)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            console.log('📡 Initializing Firebase via FIREBASE_SERVICE_ACCOUNT JSON...');
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        } catch (jsonError) {
            console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT JSON. Make sure it is valid JSON.');
        }
    } 
    // Option 2: Individual Environment Variables (Stable for Render/Multi-line)
    else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        console.log(`📡 Initializing Firebase via individual variables for Project: ${process.env.FIREBASE_PROJECT_ID}`);
        serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        };
    } 
    // Option 3: Base64 Encoded JSON (Legacy Fallback)
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
        console.log('📡 Initializing Firebase via Base64 Service Account...');
        const serviceAccountJson = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8');
        serviceAccount = JSON.parse(serviceAccountJson);
    }

    if (serviceAccount) {
        const dbUrl = process.env.FIREBASE_DATABASE_URL || `https://${serviceAccount.projectId || serviceAccount.project_id}-default-rtdb.firebaseio.com`;
        console.log(`🔗 Firebase Database URL: ${dbUrl}`);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: dbUrl
        });

        db = admin.database();
        console.log('✅ Firebase Admin SDK initialized successfully.');
    } else {
        console.warn('⚠️ Firebase credentials not found. Set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL in .env.');
    }
} catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
    if (error.message.includes('ASN.1')) {
        console.error('👉 Hint: Your PRIVATE_KEY might be truncated or have invalid newlines.');
    }
}

module.exports = { db, admin };
