const { Match, MatchPlayer, Team, Sport, Student, Registration, TeamMember, sequelize } = require('../models');
const { sendEmail } = require('../utils/email');
const { getMatchScheduledTemplate, getMatchLiveTemplate, getMatchResultTemplate } = require('../utils/emailTemplates');
const logger = require('../utils/logger');
const scoringService = require('../services/scoringService');
const matchService = require('../services/matchService');

// Create a Match
exports.createMatch = async (req, res) => {
    try {
        const match = await matchService.createMatch(req.body);

        // Sync with Firebase (Full Match Details)
        try {
            const firebaseSyncService = require('../services/firebaseSyncService');
            await firebaseSyncService.syncFullMatch(match);
        } catch (syncError) {
            logger.error(`⚠️ Firebase Sync Failed during creation for Match ${match.id}: ${syncError.message}`);
        }

        res.status(201).json(match);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update Match Details (Non-Score)
exports.updateMatchDetails = async (req, res) => {
    try {
        const { matchId } = req.params;
        const match = await matchService.updateMatchDetails(matchId, req.body);

        // Sync with Firebase (Full Match Details)
        try {
            const firebaseSyncService = require('../services/firebaseSyncService');
            // Fetch full record to ensure Teams and Sport are included
            const fullMatch = await Match.findByPk(matchId, {
                include: [
                    { model: Team, as: 'TeamA' },
                    { model: Team, as: 'TeamB' },
                    { model: Sport }
                ]
            });
            await firebaseSyncService.syncFullMatch(fullMatch);
        } catch (syncError) {
            logger.error(`⚠️ Firebase Sync Failed during update for Match ${matchId}: ${syncError.message}`);
        }

        res.json({ message: 'Match details updated', match });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete Match
exports.deleteMatch = async (req, res) => {
    try {
        const { matchId } = req.params;
        await matchService.deleteMatch(matchId);

        // Sync with Firebase (set status to deleted or remove node)
        const firebaseSyncService = require('../services/firebaseSyncService');
        await firebaseSyncService.syncStatus(matchId, 'deleted');

        res.json({ message: 'Match deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ------------------------------------------------------------------
// A. Standard Scoring (Football, Kabaddi, Volleyball, etc.)
// ------------------------------------------------------------------
exports.updateScoreStandard = async (req, res) => {
    try {
        const { matchId } = req.params;
        // No SQL Transaction needed here - logic is Firebase-first
        const { match, newEvent } = await scoringService.processStandardScore(matchId, req.body);

        res.json({ message: 'Standard score updated (Firebase)', score: match.score_details, event: newEvent });

    } catch (error) {
        logger.error(`❌ Standard Score Error: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

// ------------------------------------------------------------------
// B. Cricket Scoring (Ball-by-Ball)
// ------------------------------------------------------------------
exports.updateScoreCricket = async (req, res) => {
    try {
        const { matchId } = req.params;
        // No SQL Transaction - Using Firebase transactions internally
        const { match, ballEvent } = await scoringService.processCricketBall(matchId, req.body);

        res.json({ message: 'Ball logged (Firebase)', score: match.score_details, ball: ballEvent });

    } catch (error) {
        logger.error(`❌ Cricket Score Error: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

// Update Match Score (Generic Wrapper & Status Changes)
exports.updateScore = async (req, res) => {
    try {
        const { matchId } = req.params;
        const { status } = req.body;

        const match = await matchService.updateMatchStatus(matchId, req.body);

        // If match is completed, perform final archival from Firebase to MySQL
        if (status === 'completed' || status === 'finished') {
            try {
                await scoringService.syncFinalToMySQL(matchId);
            } catch (archiveError) {
                logger.error(`⚠️ Archival Sync Failed for Match ${matchId}: ${archiveError.message}`);
            }
        }

        // Sync metadata/status with Firebase
        const firebaseSyncService = require('../services/firebaseSyncService');
        await firebaseSyncService.syncFullMatch(match);

        res.json({ message: 'Score/Status updated', match });
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

// Update Lineup (Add/Remove Player or Bulk Update)
exports.updateLineup = async (req, res) => {
    try {
        const { matchId } = req.params;
        const { players, action, student_id } = req.body;
        const firebaseSyncService = require('../services/firebaseSyncService');

        logger.info(`📋 [Lineup] Request for Match ${matchId}`, { 
            hasPlayers: !!players, 
            isPlayersArray: Array.isArray(players),
            playersCount: Array.isArray(players) ? players.length : 0,
            action 
        });

        if (Array.isArray(players) && players.length > 0) {
            // 1. Handle Bulk Update
            const newLineup = await matchService.bulkUpdateLineup(matchId, req.body);
            
            // Broadcast Full Update
            await firebaseSyncService.syncMatchUpdate(matchId, { lineup: newLineup });
            return res.json({ message: 'Lineup bulk updated', count: newLineup.length });
        } else {
            // 2. Handle Single Player (Add/Remove)
            await matchService.updateLineup(matchId, req.body);
            
            // Broadcast Single Change (Pushing to a generic 'last_lineup_action' node for now)
            await firebaseSyncService.syncMatchUpdate(matchId, { last_lineup_action: { action, student_id } });
            return res.json({ message: 'Lineup updated' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update Match Event (Dynamic Scoring)
// Payload: { event_type: 'goal'|'run'|'wicket', player_id, team_id, value: 1, key: 'runs'|'goals', score_override: {} }
exports.updateMatchEvent = async (req, res) => {
    try {
        const { matchId } = req.params;
        const { points, value, event_type, player_id, team_id, details } = req.body;

        // Use the new standard scoring logic (Firebase-First)
        // Note: 'value' and 'points' are often used interchangeably in different frontend versions
        const { match, newEvent } = await scoringService.processStandardScore(matchId, {
            points: points || value || 0,
            team_id,
            player_id,
            event_type,
            details
        });

        res.json({ 
            message: 'Event logged to Firebase (MySQL skipped)', 
            score: match.score_details,
            event: newEvent 
        });

    } catch (error) {
        logger.error(`❌ Match Event Error: ${error.message}`);
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

// Update Match Transient State (Striker, Bowler, etc.)
exports.updateMatchState = async (req, res) => {
    try {
        const { matchId } = req.params;
        const { match, state } = await scoringService.processMatchStateUpdate(matchId, req.body);
        res.json({ message: 'Match state updated (Firebase)', state });
    } catch (error) {
        logger.error(`❌ Match State Error: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

// Update Match Toss Result
exports.updateToss = async (req, res) => {
    try {
        const { matchId } = req.params;
        const { match, toss } = await scoringService.processTossUpdate(matchId, req.body);
        res.json({ message: 'Toss updated (Firebase)', toss });
    } catch (error) {
        logger.error(`❌ Toss Update Error: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};
