const { Match, Team, Sport, sequelize } = require('../models');
const logger = require('../utils/logger');

// @desc    Update live match score
// @access  Private (Scorer/Admin)
exports.updateScore = async (req, res) => {
    try {
        const { matchId } = req.params;
        const { score_details, status, match_events } = req.body;

        const match = await Match.findByPk(matchId);
        if (!match) return res.status(404).json({ error: 'Match not found' });

        // Update fields if provided
        if (score_details) match.score_details = { ...(match.score_details || {}), ...score_details };
        if (status) match.status = status;
        if (match_events) match.match_events = [...(match.match_events || []), ...match_events];

        await match.save();

        // 🚀 Socket Broadcast
        const io = req.app.get('io');
        if (io) {
            io.to(matchId).emit('score_update', match);
            io.to('live_overview').emit('match_status_change', match);
        }

        res.json({ message: 'Score updated successfully', match });
    } catch (error) {
        logger.error(`Scoring Error: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Start/Finalize match
// @access  Private (Scorer/Admin)
exports.updateMatchStatus = async (req, res) => {
    try {
        const { matchId } = req.params;
        const { status, winner_id } = req.body;

        const match = await Match.findByPk(matchId);
        if (!match) return res.status(404).json({ error: 'Match not found' });

        match.status = status;
        if (winner_id) match.winner_id = winner_id;

        await match.save();

        const io = req.app.get('io');
        if (io) {
            io.to(matchId).emit('match_status_update', { matchId, status, winner_id });
            io.to('live_overview').emit('match_status_change', match);
        }

        res.json({ message: `Match status updated to ${status}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Log match event
// @access  Private (Scorer)
exports.logMatchEvent = async (req, res) => {
    try {
        const { matchId } = req.params;
        const { type, player_id, team_id, value, commentary } = req.body;

        const match = await Match.findByPk(matchId);
        if (!match) return res.status(404).json({ error: 'Match not found' });

        const event = { type, player_id, team_id, value, commentary, timestamp: new Date() };
        match.match_events = [...(match.match_events || []), event];
        await match.save();

        const io = req.app.get('io');
        if (io) {
            io.to(matchId).emit('match_event', event);
        }

        res.json({ message: 'Event logged and broadcasted', event });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
