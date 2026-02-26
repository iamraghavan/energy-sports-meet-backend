const { Match } = require('./src/models');
require('dotenv').config();

async function inspectData() {
    try {
        const match = await Match.findOne({
            order: [['createdAt', 'DESC']]
        });
        
        if (!match) {
            console.log('No matches found.');
            return;
        }

        console.log('--- Match Inspection ---');
        console.log('ID:', match.id);
        console.log('match_state type:', typeof match.match_state);
        console.log('match_state content:', JSON.stringify(match.match_state, null, 2));
        console.log('score_details type:', typeof match.score_details);
        
        if (typeof match.match_state === 'string') {
            console.log('⚠️ WARNING: match_state is a string. It should be an object.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Inspection Failed:', error);
        process.exit(1);
    }
}

inspectData();
