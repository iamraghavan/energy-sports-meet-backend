const { Sport } = require('../models');

/**
 * Resolves all sport IDs that share the same name as the assigned sport ID.
 * This is used to combine "Boys" and "Girls" categories in dashboards.
 * 
 * @param {number} assignedSportId - The primary sport ID assigned to the user.
 * @returns {Promise<number[]>} - Array of related sport IDs.
 */
async function getRelevantSportIds(assignedSportId) {
    if (!assignedSportId) return [];

    try {
        const assignedSport = await Sport.findByPk(assignedSportId);
        if (!assignedSport) return [assignedSportId];

        const allRelevantSports = await Sport.findAll({
            where: { name: assignedSport.name },
            attributes: ['id']
        });

        return allRelevantSports.map(s => s.id);
    } catch (error) {
        console.error('Error resolving relevant sport IDs:', error);
        return [assignedSportId];
    }
}

module.exports = {
    getRelevantSportIds
};
