require('dotenv').config();
const { sequelize, User } = require('../src/models');

async function seedAdmin() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to DB');

        // Check if super admin exists
        const adminExists = await User.findOne({ where: { username: 'superadmin' } });

        if (adminExists) {
            console.log('⚠️ Super Admin already exists.');
        } else {
            await User.create({
                username: 'superadmin',
                password: 'adminpassword123', // Change this in production!
                role: 'super_admin'
            });
            console.log('✅ Super Admin created successfully.');
            console.log('Username: superadmin');
            console.log('Password: adminpassword123');
        }

        await sequelize.close();
    } catch (error) {
        console.error('❌ Error seeding admin:', error);
    }
}

seedAdmin();
