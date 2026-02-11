require('dotenv').config();
const { sequelize, User } = require('../src/models');

async function resetUsers() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to DB');

        console.log('🔄 Dropping and Recreating User table...');
        await User.sync({ force: true });
        console.log('✅ User table reset successfully.');

        await sequelize.close();
    } catch (error) {
        console.error('❌ Error resetting users:', error);
    }
}

resetUsers();
