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

// Middlewares
app.use(statusMonitor()); // Monitoring at /status
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: logger.stream })); // Use Winston for HTTP logging

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
const collegeRoutes = require('./routes/collegeRoutes');
const sportRoutes = require('./routes/sportRoutes');
const registrationRoutes = require('./routes/registrationRoutes');

app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/colleges', collegeRoutes);
app.use('/api/v1/sports', sportRoutes);
app.use('/api/v1/register', registrationRoutes);
app.use('/api/v1/admin', require('./routes/adminRoutes'));
app.use('/api/v1/matches', require('./routes/matchRoutes'));
app.use('/api/v1/committee', require('./routes/committeeRoutes'));

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date() });
});

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Energy 2026 Inter-College Sports Event Platform API v1' });
});

// Serve Live Dashboard (Overview)
app.get('/dashboard', (req, res) => {
    res.sendFile(require('path').join(__dirname, '../test_socket_overview.html'));
});

// Serve Match Detail Test Page
app.get('/match-test', (req, res) => {
    res.sendFile(require('path').join(__dirname, '../test_socket.html'));
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
