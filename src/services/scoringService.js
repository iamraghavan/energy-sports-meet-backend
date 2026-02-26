const { Match, MatchPlayer, sequelize } = require('../models');
const logger = require('../utils/logger');

const toOverNotation = (totalBalls) => {
    const overs = Math.floor(totalBalls / 6);
    const balls = totalBalls % 6;
    return `${overs}.${balls}`;
};

/**
 * Robust JSON parsing for MySQL JSON columns
 */
const tryParse = (val) => {
    if (typeof val === 'string') {
        try { return JSON.parse(val); } catch (e) { return {}; }
    }
    return val || {};
};

/**
 * Shared logic for standard sports (Football, Kabaddi, etc.) - Firebase-Centric
 */
exports.processStandardScore = async (matchId, data) => {
    const { points, team_id, player_id, event_type, details } = data;
    const firebaseSyncService = require('./firebaseSyncService');

    const updatedState = await firebaseSyncService.updateMatchLiveState(matchId, (currentData) => {
        const score = currentData.score_details || {};
        const playerStats = currentData.player_performance || {};

        if (!score[team_id]) score[team_id] = { score: 0 };
        
        const prevScore = score[team_id].score || 0;
        score[team_id].score = prevScore + (points || 0);

        if (player_id) {
            const s = playerStats[player_id] || {};
            const key = event_type || 'points';
            s[key] = (s[key] || 0) + (points || 1);
            playerStats[player_id] = s;
        }

        return {
            ...currentData,
            score_details: score,
            player_performance: playerStats
        };
    });

    // 2. Create Event Record
    const newEvent = {
        timestamp: new Date(),
        event_type: event_type || 'score',
        team_id,
        player_id: player_id || null,
        value: points || 0,
        details: details || `+${points} points (New Score: ${updatedState.score_details[team_id].score})`
    };

    // Firebase History (Universal point-by-point tracking)
    await firebaseSyncService.syncMatchEvent(matchId, newEvent);

    return { match: updatedState, newEvent };
};

/**
 * Shared logic for Cricket (Ball-by-ball) - Firebase-Centric
 */
