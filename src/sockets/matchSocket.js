const { Match, sequelize } = require('../models');
const logger = require('../utils/logger');
const scoringService = require('../services/scoringService');

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

        // 3. WebSocket Scoring (Cricket)
        socket.on('submit_cricket_ball', async (payload, callback) => {
            const { matchId } = payload;
            const t = await sequelize.transaction();
            try {
                const { match, ballEvent } = await scoringService.processCricketBall(matchId, payload, t);
                await t.commit();

                // Broadcast to all in match room (including sender)
                io.to(matchId).emit('cricket_score_update', { 
                    matchId, 
                    score: match.score_details, 
                    last_ball: ballEvent 
                });
                
                // Broadcast to overview
                io.to('live_overview').emit('overview_update', { matchId, score: match.score_details });

                logger.info(`✅ [Socket] Cricket score updated for match ${matchId}`);
                if (callback) callback({ status: 'ok', matchId });

            } catch (error) {
                if (t) await t.rollback();
                logger.error(`❌ [Socket] Cricket scoring error: ${error.message}`);
                if (callback) callback({ status: 'error', message: error.message });
            }
        });

        // 4. WebSocket Scoring (Standard)
        socket.on('submit_standard_score', async (payload, callback) => {
            const { matchId } = payload;
            const t = await sequelize.transaction();
            try {
                const { match, newEvent } = await scoringService.processStandardScore(matchId, payload, t);
                await t.commit();

                // Broadcast
                io.to(matchId).emit('score_updated', { matchId, score: match.score_details, event: newEvent });
                io.to('live_overview').emit('overview_update', { matchId, score: match.score_details });

                logger.info(`✅ [Socket] Standard score updated for match ${matchId}`);
                if (callback) callback({ status: 'ok', matchId });

            } catch (error) {
                if (t) await t.rollback();
                logger.error(`❌ [Socket] Standard scoring error: ${error.message}`);
                if (callback) callback({ status: 'error', message: error.message });
            }
        });

        socket.on('disconnect', () => {
            logger.info(`🔌 Client disconnected: ${socket.id}`);
        });
    });
};
