const { Sport, sequelize } = require('../src/models');

const sportsData = [
    // Boys Category (₹500 for major team sports, ₹300 for others)
    { name: 'Badminton', category: 'Boys', type: 'Team', amount: 300.00, max_players: 2 },
    { name: 'Basketball', category: 'Boys', type: 'Team', amount: 500.00, max_players: 12 },
    { name: 'Chess', category: 'Boys', type: 'Team', amount: 300.00, max_players: 5 },
    { name: 'Cricket', category: 'Boys', type: 'Team', amount: 500.00, max_players: 16 },
    { name: 'Football', category: 'Boys', type: 'Team', amount: 500.00, max_players: 16 },
    { name: 'Kabaddi', category: 'Boys', type: 'Team', amount: 500.00, max_players: 12 },
    { name: 'Table Tennis', category: 'Boys', type: 'Team', amount: 300.00, max_players: 3 },
    { name: 'Volleyball', category: 'Boys', type: 'Team', amount: 500.00, max_players: 12 },

    // Girls Category
    { name: 'Badminton', category: 'Girls', type: 'Team', amount: 300.00, max_players: 2 },
    { name: 'Chess', category: 'Girls', type: 'Team', amount: 300.00, max_players: 5 },
    { name: 'Table Tennis', category: 'Girls', type: 'Team', amount: 300.00, max_players: 3 },
    { name: 'Volleyball', category: 'Girls', type: 'Team', amount: 500.00, max_players: 12 }
];

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Clear existing sports
        await Sport.destroy({ where: {}, truncate: false }); // Truncate might fail if foreign keys exist

        // We'll use bulkCreate
        await Sport.bulkCreate(sportsData);

        console.log('✅ Sports seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seed();
