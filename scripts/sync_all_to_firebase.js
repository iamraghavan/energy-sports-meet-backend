const { Match, Team, Sport } = require('../src/models');
const firebaseSyncService = require('../src/services/firebaseSyncService');
const logger = require('../src/utils/logger');

async function syncAllMatches() {
    try {
        console.log('--- Starting Bulk Sync to Firebase ---');
        const matches = await Match.findAll({
            include: [
                { model: Team, as: 'TeamA' },
                { model: Team, as: 'TeamB' },
                { model: Sport }
            ]
        });

        console.log(`Found ${matches.length} matches to sync.`);

        for (const match of matches) {
            console.log(`Syncing match: ${match.id} (${match.status})`);
            await firebaseSyncService.syncFullMatch(match);
        }

        console.log('--- Bulk Sync Completed ---');
        process.exit(0);
    } catch (error) {
        console.error('❌ Bulk Sync Failed:', error);
        process.exit(1);
    }
}

syncAllMatches();
