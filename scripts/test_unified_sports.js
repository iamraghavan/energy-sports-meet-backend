const { getRelevantSportIds } = require('../src/utils/sportUtils');
const { Sport, Team, Registration } = require('../src/models');
const { Op } = require('sequelize');

async function testUnifiedSports() {
    console.log('--- 🧪 Testing Unified Sports Category Logic ---');

    // 1. Test Sport ID resolution
    const badmintonBoysId = 1; // From our data
    const relevantIds = await getRelevantSportIds(badmintonBoysId);
    console.log(`Input Sport ID: ${badmintonBoysId} (Badminton Boys)`);
    console.log(`Resolved IDs: ${relevantIds.join(', ')}`);
    
    // Check if 9 (Badminton Girls) is included
    if (relevantIds.includes(9)) {
        console.log('✅ Success: Resolved both Badminton Boys and Girls.');
    } else {
        console.log('❌ Failure: Did not resolve related category.');
    }

    // 2. Test Team Aggregation
    const ttBoysId = 7;
    const ttRelevantIds = await getRelevantSportIds(ttBoysId);
    console.log(`\nInput Sport ID: ${ttBoysId} (Table Tennis Boys)`);
    console.log(`Resolved IDs: ${ttRelevantIds.join(', ')}`);

    const ttTeams = await Team.findAll({
        where: { sport_id: { [Op.in]: ttRelevantIds } },
        attributes: ['team_name', 'sport_id']
    });

    console.log('Teams found for Table Tennis (Combined):');
    ttTeams.forEach(t => console.group(`- ${t.team_name} (Sport ID: ${t.sport_id})`));

    const sportsInTeams = [...new Set(ttTeams.map(t => t.sport_id))];
    if (sportsInTeams.includes(7) && sportsInTeams.includes(11)) {
        console.log('✅ Success: Combined view shows teams from both Boys and Girls categories.');
    } else {
        console.log('❌ Failure: Combined view is missing teams from one category.');
    }

    // 3. Test Registration Aggregation
    const cricketBoysId = 4;
    const cricketRelevantIds = await getRelevantSportIds(cricketBoysId);
    console.log(`\nInput Sport ID: ${cricketBoysId} (Cricket Boys)`);
    // Note: Our data shows Cricket Boys is ID 4, but we don't see Cricket Girls in the first 12 IDs.
    // It might be a higher ID.
    
    process.exit(0);
}

testUnifiedSports().catch(err => {
    console.error(err);
    process.exit(1);
});
