const sequelize = require('./src/config/database');

async function cleanTable() {
    try {
        console.log('🔍 Investigating registrations table constraints...');

        // 1. Get foreign keys
        const [fks] = await sequelize.query(`
            SELECT CONSTRAINT_NAME 
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE TABLE_NAME = 'registrations' 
            AND TABLE_SCHEMA = DATABASE() 
            AND COLUMN_NAME = 'college_id'
        `);

        for (const fk of fks) {
            console.log(`Dropping Foreign Key: ${fk.CONSTRAINT_NAME}`);
            await sequelize.query(`ALTER TABLE registrations DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
        }

        // 2. Get indexes
        const [indexes] = await sequelize.query("SHOW INDEX FROM registrations");
        for (const idx of indexes) {
            if (idx.Column_name === 'college_id') {
                console.log(`Dropping Index: ${idx.Key_name}`);
                try {
                    await sequelize.query(`ALTER TABLE registrations DROP INDEX \`${idx.Key_name}\``);
                } catch (e) {
                    console.log(`Could not drop index ${idx.Key_name} (might be needed for another FK): ${e.message}`);
                }
            }
        }

        console.log('✅ Cleanup complete. Running migration again...');
        process.exit(0);
    } catch (error) {
        console.error('❌ Cleanup failed:', error.message);
        process.exit(1);
    }
}

cleanTable();
