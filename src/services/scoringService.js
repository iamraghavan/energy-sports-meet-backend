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
 * Shared logic for standard sports (Football, etc.)
 */
exports.processStandardScore = async (matchId, data, transaction) => {
    const { points, team_id, player_id, event_type, details } = data;

    const match = await Match.findByPk(matchId, { transaction });
    if (!match) throw new Error('Match not found');

    // 1. Update Global Score
    let currentScore = tryParse(match.score_details);

    if (!currentScore[team_id]) currentScore[team_id] = { score: 0 };
    
    const prevScore = currentScore[team_id].score || 0;
    currentScore[team_id].score = prevScore + (points || 0);

    // 2. Log Event
    const newEvent = {
        timestamp: new Date(),
        event_type: event_type || 'score',
        team_id,
        player_id,
        value: points,
        details: details || `${prevScore} + ${points} = ${currentScore[team_id].score}`
    };
    const events = match.match_events || [];
    
    match.score_details = currentScore;
    match.match_events = [...events, newEvent];
    match.changed('score_details', true);
    match.changed('match_events', true);
    await match.save({ transaction });

    // 3. Update Player Performance
    if (player_id) {
        const mp = await MatchPlayer.findOne({
            where: { match_id: matchId, student_id: player_id },
            transaction
        });
        if (mp) {
            let stats = (mp.performance_stats && typeof mp.performance_stats === 'object' && !Array.isArray(mp.performance_stats))
                ? { ...mp.performance_stats }
                : {};
            const key = event_type || 'points';
            stats[key] = (stats[key] || 0) + (points || 1);
            mp.performance_stats = stats;
            mp.changed('performance_stats', true);
            await mp.save({ transaction });
        }
    }

    return { match, newEvent };
};

/**
 * Shared logic for Cricket (Ball-by-ball)
 */
exports.processCricketBall = async (matchId, data, transaction) => {
    const { 
        runs, is_wicket, wicket_type, extras, extra_type, 
        batting_team_id, striker_id, non_striker_id, bowler_id
    } = data;

    const match = await Match.findByPk(matchId, { transaction });
    if (!match) throw new Error('Match not found');

    const runsScored = (runs || 0);
    const extraRuns = (extras || 0);
    const totalBallRuns = runsScored + extraRuns;

    // 1. Update Team Score
    let score = tryParse(match.score_details);
        
    if (!score[batting_team_id] || typeof score[batting_team_id] !== 'object') {
        score[batting_team_id] = { runs: 0, wickets: 0, balls: 0, overs: "0.0" };
    }

    score[batting_team_id].runs += totalBallRuns;
    if (is_wicket) score[batting_team_id].wickets += 1;

    const isLegalBall = !['wide', 'noball'].includes(extra_type);
    if (isLegalBall) {
        score[batting_team_id].balls = (score[batting_team_id].balls || 0) + 1;
        score[batting_team_id].overs = toOverNotation(score[batting_team_id].balls);
    }

    // 2. Track State (Strike Rotation)
    let state = tryParse(match.match_state);
    
    // Simple strike rotation: 1 or 3 runs rotates strike
    if (runsScored % 2 !== 0 && striker_id && non_striker_id) {
        state.striker_id = non_striker_id;
        state.non_striker_id = striker_id;
    }

    // 3. Log Event
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
        overs: score[batting_team_id].overs,
        commentary: `${score[batting_team_id].overs}: ${runs} runs${is_wicket ? `, WICKET (${wicket_type})` : ''}`
    };
    
    const events = match.match_events || [];
    match.match_events = [...events, ballEvent];
    match.score_details = score;
    match.match_state = state;
    
    match.changed('score_details', true);
    match.changed('match_events', true);
    match.changed('match_state', true);
    await match.save({ transaction });

    // 3. Update Striker Stats
    if (striker_id) {
        const bats = await MatchPlayer.findOne({ where: { match_id: matchId, student_id: striker_id }, transaction });
        if (bats) {
            let s = (bats.performance_stats && typeof bats.performance_stats === 'object' && !Array.isArray(bats.performance_stats))
                ? { ...bats.performance_stats }
                : { runs: 0, balls: 0, fours: 0, sixes: 0 };
                
            if (extra_type !== 'wide') s.balls = (s.balls || 0) + 1;
            s.runs = (s.runs || 0) + runsScored;
            if (runsScored === 4) s.fours = (s.fours || 0) + 1;
            if (runsScored === 6) s.sixes = (s.sixes || 0) + 1;
            
            bats.performance_stats = s;
            bats.changed('performance_stats', true);
            await bats.save({ transaction });
        }
    }
    
    // 4. Update Bowler Stats
    if (bowler_id) {
        const bowl = await MatchPlayer.findOne({ where: { match_id: matchId, student_id: bowler_id }, transaction });
        if (bowl) {
            let s = (bowl.performance_stats && typeof bowl.performance_stats === 'object' && !Array.isArray(bowl.performance_stats))
                ? { ...bowl.performance_stats }
                : { balls: 0, overs: "0.0", runs_conceded: 0, wickets: 0, wides: 0, noballs: 0 };
                
            // Wides and No-balls add to bowler's runs_conceded
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
            
            bowl.performance_stats = s;
            bowl.changed('performance_stats', true);
            await bowl.save({ transaction });
        }
    }

    return { match, ballEvent };
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
