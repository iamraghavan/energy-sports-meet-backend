const { sequelize } = require('../src/models');
const seedSports = require('../src/seeders/sportSeeder');

const migrateFresh = async () => {
    try {
        console.log('--- DATABASE MIGRATION (FRESH) STARTED ---');

        // DANGER: This drops all tables!
        await sequelize.sync({ force: true });
        console.log('✅ All tables dropped and recreated successfully.');

        // Run Seeders
        await seedSports();

        console.log('--- DATABASE MIGRATION (FRESH) COMPLETED ---');
        process.exit(0);
    } catch (error) {
        console.error('❌ Fresh Migration Failed:', error.message);
        process.exit(1);
    }
};

migrateFresh();
