const { Match, MatchPlayer, Team, Sport, Student, Registration, College, sequelize } = require('../src/models');
const scoringService = require('../src/services/scoringService');
const firebaseSyncService = require('../src/services/firebaseSyncService');
require('dotenv').config();

async function runSimulation() {
    console.log('--- Starting Advanced Scoring Simulation ---');
    const t = await sequelize.transaction();
    
    try {
        // 1. Setup Test Match
        const sport = await Sport.findOne({ where: { name: 'Cricket Test Simulation' } }) || 
                      await Sport.create({ name: 'Cricket Test Simulation', category: 'Men', type: 'Team', amount: 0 });
        
        // Mock College and Registration to satisfy FK constraints
        const college = await College.findOne() || await College.create({ name: 'Sim College', city: 'Sim City', state: 'Sim State' });
        const registration = await Registration.findOne() || await Registration.create({ 
            name: 'Sim User', email: `sim_${Date.now()}@test.com`, mobile: '000', 
            registration_code: `SIM-${Date.now()}`, college_name: 'Sim College', college_city: 'Sim City',
            status: 'approved', total_amount: 0
        });

        const teamA = await Team.create({ 
            team_name: 'Sim Team A', sport_id: sport.id, 
            college_id: college.id, registration_id: registration.id 
        });
        const teamB = await Team.create({ 
            team_name: 'Sim Team B', sport_id: sport.id,
            college_id: college.id, registration_id: registration.id
        });
        
        const match = await Match.create({
            sport_id: sport.id,
            team_a_id: teamA.id,
            team_b_id: teamB.id,
            start_time: new Date(),
            status: 'live'
        }, { transaction: t });

        // 2. Setup Players
        const striker = await Student.create({ name: 'Sim Striker', email: `striker_${Date.now()}@test.com`, mobile: `111${Date.now()}`, college_name: 'Test', college_city: 'Test', college_state: 'Test', city: 'Test', state: 'Test' });
        const nonStriker = await Student.create({ name: 'Sim Non-Striker', email: `non_${Date.now()}@test.com`, mobile: `222${Date.now()}`, college_name: 'Test', college_city: 'Test', college_state: 'Test', city: 'Test', state: 'Test' });
        const bowler = await Student.create({ name: 'Sim Bowler', email: `bowler_${Date.now()}@test.com`, mobile: `333${Date.now()}`, college_name: 'Test', college_city: 'Test', college_state: 'Test', city: 'Test', state: 'Test' });

        await MatchPlayer.bulkCreate([
            { match_id: match.id, student_id: striker.id, team_id: teamA.id, performance_stats: {} },
            { match_id: match.id, student_id: nonStriker.id, team_id: teamA.id, performance_stats: {} },
            { match_id: match.id, student_id: bowler.id, team_id: teamB.id, performance_stats: {} }
        ], { transaction: t });

        console.log(`Match Created: ${match.id}`);

        // 3. Simulate Balls
        const balls = [
            { runs: 4, extras: 0, striker_id: striker.id, bowler_id: bowler.id }, // OK: 0.1, Striker 4
            { runs: 1, extras: 0, striker_id: striker.id, bowler_id: bowler.id }, // OK: 0.2, Striker 5, Strike Rotates
            { runs: 0, extras: 1, extra_type: 'wide', striker_id: nonStriker.id, bowler_id: bowler.id }, // Wide: Still 0.2, Bowler 1 run
            { runs: 0, extras: 0, is_wicket: true, wicket_type: 'bowled', striker_id: nonStriker.id, bowler_id: bowler.id }, // Wicket: 0.3, Bowler 1 wicket
            { runs: 6, extras: 0, striker_id: striker.id, bowler_id: bowler.id } // Six: 0.4
        ];

        let currentStriker = striker.id;
        let currentNonStriker = nonStriker.id;

        for (let i = 0; i < balls.length; i++) {
            const ball = balls[i];
            console.log(`Ball ${i+1}: ${ball.runs} runs, ${ball.extra_type || 'Legal'}${ball.is_wicket ? ', Wicket!' : ''}`);
            
            const result = await scoringService.processCricketBall(match.id, {
                ...ball,
                batting_team_id: teamA.id,
                striker_id: ball.striker_id, // Simulate the caller passing the correct striker
                non_striker_id: currentNonStriker,
                bowler_id: bowler.id
            }, t);

            // Mock Firebase Sync (since we are in transaction)
            console.log(` Score: ${JSON.stringify(result.match.score_details[teamA.id])}`);
        }

        await t.commit();
        console.log('--- Simulation Successful ---');

        // 4. Final Verification
        const finalStriker = await MatchPlayer.findOne({ where: { match_id: match.id, student_id: striker.id } });
        const finalBowler = await MatchPlayer.findOne({ where: { match_id: match.id, student_id: bowler.id } });
        
        console.log('Striker Stats:', JSON.stringify(finalStriker.performance_stats, null, 2));
        console.log('Bowler Stats:', JSON.stringify(finalBowler.performance_stats, null, 2));

        process.exit(0);
    } catch (error) {
        if (t) await t.rollback();
        console.error('Simulation Failed:', error);
        process.exit(1);
    }
}

runSimulation();
