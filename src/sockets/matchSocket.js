const { Match } = require('../models');
const logger = require('../utils/logger');

module.exports = (io) => {
    io.on('connection', (socket) => {
        logger.info(`🔌 New client connected: ${socket.id}`);

        // 1. Join Specific Match Room (Detailed View)
        socket.on('join_match', (matchId) => {
            socket.join(matchId);
            logger.info(`🏠 Socket ${socket.id} joined match room: ${matchId}`);
        });

        // 2. Join Overview Room (Dashboard View)
        // Client should emit 'join_overview' when on the main list page
        socket.on('join_overview', () => {
            socket.join('live_overview');
            logger.info(`📊 Socket ${socket.id} joined live_overview`);
        });

        socket.on('leave_match', (matchId) => {
            socket.leave(matchId);
            logger.info(`🚪 Socket ${socket.id} left match room: ${matchId}`);
        });

        socket.on('leave_overview', () => {
            socket.leave('live_overview');
        });

        socket.on('disconnect', () => {
            logger.info(`🔌 Client disconnected: ${socket.id}`);
        });
    });
};
