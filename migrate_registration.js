const sequelize = require('./src/config/database');

async function migrate() {
    try {
        console.log('🔄 Starting migration: Making Registration.college_id nullable...');

        // Check current table structure
        const [results] = await sequelize.query("DESCRIBE registrations");
        const collegeIdCol = results.find(r => r.Field === 'college_id');

        if (collegeIdCol && collegeIdCol.Null === 'NO') {
            console.log('Detected NOT NULL constraint. Applying ALTER TABLE...');
            await sequelize.query("ALTER TABLE registrations MODIFY college_id INTEGER NULL");
            console.log('✅ Successfully made registrations.college_id nullable.');
        } else {
            console.log('ℹ️ registrations.college_id is already nullable or column not found.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

migrate();
