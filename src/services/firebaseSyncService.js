const { db } = require('../config/firebase');
const logger = require('../utils/logger');

/**
 * Recursively removes 'undefined' values from an object.
 * Firebase RTDB throws an error for 'undefined' but accepts 'null'.
 */
const stripUndefined = (obj) => {
    if (obj && typeof obj === 'object') {
        Object.keys(obj).forEach(key => {
            if (obj[key] === undefined) {
                delete obj[key];
            } else if (typeof obj[key] === 'object') {
                stripUndefined(obj[key]);
            }
        });
    }
    return obj;
};

/**
 * Pushes data to a specified path in the Firebase Realtime Database.
 * Runs asynchronously and catches its own errors to avoid blocking the HTTP response.
 * @param {string} path - The DB path (e.g., 'sports/matches/123')
 * @param {object} data - The data object to merge/update
 */
const pushToFirebase = async (path, data) => {
    if (!db) {
        logger.warn(`⚠️ Firebase Sync Skipped: DB instance not initialized. Check your ENV variables.`);
        return;
    }
    try {
        const cleanData = stripUndefined({ ...data }); // Ensure no 'undefined' properties
        const ref = db.ref(path);
        // Using update() performs a partial merge rather than overwriting the whole node
        await ref.update({
            ...cleanData,
            last_updated: Date.now()
        });
        logger.info(`🔥 Firebase Sync Success: ${path}`);
    } catch (error) {
        logger.error(`❌ Firebase Sync Error for path ${path}:`, error);
    }
};

/**
 * Service specifically for synchronizing Match data
 */
exports.syncMatchUpdate = async (matchId, payload) => {
    await pushToFirebase(`sports/matches/${matchId}`, payload);
};

exports.syncScore = async (matchId, scoreDetails) => {
    await pushToFirebase(`sports/matches/${matchId}`, {
        score_details: scoreDetails
    });
};

exports.syncStatus = async (matchId, status) => {
    await pushToFirebase(`sports/matches/${matchId}`, { status });
};

exports.syncFullMatch = async (match) => {
    // Ensure JSON fields are parsed if they come back as strings from DB
    const parseJson = (val) => {
        if (typeof val === 'string') {
            try { return JSON.parse(val); } catch (e) { return {}; }
        }
        return val || {};
    };

    const scoreDetails = parseJson(match.score_details);
    const matchState = parseJson(match.match_state);
    const matchEvents = parseJson(match.match_events);

    // Structure the data for the frontend
    const payload = {
        id: match.id,
        sport: match.Sport ? match.Sport.name : 'Unknown',
        sport_id: match.sport_id,
        status: match.status,
        venue: match.venue || "",
        start_time: match.start_time,
        referee_name: match.referee_name,
        team_a: match.TeamA ? {
            id: match.TeamA.id,
            name: match.TeamA.team_name,
            college: match.TeamA.college_name
        } : null,
        team_b: match.TeamB ? {
            id: match.TeamB.id,
            name: match.TeamB.team_name,
            college: match.TeamB.college_name
        } : null,
        score_details: scoreDetails,
        match_state: matchState,
        toss: matchState?.toss || null,
        striker_id: matchState?.striker_id || null,
        non_striker_id: matchState?.non_striker_id || null,
        match_events: matchEvents || []
    };
    await pushToFirebase(`sports/matches/${match.id}`, payload);
};

/**
 * Appends a single event to the match's historical timeline in Firebase.
 * Useful for ball-by-ball history or point-by-point updates.
 */
const logEventToHistory = async (matchId, event, nodeName = 'ball_history') => {
    if (!db || !event) return;
    try {
        const ref = db.ref(`sports/matches/${matchId}/${nodeName}`);
        await ref.push({
            ...event,
            server_timestamp: Date.now()
        });
        logger.info(`🥎 Event Logged to Firebase History (${nodeName}): ${matchId}`);
    } catch (error) {
        logger.error(`❌ Firebase History Error for ${matchId}:`, error);
    }
};

exports.syncCricketBall = async (matchId, cricketData) => {
    // 1. Update the main match node (Score, State, last ball)
    await pushToFirebase(`sports/matches/${matchId}`, cricketData);

    // 2. Append to ball history
    if (cricketData.last_ball_event) {
        await logEventToHistory(matchId, cricketData.last_ball_event, 'ball_history');
    }
};
