const sequelize = require('../src/config/database');
const logger = require('../src/utils/logger');

/**
 * Robust Migration Runner
 * Safely adds columns or updates schema without dropping data.
 */
async function runMigrations() {
    try {
        logger.info('🚀 Starting Safe Migrations...');

        // 1. Matches: match_state
        const [matchStateCol] = await sequelize.query("SHOW COLUMNS FROM matches LIKE 'match_state'");
        if (matchStateCol.length === 0) {
            logger.info('➕ Adding match_state to matches table...');
            await sequelize.query("ALTER TABLE matches ADD COLUMN match_state JSON DEFAULT NULL AFTER match_events");
            logger.info('✅ Added match_state.');
        } else {
            logger.info('✔️ match_state already exists.');
        }

        // 2. Payments: Make txn_id and screenshot_url nullable
        const [paymentsCols] = await sequelize.query("SHOW COLUMNS FROM payments");
        const txnIdCol = paymentsCols.find(c => c.Field === 'txn_id');
        const screenshotCol = paymentsCols.find(c => c.Field === 'screenshot_url');

        if (txnIdCol && txnIdCol.Null === 'NO') {
            logger.info('🔧 Making txn_id nullable in payments...');
            await sequelize.query("ALTER TABLE payments MODIFY COLUMN txn_id VARCHAR(255) NULL");
        }

        if (screenshotCol && screenshotCol.Null === 'NO') {
            logger.info('🔧 Making screenshot_url nullable in payments...');
            await sequelize.query("ALTER TABLE payments MODIFY COLUMN screenshot_url VARCHAR(255) NULL");
        }

        logger.info('🏁 All migrations checked/applied.');
    } catch (error) {
        logger.error('❌ Migration Error:', error.message);
        throw error; // Rethrow to let the caller handle it (e.g., server startup)
    }
}

// Allow running standalone
if (require.main === module) {
    runMigrations().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = runMigrations;
