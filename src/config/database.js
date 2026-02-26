const { Sequelize } = require('sequelize');
require('mysql2'); // Explicitly require for Vercel/Bundler compatibility
require('dotenv').config();

// MySQL Configuration for Hostinger
// MySQL Configuration for Hostinger
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false, // Set to console.log for debugging
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      // Hostinger MySQL usually doesn't require complex SSL config for standard connectivity
      // If needed, we can add it back.
      connectTimeout: 60000
    }
  }
);

module.exports = sequelize;