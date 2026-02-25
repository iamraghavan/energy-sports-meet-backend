const { Match, sequelize } = require('../models');
const logger = require('../utils/logger');
const scoringService = require('../services/scoringService');
const matchService = require('../services/matchService');

module.exports = (io) => {
    io.on('connection', (socket) => {
        logger.info(`🔌 New client connected: ${socket.id}`);

        // 0. Match Lifecycle Management (CRUD)
        socket.on('create_match', async (payload, callback) => {
            try {
                const match = await matchService.createMatch(payload);
                io.to('live_overview').emit('overview_update', { action: 'create', matchId: match.id, status: match.status });
                logger.info(`✅ [Socket] Match created: ${match.id}`);
                if (callback) callback({ status: 'ok', match });
            } catch (error) {
                logger.error(`❌ [Socket] Create match error: ${error.message}`);
                if (callback) callback({ status: 'error', message: error.message });
            }
        });

        socket.on('update_match', async (payload, callback) => {
            const { matchId, ...updates } = payload;
            try {
                const match = await matchService.updateMatchDetails(matchId, updates);
                io.to(matchId).emit('match_details_updated', match);
                io.to('live_overview').emit('overview_update', { action: 'update', matchId, status: match.status });
                logger.info(`✅ [Socket] Match updated: ${matchId}`);
                if (callback) callback({ status: 'ok', match });
            } catch (error) {
                logger.error(`❌ [Socket] Update match error: ${error.message}`);
                if (callback) callback({ status: 'error', message: error.message });
            }
        });

        socket.on('delete_match', async (payload, callback) => {
            const { matchId } = payload;
            try {
                await matchService.deleteMatch(matchId);
                io.to(matchId).emit('match_deleted', { matchId });
                io.to('live_overview').emit('overview_update', { action: 'delete', matchId });
                logger.info(`✅ [Socket] Match deleted: ${matchId}`);
                if (callback) callback({ status: 'ok', matchId });
            } catch (error) {
                logger.error(`❌ [Socket] Delete match error: ${error.message}`);
                if (callback) callback({ status: 'error', message: error.message });
            }
        });

        // 1. Join Specific Match Room (Detailed View)
        socket.on('join_match', (matchId) => {
            socket.join(matchId);
            logger.info(`🏠 Socket joined match room`, { socketId: socket.id, matchId });
        });

        // 2. Join Overview Room (Dashboard View)
        // Client should emit 'join_overview' when on the main list page
        socket.on('join_overview', () => {
            socket.join('live_overview');
            logger.info(`📊 Socket joined live_overview`, { socketId: socket.id });
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
                io.to('live_overview').emit('overview_update', { 
                    matchId, 
                    score: match.score_details,
                    status: match.status,
                    action: 'score_update'
                });

                logger.info(`✅ [Socket] Cricket score updated`, { matchId, socketId: socket.id, payload });
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
                io.to('live_overview').emit('overview_update', { 
                    matchId, 
                    score: match.score_details,
                    status: match.status,
                    action: 'score_update'
                });

                logger.info(`✅ [Socket] Standard score updated`, { matchId, socketId: socket.id, payload });
                if (callback) callback({ status: 'ok', matchId });

            } catch (error) {
                if (t) await t.rollback();
                logger.error(`❌ [Socket] Standard scoring error: ${error.message}`);
                if (callback) callback({ status: 'error', message: error.message });
            }
        });

        // 5. Match Status Updates (Start/End Match)
        socket.on('update_match_status', async (payload, callback) => {
            const { matchId } = payload;
            try {
                const match = await matchService.updateMatchStatus(matchId, payload);

                // Broadcast to match room
                io.to(matchId).emit('score_updated', {
                    matchId,
                    scoreDetails: match.score_details,
                    status: match.status,
                    winnerId: match.winner_id
                });

                // Broadcast to overview
                io.to('live_overview').emit('overview_update', {
                    matchId,
                    sportId: match.sport_id,
                    score: match.score_details, // Standardized key
                    status: match.status,
                    action: 'status_update'
                });

                logger.info(`✅ [Socket] Match status updated`, { matchId, status: match.status, socketId: socket.id, payload });
                if (callback) callback({ status: 'ok', matchId });

            } catch (error) {
                logger.error(`❌ [Socket] Status update error: ${error.message}`);
                if (callback) callback({ status: 'error', message: error.message });
            }
        });

        // 6. Lineup Management
        socket.on('update_lineup', async (payload, callback) => {
            const { matchId, action, student_id } = payload;
            try {
                await matchService.updateLineup(matchId, payload);

                // Broadcast to match room
                io.to(matchId).emit('lineup_updated', { matchId, action, student_id });

                logger.info(`✅ [Socket] Lineup updated`, { matchId, action, student_id, socketId: socket.id, payload });
                if (callback) callback({ status: 'ok', matchId });

            } catch (error) {
                logger.error(`❌ [Socket] Lineup update error: ${error.message}`);
                if (callback) callback({ status: 'error', message: error.message });
            }
        });

        // 7. Universal Timer Control
        socket.on('timer_control', async (payload, callback) => {
            const { matchId, action, currentTime } = payload; // action: 'start', 'pause', 'reset'
            try {
                const match = await scoringService.updateTimer(matchId, { action, currentTime });
                
                io.to(matchId).emit('timer_sync', { matchId, action, currentTime, timer: match.score_details.timer });
                
                logger.info(`⏱️ [Socket] Timer ${action}`, { matchId, currentTime });
                if (callback) callback({ status: 'ok', timer: match.score_details.timer });
            } catch (error) {
                if (callback) callback({ status: 'error', message: error.message });
            }
        });

        // 8. Issue Cards (Football, etc.)
        socket.on('issue_card', async (payload, callback) => {
            const { matchId } = payload;
            try {
                const { match, cardEvent } = await scoringService.processCard(matchId, payload);
                
                io.to(matchId).emit('card_issued', { matchId, card: cardEvent });
                io.to('live_overview').emit('overview_update', { 
                    matchId, 
                    score: match.score_details, 
                    action: 'card_issued' 
                });

                logger.info(`🟨 [Socket] Card issued`, { matchId, payload });
                if (callback) callback({ status: 'ok' });
            } catch (error) {
                if (callback) callback({ status: 'error', message: error.message });
            }
        });

        // 9. Undo/Correction
        socket.on('undo_event', async (payload, callback) => {
            const { matchId } = payload;
            try {
                const match = await scoringService.undoLastEvent(matchId);
                
                io.to(matchId).emit('event_undone', { 
                    matchId, 
                    score: match.score_details, 
                    events: match.match_events 
                });
                io.to('live_overview').emit('overview_update', { 
                    matchId, 
                    score: match.score_details, 
                    action: 'undo' 
                });

                logger.info(`◀️ [Socket] Event undone`, { matchId });
                if (callback) callback({ status: 'ok', score: match.score_details });
            } catch (error) {
                if (callback) callback({ status: 'error', message: error.message });
            }
        });

        // 10. Real-time Commentary
        socket.on('add_commentary', async (payload, callback) => {
            const { matchId, text } = payload;
            try {
                const match = await Match.findByPk(matchId);
                const comm = { timestamp: new Date(), text };
                match.match_events = [...(match.match_events || []), { event_type: 'commentary', ...comm }];
                await match.save();

                io.to(matchId).emit('commentary_added', { matchId, commentary: comm });
                
                logger.info(`💬 [Socket] Commentary added`, { matchId, text });
                if (callback) callback({ status: 'ok' });
            } catch (error) {
                if (callback) callback({ status: 'error', message: error.message });
            }
        });

        socket.on('update_toss', async (payload, callback) => {
            const { matchId, winner_id, decision, details } = payload;
            try {
                const match = await matchService.updateToss(matchId, { winner_id, decision, details });
                
                io.to(matchId).emit('toss_updated', { matchId, toss: match.match_state.toss });
                io.to('live_overview').emit('overview_update', { 
                    matchId, 
                    score: match.score_details, 
                    action: 'toss_updated' 
                });

                logger.info(`🏏 [Socket] Toss Updated`, { matchId, winner_id, decision });
                if (callback) callback({ status: 'ok', toss: match.match_state.toss });
            } catch (error) {
                if (callback) callback({ status: 'error', message: error.message });
            }
        });

        socket.on('disconnect', () => {
            logger.info(`🔌 Client disconnected: ${socket.id}`);
        });
    });
};
