const admin = require('firebase-admin');
require('dotenv').config();

let db = null;

try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
        // Decode the base64 string back into JSON
        const serviceAccountJson = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8');
        const serviceAccount = JSON.parse(serviceAccountJson);
        const dbUrl = process.env.FIREBASE_DATABASE_URL || `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`;

        console.log(`📡 Initializing Firebase for Project: ${serviceAccount.project_id}`);
        console.log(`🔗 Firebase Database URL: ${dbUrl}`);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: dbUrl
        });

        db = admin.database();
        console.log('✅ Firebase Admin SDK initialized successfully.');
    } else {
        console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_BASE64 is not set in .env. Firebase sync will be disabled.');
    }
} catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
}

module.exports = { db, admin };
