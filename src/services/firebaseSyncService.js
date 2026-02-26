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

exports.syncCricketBall = async (matchId, cricketData) => {
    // Expected to receive the granular data needed by frontend
    await pushToFirebase(`sports/matches/${matchId}`, cricketData);
};
