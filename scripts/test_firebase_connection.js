const { db } = require('../src/config/firebase');
const logger = require('../src/utils/logger');

async function testConnection() {
    console.log('--- Firebase Connection Diagnostic ---');
    
    if (!db) {
        console.error('❌ Firebase DB instance is NULL. Check your .env file for FIREBASE_SERVICE_ACCOUNT_BASE64.');
        process.exit(1);
    }

    try {
        console.log('Testing write to "connection_test" node...');
        const testRef = db.ref('connection_test');
        await testRef.set({
            status: 'success',
            timestamp: new Date().toISOString(),
            message: 'Backend successfully connected to Firebase RTDB!'
        });
        
        console.log('✅ WRITE SUCCESSFUL! Check your Firebase console for the "connection_test" node.');
        
        console.log('Testing read from "connection_test" node...');
        const snapshot = await testRef.once('value');
        console.log('✅ READ SUCCESSFUL! Data:', snapshot.val());
        
        process.exit(0);
    } catch (error) {
        console.error('❌ CONNECTION FAILED:', error.message);
        if (error.code === 'PERMISSION_DENIED') {
            console.error('👉 Suggestion: Check your Firebase Database Rules. They might be too restrictive.');
        } else if (error.message.includes('credential')) {
            console.error('👉 Suggestion: Your Service Account JSON/Base64 might be invalid.');
        }
        process.exit(1);
    }
}

testConnection();
