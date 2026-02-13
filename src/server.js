const app = require('./app');
const sequelize = require('./config/database');
const logger = require('./utils/logger');
const http = require('http');
const { Server } = require('socket.io');
const dns = require('dns');

// Force IPv4 preference globally to avoid ENETUNREACH errors on certain cloud platforms (like Render)
// when connecting to services like Google APIs or SMTP servers that may have IPv6 issues.
dns.setDefaultResultOrder('ipv4first');

const PORT = process.env.PORT || 8080;

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for now (adjust for production)
        methods: ["GET", "POST"]
    }
});

// Initialize Socket Logic
require('./sockets/matchSocket')(io);

// Make io accessible globally or pass to routes (Middleware approach)
app.set('io', io);

async function startServer() {
    // 1. Start listening immediately so health checks pass
    server.listen(PORT, '0.0.0.0', () => {
        logger.info(`🚀 Server (HTTP + Socket) is running on port ${PORT} (Bound to 0.0.0.0)`);
    });

    // 2. Connect to Database in background
    try {
        await sequelize.authenticate();
        logger.info('✅ Database connection has been established successfully.');

        // Sync (alter: true to add new tables without dropping old ones)
        await sequelize.sync({ alter: true });
        logger.info('✅ Database synchronized successfully.');
    } catch (error) {
        console.error('DATABASE CONNECTION ERROR:', error.message);
        logger.error('❌ Unable to connect to the database:', error.message);
        // We don't exit(1) here because we want the health-check to handle the error status
    }
}

startServer();
