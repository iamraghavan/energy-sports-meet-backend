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

app.use('/api/v1/colleges', collegeRoutes);
app.use('/api/v1/sports', sportRoutes);
app.use('/api/v1/register', registrationRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date() });
});

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Tamil Nadu Inter-College Sports Event Platform API v1' });
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
