const sequelize = require('./src/config/database');

async function migrate() {
    try {
        console.log('🔄 Starting Idempotent Migration: Refactoring registrations table...');

        // 1. Get current columns
        const [results] = await sequelize.query("DESCRIBE registrations");
        const existingCols = results.map(r => r.Field);

        const colsToAdd = [
            { name: "college_name", type: "VARCHAR(255) NULL" },
            { name: "college_city", type: "VARCHAR(255) NULL" },
            { name: "college_state", type: "VARCHAR(255) NULL" },
            { name: "pd_name", type: "VARCHAR(255) NULL" },
            { name: "pd_whatsapp", type: "VARCHAR(255) NULL" },
            { name: "college_email", type: "VARCHAR(255) NULL" },
            { name: "college_contact", type: "VARCHAR(255) NULL" }
        ];

        for (const col of colsToAdd) {
            if (!existingCols.includes(col.name)) {
                console.log(`Adding column: ${col.name}...`);
                await sequelize.query(`ALTER TABLE registrations ADD COLUMN ${col.name} ${col.type}`);
            } else {
                console.log(`Column ${col.name} already exists. Skipping.`);
            }
        }

        // 2. Remove college_id if it exists
        if (existingCols.includes('college_id')) {
            console.log('Removing college_id column...');
            // Try to drop the index if it exists (mysql often creates an index for FKs)
            try {
                await sequelize.query("ALTER TABLE registrations DROP INDEX college_id");
            } catch (e) {
                console.log('Index college_id not found or already dropped.');
            }

            await sequelize.query("ALTER TABLE registrations DROP COLUMN college_id");
            console.log('✅ college_id dropped.');
        }

        console.log('✅ Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

migrate();
