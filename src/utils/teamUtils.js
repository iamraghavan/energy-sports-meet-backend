const { Team, Student, Registration, TeamMember, Sport, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Ensures a team has a full roster of players based on sport requirements.
 * Adds "Dummy Player X" placeholders if needed.
 */
async function ensureFullRoster(teamId, sportId, transaction) {
    const sport = await Sport.findByPk(sportId, { transaction });
    if (!sport) return;

    // Minimum sensible roster size if max_players is not set or too small for team sports
    let targetSize = sport.max_players || 1;
    
    // For specific sports like Cricket, ensure at least 14 if max_players is generic
    if (sport.name.toLowerCase().includes('cricket') && targetSize < 14) {
        targetSize = 14;
    } else if (sport.type === 'Team' && targetSize === 1) {
        targetSize = 11; // Default for team sports if not specified
    }

    const currentCount = await TeamMember.count({ 
        where: { team_id: teamId },
        transaction 
    });

    if (currentCount < targetSize) {
        const dummyNeeded = targetSize - currentCount;
        for (let i = 1; i <= dummyNeeded; i++) {
            // Create Dummy Student
            const dummyStudent = await Student.create({
                name: `Dummy Player ${currentCount + i}`,
                city: 'Auto Generated',
                state: 'Auto Generated',
                other_college: 'System Placeholder'
            }, { transaction });

            // Add as Team Member
            await TeamMember.create({
                team_id: teamId,
                student_id: dummyStudent.id,
                role: 'Player'
            }, { transaction });
        }
    }
}

/**
 * Helper to resolve a team by ID or create one from a Registration if it doesn't exist.
 * Used for both individual and bulk player additions to support registration-based "teams".
 */
async function resolveOrCreateTeam(teamId, sport_id, transaction) {
    // 1. Try to find an explicit Team record first
    let team = await Team.findOne({ where: { id: teamId, sport_id }, transaction });
    if (team) return team;

    // 2. If not found, check if it's a Registration-based Pseudo-team (with or without REG- prefix)
    const cleanId = teamId.startsWith('REG-') ? teamId.replace('REG-', '') : teamId;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (uuidRegex.test(cleanId)) {
        const registration = await Registration.findByPk(cleanId, { transaction });
        if (registration) {
            // AUTO-CREATE TEAM from Registration
            let studentOwner = await Student.findOne({ 
                where: { [Op.or]: [{ mobile: registration.mobile }, { email: registration.email }] },
                transaction
            });

            if (!studentOwner) {
                studentOwner = await Student.create({
                    name: registration.name,
                    email: registration.email,
                    mobile: registration.mobile,
                    whatsapp: registration.whatsapp,
                    city: registration.city || registration.college_city,
                    state: registration.state || registration.college_state,
                    college_id: registration.college_id,
                    other_college: registration.other_college,
                    department: registration.department,
                    year_of_study: registration.year_of_study
                }, { transaction });
            }

            team = await Team.create({
                team_name: registration.college_name || registration.name || 'Tournament Team',
                captain_id: studentOwner.id,
                sport_id: sport_id,
                registration_id: registration.id,
                college_id: registration.college_id || 0,
                locked: false
            }, { transaction });

            // Add Owner as Captain in TeamMember
            await TeamMember.create({
                team_id: team.id,
                student_id: studentOwner.id,
                role: 'Captain'
            }, { transaction });

            // CRITICAL: Ensure full roster for team sports
            await ensureFullRoster(team.id, sport_id, transaction);

            return team;
        }
    }

    return null;
}

module.exports = {
    ensureFullRoster,
    resolveOrCreateTeam
};
