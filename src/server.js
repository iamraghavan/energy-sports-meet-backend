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
    try {
        await sequelize.authenticate();
        logger.info('✅ Database connection has been established successfully.');

        // Sync (alter: true to add new tables without dropping old ones)
        // In production, use migrations!
        await sequelize.sync({ alter: true });
        logger.info('✅ Database synchronized successfully.');

        server.listen(PORT, () => {
            logger.info(`🚀 Server (HTTP + Socket) is running on port ${PORT}`);
        });

    } catch (error) {
        console.error('SERVER STARTUP ERROR:', error);
        logger.error('❌ Unable to connect to the database:', error);
    }
}

startServer();