exports.processCricketBall = async (matchId, data) => {
    const { 
        runs, is_wicket, wicket_type, extras, extra_type, 
        batting_team_id, striker_id, non_striker_id, bowler_id
    } = data;

    const firebaseSyncService = require('./firebaseSyncService');
    
    const updatedState = await firebaseSyncService.updateMatchLiveState(matchId, (currentData) => {
        const score = currentData.score_details || {};
        const state = currentData.match_state || {};
        const playerStats = currentData.player_performance || {};

        const runsScored = (runs || 0);
        const extraRuns = (extras || 0);
        const totalBallRuns = runsScored + extraRuns;

        if (!score[batting_team_id]) {
            score[batting_team_id] = { runs: 0, wickets: 0, balls: 0, overs: "0.0" };
        }

        const team = score[batting_team_id];
        team.runs += totalBallRuns;
        if (is_wicket) team.wickets += 1;

        const isLegalBall = !['wide', 'noball'].includes(extra_type);
        if (isLegalBall) {
            team.balls = (team.balls || 0) + 1;
            team.overs = toOverNotation(team.balls);
        }

        if (runsScored % 2 !== 0 && striker_id && non_striker_id) {
            state.striker_id = non_striker_id;
            state.non_striker_id = striker_id;
        } else {
            state.striker_id = striker_id || state.striker_id;
            state.non_striker_id = non_striker_id || state.non_striker_id;
        }
        state.bowler_id = bowler_id || state.bowler_id;
        state.batting_team_id = batting_team_id;

        if (striker_id) {
            const s = playerStats[striker_id] || { runs: 0, balls: 0, fours: 0, sixes: 0 };
            if (extra_type !== 'wide') s.balls = (s.balls || 0) + 1;
            s.runs = (s.runs || 0) + runsScored;
            if (runsScored === 4) s.fours = (s.fours || 0) + 1;
            if (runsScored === 6) s.sixes = (s.sixes || 0) + 1;
            playerStats[striker_id] = s;
        }

        if (bowler_id) {
            const s = playerStats[bowler_id] || { balls: 0, overs: "0.0", runs_conceded: 0, wickets: 0, wides: 0, noballs: 0 };
            const bowlerRuns = runsScored + (['wide', 'noball'].includes(extra_type) ? extraRuns : 0);
            s.runs_conceded = (s.runs_conceded || 0) + bowlerRuns;
            if (isLegalBall) {
                s.balls = (s.balls || 0) + 1;
                s.overs = toOverNotation(s.balls);
            }
            if (extra_type === 'wide') s.wides = (s.wides || 0) + 1;
            if (extra_type === 'noball') s.noballs = (s.noballs || 0) + 1;
            if (is_wicket && !['runout', 'retired_hurt'].includes(wicket_type)) {
                s.wickets = (s.wickets || 0) + 1;
            }
            playerStats[bowler_id] = s;
        }

        return {
            ...currentData,
            score_details: score || {},
            match_state: state || {},
            player_performance: playerStats || {},
            last_ball: {
                runs: runsScored || 0,
                extras: extraRuns || 0,
                extra_type: extra_type || null,
                is_wicket: !!is_wicket,
                wicket_type: wicket_type || null,
                striker_id: striker_id || null,
                bowler_id: bowler_id || null,
                timestamp: Date.now()
            }
        };
    });

    const ballEvent = {
        timestamp: new Date(),
        event_type: 'delivery',
        batting_team_id,
        runs,
        extras,
        extra_type,
        is_wicket,
        wicket_type,
        striker_id,
        bowler_id,
        overs: updatedState.score_details[batting_team_id].overs,
        commentary: `${updatedState.score_details[batting_team_id].overs}: ${runs} runs${is_wicket ? `, WICKET (${wicket_type})` : ''}`
    };

    await firebaseSyncService.syncCricketBall(matchId, { last_ball_event: ballEvent });

    return { match: updatedState, ballEvent };
};

/**
 * Undo the last event in a match
 */
exports.undoLastEvent = async (matchId) => {
    const t = await sequelize.transaction();
    try {
        const match = await Match.findByPk(matchId, { transaction: t });
        if (!match) throw new Error('Match not found');

        const events = [...(match.match_events || [])];
        if (events.length === 0) throw new Error('No events to undo');

        const lastEvent = events.pop();
        logger.info(`◀️ Undoing last event: ${lastEvent.event_type}`, { matchId });

        // Reverse Score Impact
        let score = tryParse(match.score_details);
        if (lastEvent.event_type === 'delivery') {
            const tid = lastEvent.batting_team_id;
            if (score[tid]) {
                const totalRuns = (lastEvent.runs || 0) + (lastEvent.extras || 0);
                score[tid].runs -= totalRuns;
                if (lastEvent.is_wicket) score[tid].wickets -= 1;
                
                const isLegalBall = !['wide', 'noball'].includes(lastEvent.extra_type);
                if (isLegalBall) {
                    score[tid].balls -= 1;
                    score[tid].overs = toOverNotation(score[tid].balls);
                }
            }
            
            // Revert Striker Stats
            if (lastEvent.striker_id) {
                const bats = await MatchPlayer.findOne({ where: { match_id: matchId, student_id: lastEvent.striker_id }, transaction: t });
                if (bats) {
                    let s = { ...bats.performance_stats };
                    if (lastEvent.extra_type !== 'wide') s.balls -= 1;
                    s.runs -= (lastEvent.runs || 0);
                    if (lastEvent.runs === 4) s.fours -= 1;
                    if (lastEvent.runs === 6) s.sixes -= 1;
                    bats.performance_stats = s;
                    bats.changed('performance_stats', true);
                    await bats.save({ transaction: t });
                }
            }

            // Revert Bowler Stats
            if (lastEvent.bowler_id) {
                const bowl = await MatchPlayer.findOne({ where: { match_id: matchId, student_id: lastEvent.bowler_id }, transaction: t });
                if (bowl) {
                    let s = { ...bowl.performance_stats };
                    const bowlerRuns = (lastEvent.runs || 0) + (['wide', 'noball'].includes(lastEvent.extra_type) ? (lastEvent.extras || 0) : 0);
                    s.runs_conceded -= bowlerRuns;
                    if (isLegalBall) {
                        s.balls -= 1;
                        s.overs = toOverNotation(s.balls);
                    }
                    if (lastEvent.extra_type === 'wide') s.wides -= 1;
                    if (lastEvent.extra_type === 'noball') s.noballs -= 1;
                    if (lastEvent.is_wicket && !['runout', 'retired_hurt'].includes(lastEvent.wicket_type)) {
                        s.wickets -= 1;
                    }
                    bowl.performance_stats = s;
                    bowl.changed('performance_stats', true);
                    await bowl.save({ transaction: t });
                }
            }

        } else if (lastEvent.event_type === 'score' || lastEvent.event_type === 'goal' || lastEvent.event_type === 'point') {
            const tid = lastEvent.team_id;
            if (score[tid]) {
                score[tid].score -= (lastEvent.value || 0);
            }
        }

        match.match_events = events;
        match.score_details = score;
        match.changed('match_events', true);
        match.changed('score_details', true);

        await match.save({ transaction: t });
        await t.commit();

        return match;
    } catch (error) {
        if (t) await t.rollback();
        throw error;
    }
};

