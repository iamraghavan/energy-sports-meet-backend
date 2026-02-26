const { db } = require('./src/config/firebase');
require('dotenv').config();

async function verifyFirebaseData() {
    if (!db) {
        console.error('Firebase DB not initialized.');
        process.exit(1);
    }
    try {
        const ref = db.ref('sports/matches');
        const snapshot = await ref.once('value');
        const matches = snapshot.val();
        
        if (!matches) {
            console.log('No matches found in Firebase.');
            process.exit(0);
        }

        const matchIds = Object.keys(matches);
        const latestMatchId = matchIds[matchIds.length - 1];
        const matchData = matches[latestMatchId];

        console.log('--- Firebase Data Verification ---');
        console.log('Match ID:', latestMatchId);
        console.log('match_state type:', typeof matchData.match_state);
        console.log('match_state structure:', JSON.stringify(matchData.match_state, null, 2));
        
        if (typeof matchData.match_state === 'object' && !Array.isArray(matchData.match_state)) {
            console.log('✅ SUCCESS: match_state is a structured object in Firebase.');
        } else {
            console.log('❌ FAILURE: match_state is still not an object.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Verification Failed:', error);
        process.exit(1);
    }
}

verifyFirebaseData();
