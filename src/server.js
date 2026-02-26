const app = require('./app');
const sequelize = require('./config/database');
const logger = require('./utils/logger');
const runMigrations = require('../scripts/run_migrations');
const http = require('http');

const PORT = process.env.PORT || 8080;

const server = http.createServer(app);

async function startServer() {
    // 1. Start listening immediately so health checks pass
    server.listen(PORT, '0.0.0.0', () => {
        logger.info(`🚀 Server (HTTP) is running on port ${PORT} (Bound to 0.0.0.0)`);
    });

    // 2. Connect to Database in background
    try {
        await sequelize.authenticate();
        logger.info('✅ Database connection has been established successfully.');

        // 1. Run safe migrations first
        await runMigrations();

        // 2. Sync: Standard sync for remaining model mappings
        await sequelize.sync();
        logger.info('✅ Database synchronized successfully.');
    } catch (error) {
        console.error('DATABASE CONNECTION ERROR:', error.message);
        logger.error('❌ Unable to connect to the database:', error.message);
        // We don't exit(1) here because we want the health-check to handle the error status
    }
}

startServer();

