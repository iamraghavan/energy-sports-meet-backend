const { Match, MatchPlayer, Team, Sport, Student } = require('../models');

// Create a Match
// Create a Match
exports.createMatch = async (req, res) => {
    try {
        const { sport_id, team_a_id, team_b_id, start_time, match_type, referee_name } = req.body;
        const match = await Match.create({
            sport_id,
            team_a_id,
            team_b_id,
            start_time,
            status: 'scheduled',
            referee_name
        });

        // Emit Socket Event
        const io = req.app.get('io');
        io.to('live_overview').emit('overview_update', { action: 'create', match });

        res.status(201).json(match);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update Match Details (Non-Score)
exports.updateMatchDetails = async (req, res) => {
    try {
        const { matchId } = req.params;
        const updates = req.body; // { start_time, referee_name, etc. }

        const match = await Match.findByPk(matchId);
        if (!match) return res.status(404).json({ error: 'Match not found' });

        await match.update(updates);

        // Emit Socket Events
        const io = req.app.get('io');
        io.to(matchId).emit('match_details_updated', match);
        io.to('live_overview').emit('overview_update', { action: 'update', match });

        res.json({ message: 'Match details updated', match });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete Match
exports.deleteMatch = async (req, res) => {
    try {
        const { matchId } = req.params;
        const match = await Match.findByPk(matchId);
        if (!match) return res.status(404).json({ error: 'Match not found' });

        await match.destroy();

        // Emit Socket Event
        const io = req.app.get('io');
        io.to('live_overview').emit('overview_update', { action: 'delete', matchId });
        io.to(matchId).emit('match_deleted', { matchId });

        res.json({ message: 'Match deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update Match Score & Live Broadcast
exports.updateScore = async (req, res) => {
    try {
        const { matchId } = req.params;
        const { score_details, status, winner_id } = req.body;

        const match = await Match.findByPk(matchId);
        if (!match) return res.status(404).json({ error: 'Match not found' });

        match.score_details = score_details;
        if (status) match.status = status;
        if (winner_id) match.winner_id = winner_id;

        await match.save();

        // Emit Socket Events
        const io = req.app.get('io');

        // 1. Detailed Update (For inside the match view)
        io.to(matchId).emit('score_updated', {
            matchId,
            scoreDetails: score_details,
            status: match.status,
            winnerId: winner_id
        });

        // 2. Overview Update (For the main dashboard list)
        io.to('live_overview').emit('overview_update', {
            matchId,
            sportId: match.sport_id,
            scoreSummary: score_details, // Frontend can parse main score
            status: match.status
        });

        res.json({ message: 'Score updated', match });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get Live Matches (All or Filtered)
exports.getLiveMatches = async (req, res) => {
    try {
        const { sportId } = req.query;
        let whereClause = { status: ['live', 'scheduled'] };
        if (sportId) {
            whereClause.sport_id = sportId;
        }

        const matches = await Match.findAll({
            where: whereClause,
            include: [
                { model: Team, as: 'TeamA' },
                { model: Team, as: 'TeamB' },
                { model: Sport }
            ],
            order: [['start_time', 'ASC']]
        });
        res.json(matches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get All Matches by Sport (History & Upcoming)
exports.getMatchesBySport = async (req, res) => {
    try {
        const { sportId } = req.params;
        const { status } = req.query; // Support filtering by status (e.g., 'completed', 'scheduled')

        let whereClause = { sport_id: sportId };
        if (status) {
            whereClause.status = status;
        }

        const matches = await Match.findAll({
            where: whereClause,
            include: [
                { model: Team, as: 'TeamA' },
                { model: Team, as: 'TeamB' },
                { model: Sport }
            ],
            order: [['start_time', 'DESC']]
        });
        res.json(matches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get Match by ID
exports.getMatchById = async (req, res) => {
    try {
        const { matchId } = req.params;
        const match = await Match.findByPk(matchId, {
            include: [
                { model: Team, as: 'TeamA' },
                { model: Team, as: 'TeamB' },
                { model: Sport }
            ]
        });

        if (!match) return res.status(404).json({ error: 'Match not found' });

        res.json(match);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get Match Lineup
exports.getMatchLineup = async (req, res) => {
    try {
        const { matchId } = req.params;
        const lineup = await MatchPlayer.findAll({
            where: { match_id: matchId },
            include: [{ model: Student, attributes: ['id', 'name', 'registration_code'] }]
        });
        res.json(lineup);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update Lineup (Add/Remove Player)
exports.updateLineup = async (req, res) => {
    try {
        const { matchId } = req.params;
        const { action, student_id, team_id, is_substitute } = req.body;

        if (action === 'add') {
            await MatchPlayer.create({
                match_id: matchId,
                student_id,
                team_id,
                is_substitute: is_substitute || false
            });
        } else if (action === 'remove') {
            await MatchPlayer.destroy({
                where: { match_id: matchId, student_id }
            });
        }

        // Emit Socket Event
        const io = req.app.get('io');
        io.to(matchId).emit('lineup_updated', { matchId, action, student_id });

        res.json({ message: 'Lineup updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update Match Event (Dynamic Scoring)
// Payload: { event_type: 'goal'|'run'|'wicket', player_id, team_id, value: 1, key: 'runs'|'goals', score_override: {} }
exports.updateMatchEvent = async (req, res) => {
    try {
        const { matchId } = req.params;
        const { event_type, player_id, team_id, value, key, details, score_override } = req.body;

        const match = await Match.findByPk(matchId);
        if (!match) return res.status(404).json({ error: 'Match not found' });

        // 1. Log Event
        const newEvent = {
            timestamp: new Date(),
            event_type,
            player_id,
            team_id,
            value,
            details
        };
        const currentEvents = match.match_events || [];
        match.match_events = [...currentEvents, newEvent];

        // 2. Update Global Score
        if (score_override) {
            match.score_details = score_override;
        } else {
            let currentScore = match.score_details || {};
            if (!currentScore[team_id]) currentScore[team_id] = {};
            const targetKey = key || 'score';
            if (currentScore[team_id][targetKey] === undefined) {
                currentScore[team_id][targetKey] = 0;
            }
            currentScore[team_id][targetKey] += (value || 0);
            match.score_details = currentScore;
            match.changed('score_details', true);
        }

        await match.save();

        // 3. Update Player Stats
        if (player_id) {
            const matchPlayer = await MatchPlayer.findOne({
                where: { match_id: matchId, student_id: player_id }
            });

            if (matchPlayer) {
                let stats = matchPlayer.performance_stats || {};
                const statKey = key || event_type;
                if (!stats[statKey]) stats[statKey] = 0;
                stats[statKey] += (value || 1);
                matchPlayer.performance_stats = stats;
                matchPlayer.changed('performance_stats', true);
                await matchPlayer.save();
            }
        }

        // Emit Socket Event
        const io = req.app.get('io');
        io.to(matchId).emit('match_event', { matchId, event: newEvent, score: match.score_details });
        io.to('live_overview').emit('overview_update', { action: 'score_update', matchId, score: match.score_details });

        res.json({ message: 'Event logged', score: match.score_details });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
