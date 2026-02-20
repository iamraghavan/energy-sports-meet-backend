const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Start setting up colors
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

winston.addColors(colors);

// Define the format of the logs
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`,
    ),
);

// Define where to store logs
const transports = [
    new winston.transports.Console(),
];

// Enable file logs (Always attempt, catch failure for read-only systems)
try {
    transports.push(
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: winston.format.uncolorize(), // File logs shouldn't have color codes
        })
    );
    transports.push(
        new winston.transports.File({ 
            filename: 'logs/all.log',
            format: winston.format.uncolorize()
        })
    );
} catch (error) {
    console.warn('Failed to initialize file logging (likely readonly filesystem):', error.message);
}

// Create the logger instance
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
    levels,
    format,
    transports,
});

// Create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
    write: (message) => logger.http(message.trim()),
};

module.exports = logger;
