const { Match, MatchPlayer, Team, Sport, Student, Registration, TeamMember } = require('../models');
const { sendEmail } = require('../utils/email');
const { getMatchLiveTemplate, getMatchResultTemplate } = require('../utils/emailTemplates');
const logger = require('../utils/logger');

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

    // --- BROADCAST NOTIFICATIONS (EMAIL) ---
    const handleEmailBroadcast = async (templateFunc, data, subjectSuffix) => {
        const registrations = await Registration.findAll({
            where: { sport_id: match.sport_id, status: 'approved' },
            include: [{ model: Student, attributes: ['email'] }]
        });
        const allEmails = registrations.map(r => r.Student && r.Student.email).filter(e => e);
        if (allEmails.length === 0) return;

        const template = templateFunc(data);
        Promise.all(allEmails.map(email =>
            sendEmail({
                to: email,
                subject: `Broadcast: ${match.Sport.name} - ${subjectSuffix}`,
                text: template.text,
                html: template.html
            })
        )).catch(err => logger.error(`Email Broadcast Error: ${err.message}`));
    };

    // 1. Match Goes Live
    if (prevStatus === 'scheduled' && status === 'live') {
        handleEmailBroadcast(getMatchLiveTemplate, {
            teamAName: match.TeamA ? match.TeamA.team_name : 'Team A',
            teamBName: match.TeamB ? match.TeamB.team_name : 'Team B',
            sportName: match.Sport.name
        }, 'LIVE');
    }

    // 2. Match Completed
    if (prevStatus !== 'completed' && status === 'completed') {
        const winner = winner_id ? await Team.findByPk(winner_id) : null;
        const scoreSummary = Object.entries(match.score_details || {}).map(([tid, score]) => {
            const name = tid === match.team_a_id ? (match.TeamA?.team_name || 'Team A') : (match.TeamB?.team_name || 'Team B');
            return `${name}: ${typeof score === 'object' ? JSON.stringify(score) : score}`;
        }).join(' | ');

        handleEmailBroadcast(getMatchResultTemplate, {
            teamAName: match.TeamA ? match.TeamA.team_name : 'Team A',
            teamBName: match.TeamB ? match.TeamB.team_name : 'Team B',
            winnerName: winner ? winner.team_name : 'TBD',
            finalScore: scoreSummary,
            matchId: match.id
        }, 'COMPLETED');
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
