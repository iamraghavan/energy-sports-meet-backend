const { Sport, sequelize } = require('../models');

const sportsData = [
    { id: 1, name: 'Badminton', category: 'Boys', type: 'Team', max_players: 2, amount: 300.00 },
    { id: 2, name: 'Basketball', category: 'Boys', type: 'Team', max_players: 12, amount: 500.00 },
    { id: 3, name: 'Chess', category: 'Boys', type: 'Team', max_players: 5, amount: 300.00 },
    { id: 4, name: 'Cricket', category: 'Boys', type: 'Team', max_players: 16, amount: 500.00 },
    { id: 5, name: 'Football', category: 'Boys', type: 'Team', max_players: 16, amount: 500.00 },
    { id: 6, name: 'Kabaddi', category: 'Boys', type: 'Team', max_players: 12, amount: 500.00 },
    { id: 7, name: 'Table Tennis', category: 'Boys', type: 'Team', max_players: 3, amount: 300.00 },
    { id: 8, name: 'Volleyball', category: 'Boys', type: 'Team', max_players: 12, amount: 500.00 },
    { id: 9, name: 'Badminton', category: 'Girls', type: 'Team', max_players: 2, amount: 300.00 },
    { id: 10, name: 'Chess', category: 'Girls', type: 'Team', max_players: 5, amount: 300.00 },
    { id: 11, name: 'Table Tennis', category: 'Girls', type: 'Team', max_players: 3, amount: 300.00 },
    { id: 12, name: 'Volleyball', category: 'Girls', type: 'Team', max_players: 12, amount: 500.00 }
];

const seedSports = async () => {
    try {
        console.log('--- Seeding Sports ---');
        // Use bulkCreate with updateOnDuplicate or destroy all first
        // Since user wants fresh, we can assume sports table might be empty if we force sync
        await Sport.bulkCreate(sportsData, {
            updateOnDuplicate: ['name', 'category', 'type', 'max_players', 'amount']
        });
        console.log('✅ Sports seeded successfully');
    } catch (error) {
        console.error('❌ Sports Seeding Failed:', error.message);
    }
};

module.exports = seedSports;
