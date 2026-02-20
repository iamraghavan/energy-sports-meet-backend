const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const statusMonitor = require('express-status-monitor');
const logger = require('./utils/logger');
require('dotenv').config();

const app = express();
const { v4: uuidv4 } = require('uuid');

// Assign a unique Request ID to every incoming request
app.use((req, res, next) => {
    req.id = uuidv4();
    next();
});

// Middlewares
app.use(statusMonitor()); // Monitoring at /status
app.use(helmet({
    crossOriginResourcePolicy: false, // Allow cross-origin images/assets
    crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(cors({
    origin: true, // Echoes the request origin, allowing all origins with credentials
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['*'] // Allow all custom headers
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom Morgan Format for deep troubleshooting (Including Request ID)
morgan.token('id', (req) => req.id);
const morganFormat = '[:id] :remote-addr - :method :url :status :res[content-length] - :response-time ms ":referrer" ":user-agent"';
app.use(morgan(morganFormat, { stream: logger.stream }));

// Enhanced Request Debugging Middleware
app.use((req, res, next) => {
    // Log all mutation attempts with full context and Request ID
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        logger.info(`🌐 [REQ] ${req.id} | ${req.method} ${req.url}`, {
            id: req.id,
            ip: req.ip,
            query: req.query,
            body: req.body,
            userAgent: req.get('user-agent')
        });
    }
    next();
});

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000 // Increased for Socket.IO polling stability
});
app.use(limiter);

// Routes
const collegeRoutes = require('./routes/collegeRoutes');
const sportRoutes = require('./routes/sportRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const studentAuthRoutes = require('./routes/studentAuthRoutes');
const studentDashboardRoutes = require('./routes/studentDashboardRoutes');
const authRoutes = require('./routes/authRoutes');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/auth/student', studentAuthRoutes);
app.use('/api/v1/colleges', collegeRoutes);
app.use('/api/v1/sports', sportRoutes);
app.use('/api/v1/register', registrationRoutes);
app.use('/api/v1/dashboard', studentDashboardRoutes);
app.use('/api/v1/admin', require('./routes/adminRoutes'));
app.use('/api/v1/matches', require('./routes/matchRoutes'));
app.use('/api/v1/committee', require('./routes/committeeRoutes'));
app.use('/api/v1/sports-head', require('./routes/sportsHeadRoutes'));
app.use('/api/v1/scorer', require('./routes/scorerRoutes'));
app.use('/api/v1/teams', require('./routes/teamRoutes'));
app.use('/api/v1/overview', require('./routes/overviewRoutes'));

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'UP',
        message: 'Server is running',
        timestamp: new Date()
    });
});

app.get('/', (req, res) => {
    res.send('running'); // Minimal response for health checks
});

// TEMPORARY: Debug Email Config (Safe Masking)
app.get('/api/debug-email-config', (req, res) => {
    res.json({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER ? `${process.env.SMTP_USER.substring(0, 4)}***` : 'NOT SET',
        from: process.env.SMTP_FROM,
        secure: process.env.SMTP_SECURE,
        node_env: process.env.NODE_ENV,
        aws_region: process.env.AWS_REGION
    });
});

// TEMPORARY: Trigger Test Email
app.get('/api/test-email', async (req, res) => {
    try {
        const { sendEmail } = require('./utils/email');
        const targetEmail = req.query.to || 'raghavanofficials@gmail.com';

        await sendEmail({
            to: targetEmail,
            subject: 'Test Email from Energy Sports Meet via SES API',
            text: 'If you are reading this, the SES API integration is working correctly!',
            html: '<h1>Success!</h1><p>The AES SES API integration is working correctly.</p><p>Timestamp: ' + new Date().toISOString() + '</p>'
        });

        res.json({ success: true, message: `Test email sent to ${targetEmail}` });
    } catch (error) {
        logger.error('Test Email Failed:', error);
        res.status(500).json({ error: 'Test Email Failed', details: error.message });
    }
});

// Serve Live Dashboard (Overview)
app.get('/dashboard', (req, res) => {
    res.sendFile(require('path').join(__dirname, '../test_socket_overview.html'));
});

// Serve Match Detail Test Page
app.get('/match-test', (req, res) => {
    res.sendFile(require('path').join(__dirname, '../test_socket.html'));
});

// [DEBUG] GET /api/logs - Serve all.log for remote debugging
app.get('/api/logs', (req, res) => {
    const fs = require('fs');
    const path = require('path');
    const logPath = path.join(__dirname, '../logs/all.log');

    if (!fs.existsSync(logPath)) {
        return res.status(404).json({ error: 'Log file not found. Ensure file logging is enabled.' });
    }

    // Read last 500 lines or 100KB for safety
    const stats = fs.statSync(logPath);
    const fileSizeInBytes = stats.size;
    const readStream = fs.createReadStream(logPath, {
        start: Math.max(0, fileSizeInBytes - 100000) // Last 100KB
    });

    res.set('Content-Type', 'text/plain');
    readStream.pipe(res);
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    res.status(500).json({
        error: 'Something went wrong!',
        message: err.message
    });
});

module.exports = app;
