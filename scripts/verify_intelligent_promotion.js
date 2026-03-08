const { Sport, Registration, Team, TeamMember, Student, sequelize } = require('../src/models');
const teamController = require('../src/controllers/teamController');

async function verifyPromotion() {
    console.log('--- 🧪 Testing Intelligent Team Auto-Promotion ---');
    
    try {
        const sportId = 4; // Cricket
        const sport = await Sport.findByPk(sportId);
        
        if (!sport) {
            console.log('Sport ID 4 not found. Please check existing sports.');
            const sports = await Sport.findAll({ limit: 5 });
            console.log('Available Sports:', sports.map(s => `${s.id}: ${s.name} (${s.max_players} players)`));
            return;
        }

        console.log(`Checking Sport: ${sport.name} (Max Players: ${sport.max_players})`);

        // Mock request/response
        const req = { params: { sportId: sportId.toString() } };
        const res = {
            json: async (data) => {
                console.log(`\n✅ Success! Received ${data.length} teams.`);
                if (data.length > 0) {
                    const firstTeam = data[0];
                    console.log(`Sample Team: ${firstTeam.team_name}`);
                    
                    // Check members in DB
                    const members = await TeamMember.findAll({ where: { team_id: firstTeam.id } });
                    console.log(`Roster Count: ${members.length}`);
                    
                    if (members.length >= (sport.max_players || 11)) {
                        console.log('✅ Roster count matches expectations!');
                    } else if (sport.name.toLowerCase().includes('cricket') && members.length >= 14) {
                        console.log('✅ Roster count matches expectations for Cricket (14)!');
                    } else {
                        console.log(`⚠️ Roster count (${members.length}) is less than expected Sport max (${sport.max_players}).`);
                    }
                } else {
                    console.log('⚠️ No teams found. Ensure you have "approved" registrations for this sport.');
                }
            },
            status: (code) => {
                console.log(`Status Code: ${code}`);
                return res;
            }
        };

        await teamController.getTeamsBySport(req, res);

    } catch (error) {
        console.error('❌ Error during verification:', error);
    } finally {
        // We don't close sequelize here as it's part of the app models
        process.exit(0);
    }
}

verifyPromotion();
