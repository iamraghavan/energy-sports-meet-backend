const sequelize = require('./src/config/database');

async function fixTableIndexes(tableName) {
    try {
        console.log(`Checking indexes for ${tableName} table...`);
        const [results] = await sequelize.query(`SHOW INDEX FROM ${tableName}`);

        const indexNames = [...new Set(results.map(r => r.Key_name))];
        console.log(`Found ${indexNames.length} unique index names in ${tableName}`);

        for (const name of indexNames) {
            if (name !== 'PRIMARY' && !name.includes('foreign') && name !== 'college_id') {
                try {
                    console.log(`Dropping index from ${tableName}: ${name}`);
                    await sequelize.query(`ALTER TABLE ${tableName} DROP INDEX \`${name}\``);
                } catch (e) {
                    console.error(`Failed to drop ${name} from ${tableName}:`, e.message);
                }
            }
        }
    } catch (error) {
        console.error(`Error fixing ${tableName} indexes:`, error.message);
    }
}

async function run() {
    await fixTableIndexes('students');
    await fixTableIndexes('users');
    await fixTableIndexes('payments');
    await fixTableIndexes('registrations');
    console.log('Global Index cleanup completed.');
    process.exit(0);
}

run();
