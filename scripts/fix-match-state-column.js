const sequelize = require('../src/config/database');
const logger = require('../src/utils/logger');

async function fixMatchStateColumn() {
    try {
        logger.info('🔍 Checking for match_state column in matches table...');
        
        // 1. Check if column exists
        const [results] = await sequelize.query("SHOW COLUMNS FROM matches LIKE 'match_state'");
        
        if (results.length === 0) {
            logger.info('➕ Column match_state not found. Adding it now...');
            
            // 2. Add column using raw SQL
            // Using JSON type (or LONGTEXT for older MariaDB/MySQL versions if JSON isn't supported)
            await sequelize.query("ALTER TABLE matches ADD COLUMN match_state JSON DEFAULT NULL AFTER match_events");
            
            logger.info('✅ Column match_state added successfully!');
        } else {
            logger.info('✔️ Column match_state already exists. No action needed.');
        }

        // 3. Double check other potential missing columns from recent updates
        // (Optional but good for resilience)
        
    } catch (error) {
        logger.error('❌ Error fixing database schema:', error.message);
        process.exit(1);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

fixMatchStateColumn();
