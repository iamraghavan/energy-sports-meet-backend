const { Match, MatchPlayer, Team, Sport, Student } = require('../models');

// Create a Match
exports.createMatch = async (req, res) => {
    try {
        const { sport_id, team_a_id, team_b_id, start_time, match_type, referee_name } = req.body;

        // Validation: Verify teams belong to sport, etc.

        const match = await Match.create({
            sport_id,
            team_a_id,
            team_b_id,
            start_time,
            status: 'scheduled',
            referee_name
        });

        res.status(201).json(match);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update Match Score
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

        // Emit Socket Event
        const io = req.app.get('io');
        io.to(matchId).emit('score_updated', {
            matchId,
            scoreDetails: score_details,
            status: match.status,
            winnerId: winner_id
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
        const matches = await Match.findAll({
            where: { sport_id: sportId },
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
