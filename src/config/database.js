const { Sequelize } = require('sequelize');
const { URL } = require('url');
require('dotenv').config();

// Fix for Render/Vercel IPv6 issues:
// Parse the DATABASE_URL manually and pass explicit connection parameters
// This ensures that dialectOptions (like family: 4) are respected properly.

let sequelize;

if (process.env.DATABASE_URL) {
  const dbUrl = new URL(process.env.DATABASE_URL);

  sequelize = new Sequelize(
    dbUrl.pathname.substring(1), // database name (remove leading /)
    dbUrl.username,
    dbUrl.password,
    {
      host: dbUrl.hostname,
      port: dbUrl.port,
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        },
        // Force IPv4
        family: 4
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
} else {
  // Fallback for local development without DATABASE_URL
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST,
      dialect: 'postgres',
      port: process.env.DB_PORT,
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

module.exports = sequelize;