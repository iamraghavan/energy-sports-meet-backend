const { db } = require('../config/firebase');
const logger = require('../utils/logger');

/**
 * Pushes data to a specified path in the Firebase Realtime Database.
 * Runs asynchronously and catches its own errors to avoid blocking the HTTP response.
 * @param {string} path - The DB path (e.g., 'sports/matches/123')
 * @param {object} data - The data object to merge/update
 */
const pushToFirebase = async (path, data) => {
    if (!db) return; // Silent return if Firebase is not configured via ENV
    try {
        const ref = db.ref(path);
        // Using update() performs a partial merge rather than overwriting the whole node
        await ref.update({
            ...data,
            last_updated: Date.now()
        });
        logger.info(`🔥 Firebase Sync Success: ${path}`);
    } catch (error) {
        logger.error(`❌ Firebase Sync Error for path ${path}:`, error.message);
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
    // Structure the data for the frontend
    const payload = {
        id: match.id,
        sport: match.Sport ? match.Sport.name : 'Unknown',
        sport_id: match.sport_id,
        status: match.status,
        venue: match.venue,
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
        score_details: match.score_details || {},
        match_state: match.match_state || {},
        toss: match.match_state?.toss || null
    };
    await pushToFirebase(`sports/matches/${match.id}`, payload);
};

exports.syncCricketBall = async (matchId, cricketData) => {

    // Expected to receive the granular data needed by frontend
    await pushToFirebase(`sports/matches/${matchId}`, cricketData);
};