/**
 * Update Match Timer State
 */
exports.updateTimer = async (matchId, timerData) => {
    const match = await Match.findByPk(matchId);
    if (!match) throw new Error('Match not found');

    let score = { ...(match.score_details || {}) };
    score.timer = {
        ...(score.timer || {}),
        ...timerData,
        updatedAt: new Date()
    };

    match.score_details = score;
    match.changed('score_details', true);
    await match.save();

    return match;
};

/**
 * Syncs the final state from Firebase back to MySQL for long-term archival.
 * Called when match status moves to 'completed'.
 */
exports.syncFinalToMySQL = async (matchId) => {
    const firebaseSyncService = require('./firebaseSyncService');
    const liveData = await firebaseSyncService.getMatchLiveState(matchId);
    
    if (!liveData) {
        logger.warn(`⚠️ No live data found in Firebase for archival: ${matchId}`);
        return;
    }

    const t = await sequelize.transaction();
    try {
        // 1. Update Match Score & History
        await Match.update({
            score_details: liveData.score_details || {},
            match_state: liveData.match_state || {},
            match_events: liveData.match_events || []
        }, { where: { id: matchId }, transaction: t });

        // 2. Update Player Performance Stats
        const stats = liveData.player_performance || {};
        for (const [studentId, performance] of Object.entries(stats)) {
            await MatchPlayer.update(
                { performance_stats: performance },
                { where: { match_id: matchId, student_id: studentId }, transaction: t }
            );
        }

        await t.commit();
        logger.info(`✅ Match Archival Success (MySQL): ${matchId}`);
    } catch (error) {
        if (t) await t.rollback();
        logger.error(`❌ Match Archival Error (MySQL): ${matchId}`, error);
        throw error;
    }
};

/**
 * Record a Card (Yellow/Red)
 */
exports.processCard = async (matchId, data) => {
    const { team_id, player_id, card_type, minute } = data;
    const match = await Match.findByPk(matchId);
    if (!match) throw new Error('Match not found');

    const cardEvent = {
        timestamp: new Date(),
        event_type: 'card',
        card_type, // 'yellow' | 'red'
        team_id,
        player_id,
        minute,
        details: `${card_type.toUpperCase()} Card issued to player ${player_id}`
    };

    const events = [...(match.match_events || []), cardEvent];
    match.match_events = events;
    match.changed('match_events', true);
    await match.save();

    return { match, cardEvent };
};
