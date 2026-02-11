const app = require('./app');
const sequelize = require('./config/database');
const logger = require('./utils/logger'); // Import logger

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        // Test Database Connection
        await sequelize.authenticate();
        logger.info('✅ Database connection has been established successfully.');

        // Sync Database (Force: false to avoid dropping tables)
        // In production, use migrations instead of sync
        await sequelize.sync({ alter: true });
        logger.info('✅ Database synchronized successfully.');

        app.listen(PORT, () => {
            logger.info(`🚀 Server is running on port ${PORT}`);
        });

    } catch (error) {
        console.error('SERVER STARTUP ERROR:', error);
        logger.error('❌ Unable to connect to the database:', error);
    }
}

startServer();
