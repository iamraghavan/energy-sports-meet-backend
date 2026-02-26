const { Match, MatchPlayer, Team, Sport, Student, Registration, TeamMember, sequelize } = require('../models');
const { sendEmail } = require('../utils/email');
const { getMatchScheduledTemplate, getMatchLiveTemplate, getMatchResultTemplate } = require('../utils/emailTemplates');
const logger = require('../utils/logger');

/**
 * Create a Match (Service Layer)
 */
exports.createMatch = async (data) => {
    const t = await sequelize.transaction();
    try {
        const { sport_id, team_a_id, team_b_id, start_time, referee_name } = data;
        
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
                    is_substitute: false,
                    performance_stats: {}
                }));
                await MatchPlayer.bulkCreate(matchPlayersData, { transaction: t });
            }
        };

        await autoPopulateLineup(team_a_id);
        await autoPopulateLineup(team_b_id);

        await t.commit();

        // 3. Fetch Full Details for Notifications
        const fullMatch = await Match.findByPk(match.id, {
            include: [
                { model: Team, as: 'TeamA' },
                { model: Team, as: 'TeamB' },
                { model: Sport }
            ]
        });

        // 4. Send Notifications in Background
        this.broadcastMatchScheduled(fullMatch).catch(err => logger.error(`Match scheduled notification error: ${err.message}`));

        return fullMatch;
    } catch (error) {
        if (t) await t.rollback();
        throw error;
    }
};

/**
 * Update Match Details (Non-Score)
 */
exports.updateMatchDetails = async (matchId, updates) => {
    const match = await Match.findByPk(matchId);
    if (!match) throw new Error('Match not found');

    await match.update(updates);
    return match;
};

/**
 * Delete Match
 */
exports.deleteMatch = async (matchId) => {
    const match = await Match.findByPk(matchId);
    if (!match) throw new Error('Match not found');

    if (match.status === 'completed') {
        throw new Error('Completed matches cannot be deleted.');
    }

    await match.destroy();
    return match;
};

/**
 * Internal helper for Scheduled Notifications
 */
exports.broadcastMatchScheduled = async (match) => {
    const getEmails = async (teamId) => {
        if (!teamId) return [];
        const members = await TeamMember.findAll({
            where: { team_id: teamId },
            include: [{ model: Student, attributes: ['email'] }]
        });
        return members.map(m => m.Student && m.Student.email).filter(e => e);
    };

    const emailsA = await getEmails(match.team_a_id);
    const emailsB = await getEmails(match.team_b_id);
    const allRecipientEmails = [...new Set([...emailsA, ...emailsB])];

    if (allRecipientEmails.length > 0) {
        const template = getMatchScheduledTemplate({
            teamAName: match.TeamA ? match.TeamA.team_name : 'Team A',
            teamBName: match.TeamB ? match.TeamB.team_name : 'Team B',
            sportName: match.Sport.name,
            startTime: new Date(match.start_time).toLocaleString(),
            matchId: match.id
        });

        await Promise.all(allRecipientEmails.map(email =>
            sendEmail({
                to: email,
                subject: `Match Scheduled: ${match.Sport.name}`,
                text: template.text,
                html: template.html
            })
        ));
    }
};

/**
 * Handle Match Status Transitions (Scheduled -> Live -> Completed)
 * Includes Email Notifications
 */
exports.updateMatchStatus = async (matchId, { status, score_details, winner_id }) => {
    const match = await Match.findByPk(matchId, {
        include: [
            { model: Team, as: 'TeamA' },
            { model: Team, as: 'TeamB' },
            { model: Sport }
        ]
    });

    if (!match) throw new Error('Match not found');

    const prevStatus = match.status;
    if (status) match.status = status;
    if (score_details) match.score_details = score_details;
    if (winner_id) match.winner_id = winner_id;

    await match.save();

    // 1. Match Completed Logic (Could be extracted to a generic notification service later)
    if (prevStatus !== 'completed' && status === 'completed') {
        const winner = winner_id ? await Team.findByPk(winner_id) : null;
        logger.info(`Match ${matchId} completed. Winner: ${winner ? winner.team_name : 'Draw'}`);
    }

    return match;
};

/**
 * Handle Lineup Updates (Add/Remove Players)
 */
exports.updateLineup = async (matchId, { action, student_id, team_id, is_substitute }) => {
    if (action === 'add') {
        return await MatchPlayer.create({
            match_id: matchId,
            student_id,
            team_id,
            is_substitute: is_substitute || false
        });
    } else if (action === 'remove') {
        return await MatchPlayer.destroy({
            where: { match_id: matchId, student_id }
        });
    }
    throw new Error('Invalid action for lineup update');
};

/**
 * Update Toss Information
 */
exports.updateToss = async (matchId, { winner_id, decision, details }) => {
    const match = await Match.findByPk(matchId);
    if (!match) throw new Error('Match not found');

    let state = { ...(match.match_state || {}) };
    state.toss = {
        winner_id,
        decision, // 'bat', 'bowl', 'heads', 'tails', etc.
        details,
        updatedAt: new Date()
    };

    match.match_state = state;
    match.changed('match_state', true);
    await match.save();

    return match;
};

/**
 * Bulk Update Match Lineup
 */
exports.bulkUpdateLineup = async (matchId, { players, team_id }) => {
    const t = await sequelize.transaction();
    try {
        const match = await Match.findByPk(matchId, { transaction: t });
        if (!match) throw new Error('Match not found');

        // 1. Clear existing players for this match
        // If team_id is provided, only clear that team's players
        const whereClause = { match_id: matchId };
        if (team_id) whereClause.team_id = team_id;
        
        await MatchPlayer.destroy({ where: whereClause, transaction: t });

        // 2. Prepare new players data
        const playersData = players.map(p => ({
            match_id: matchId,
            team_id: p.team_id || team_id || (p.player_id === match.team_a_id ? match.team_a_id : match.team_b_id), // Fallback logic
            student_id: p.player_id || p.student_id,
            is_substitute: p.is_substitute || false,
            performance_stats: {}
        }));

        // 3. Bulk Create
        const lineup = await MatchPlayer.bulkCreate(playersData, { transaction: t });

        await t.commit();
        return lineup;
    } catch (error) {
        if (t) await t.rollback();
        throw error;
    }
};
