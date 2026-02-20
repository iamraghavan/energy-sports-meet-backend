const { Match, MatchPlayer, Team, Sport, Student, Registration, TeamMember, sequelize } = require('../models');
const { sendEmail } = require('../utils/email');
const { getMatchScheduledTemplate, getMatchLiveTemplate, getMatchResultTemplate } = require('../utils/emailTemplates');
const logger = require('../utils/logger');
const scoringService = require('../services/scoringService');
const matchService = require('../services/matchService');

// Create a Match
exports.createMatch = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { sport_id, team_a_id, team_b_id, start_time, referee_name } = req.body;
        
        // 1. Create Match
        const match = await Match.create({
            sport_id,
            team_a_id,
            team_b_id,
            start_time,
            status: 'scheduled',
            referee_name
        }, { transaction: t });

        // 2. Auto-Populate Lineups
        const autoPopulateLineup = async (teamId) => {
            if (!teamId) return;
            const members = await TeamMember.findAll({
                where: { team_id: teamId },
                transaction: t
            });
            
            if (members.length > 0) {
                const matchPlayersData = members.map(m => ({
                    match_id: match.id,
                    team_id: teamId,
                    student_id: m.student_id,
                    is_substitute: false, // Default all as starting players
                    performance_stats: {}
                }));
                await MatchPlayer.bulkCreate(matchPlayersData, { transaction: t });
            }
        };

        await autoPopulateLineup(team_a_id);
        await autoPopulateLineup(team_b_id);

        await t.commit();

        // 3. Fetch Details for Notification
        const fullMatch = await Match.findByPk(match.id, {
            include: [
                { model: Team, as: 'TeamA' },
                { model: Team, as: 'TeamB' },
                { model: Sport }
            ]
        });

        // 4. Fetch Team Member Emails for Notifications
        const getEmails = async (teamId) => {
            if (!teamId) return [];
            const members = await TeamMember.findAll({
                where: { team_id: teamId },
                include: [{ model: Student, attributes: ['email'] }]
            });
            return members.map(m => m.Student && m.Student.email).filter(e => e);
        };

        const emailsA = await getEmails(team_a_id);
        const emailsB = await getEmails(team_b_id);
        const allRecipientEmails = [...new Set([...emailsA, ...emailsB])];

        // 5. Send Notifications
        if (allRecipientEmails.length > 0) {
            const template = getMatchScheduledTemplate({
                teamAName: fullMatch.TeamA ? fullMatch.TeamA.team_name : 'Team A',
                teamBName: fullMatch.TeamB ? fullMatch.TeamB.team_name : 'Team B',
                sportName: fullMatch.Sport.name,
                startTime: new Date(start_time).toLocaleString(),
                matchId: match.id
            });

            Promise.all(allRecipientEmails.map(email =>
                sendEmail({
                    to: email,
                    subject: `Match Scheduled: ${fullMatch.Sport.name}`,
                    text: template.text,
                    html: template.html
                })
            )).catch(err => console.error('Delayed Match Emails Error:', err.message));
        }

        // Emit Socket Event
        const io = req.app.get('io');
        io.to('live_overview').emit('overview_update', { action: 'create', match });

        res.status(201).json(match);
    } catch (error) {
        if (t) await t.rollback();
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

        // User Constraint: Only scheduled or live matches can be deleted
        if (match.status === 'completed') {
            return res.status(403).json({ 
                error: 'Completed matches cannot be deleted. Contact Admin if this was a mistake.' 
            });
        }

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

// ------------------------------------------------------------------
// A. Standard Scoring (Football, Kabaddi, Volleyball, etc.)
// Payload: { points, team_id, player_id, event_type: 'goal'|'point'|'foul' }
// ------------------------------------------------------------------
exports.updateScoreStandard = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { matchId } = req.params;
        const { match, newEvent } = await scoringService.processStandardScore(matchId, req.body, t);

        await t.commit();

        // 4. Socket Broadcast
        const io = req.app.get('io');
        io.to(matchId).emit('score_updated', { matchId, score: match.score_details, event: newEvent });
        io.to('live_overview').emit('overview_update', { matchId, score: match.score_details });

        res.json({ message: 'Standard score updated', score: match.score_details });

    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

// ------------------------------------------------------------------
// B. Cricket Scoring (Ball-by-Ball)
// Payload: { runs: 0-6, is_wicket, wicket_type, extras, extra_type, striker_id, non_striker_id, bowler_id }
// ------------------------------------------------------------------
exports.updateScoreCricket = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { matchId } = req.params;
        const { match, ballEvent } = await scoringService.processCricketBall(matchId, req.body, t);

        await t.commit();

        // Socket Broadcast
        const io = req.app.get('io');
        io.to(matchId).emit('cricket_score_update', { 
            matchId, 
            score: match.score_details, 
            last_ball: ballEvent 
        });
        io.to('live_overview').emit('overview_update', { matchId, score: match.score_details });

        res.json({ message: 'Ball logged', score: match.score_details });

    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

// Update Match Score (Legacy/Generic Wrapper)
exports.updateScore = async (req, res) => {
    try {
        const { matchId } = req.params;
        const match = await matchService.updateMatchStatus(matchId, req.body);

        // Emit Socket Events
        const io = req.app.get('io');
        io.to(matchId).emit('score_updated', {
            matchId,
            scoreDetails: match.score_details,
            status: match.status,
            winnerId: match.winner_id
        });

        io.to('live_overview').emit('overview_update', {
            matchId,
            sportId: match.sport_id,
            scoreSummary: match.score_details,
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
            include: [{ model: Student, attributes: ['id', 'name'] }]
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
        const { action, student_id } = req.body;
        
        await matchService.updateLineup(matchId, req.body);

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

// Get Team Details (For Scorer Lineup Selection)
// Mimics sportsHeadController.getTeamDetails but accessible to Scorers
exports.getScorerTeamDetails = async (req, res) => {
    try {
        const { teamId } = req.params;

        const team = await Team.findByPk(teamId, {
            include: [
                { model: Sport, attributes: ['id', 'name'] },
                { 
                    model: Student, 
                    as: 'Captain',
                    attributes: ['name', 'mobile']
                }
            ]
        });

        if (!team) return res.status(404).json({ error: 'Team not found' });

        // Get members
        const members = await TeamMember.findAll({
            where: { team_id: teamId },
            include: [{ model: Student, attributes: ['id', 'name', 'mobile'] }]
        }); 

        res.json({ ...team.toJSON(), members });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
