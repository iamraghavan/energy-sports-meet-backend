require('dotenv').config();
const { sequelize } = require('../src/models'); // Import from models index to ensure all models are loaded

async function syncDatabase() {
    try {
        console.log('Authenticating...');
        await sequelize.authenticate();
        console.log('✅ Connection has been established successfully.');

        console.log('Syncing Database (FORCE: true)...');
        // Force: true drops tables if they exist and creates new ones.
        await sequelize.sync({ force: true });
        console.log('✅ Database synchronized successfully.');

        console.log('Tables created:');
        const [results] = await sequelize.query("SHOW TABLES");
        console.log(results);

        await sequelize.close();
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
    }
}

syncDatabase();
