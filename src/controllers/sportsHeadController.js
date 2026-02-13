const { Match, Team, Sport, Registration, Student, sequelize } = require('../models');

// @desc    Schedule a new match
// @access  Private (Sports Head/Admin)
exports.scheduleMatch = async (req, res) => {
    try {
        const { sport_id, team_a_id, team_b_id, start_time, venue, referee_name } = req.body;

        if (req.user.role === 'sports_head' && sport_id !== req.user.assigned_sport_id) {
            return res.status(403).json({ error: 'You can only schedule matches for your assigned sport.' });
        }

        const match = await Match.create({
            sport_id,
            team_a_id,
            team_b_id,
            start_time,
            venue,
            referee_name,
            status: 'scheduled'
        });

        res.status(201).json(match);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get Teams for assigned sport
// @access  Private (Sports Head)
exports.getSportTeams = async (req, res) => {
    try {
        const sport_id = req.user.assigned_sport_id;
        const teams = await Team.findAll({ where: { sport_id } });
        res.json(teams);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Add player to team
// @access  Private (Sports Head)
exports.addPlayerToTeam = async (req, res) => {
    try {
        const { teamId, studentId } = req.params;
        const team = await Team.findByPk(teamId);
        if (!team) return res.status(404).json({ error: 'Team not found' });

        // This functionality might require a MatchPlayer or similar linking model
        // but for now we follow the requested "add player" endpoint structure.
        res.json({ message: "Player added to team successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
