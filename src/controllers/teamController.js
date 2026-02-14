const { Team, Sport, Student, Registration, sequelize } = require('../models');

// Get All Teams
exports.getAllTeams = async (req, res) => {
    try {
        const teams = await Team.findAll({
            include: [
                { model: Sport, attributes: ['id', 'name', 'category', 'type'] },
                {
                    model: Student,
                    as: 'Captain',
                    attributes: ['name', 'email'],
                    include: [{ model: College, attributes: ['name', 'city'] }]
                }
            ]
        });
        res.json(teams);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get Team By ID (with Members)
exports.getTeamById = async (req, res) => {
    try {
        const { id } = req.params;
        const team = await Team.findByPk(id, {
            include: [
                { model: Sport, attributes: ['id', 'name', 'category'] },
                {
                    model: Student,
                    as: 'Captain',
                    attributes: ['name', 'mobile'],
                    include: [{ model: College, attributes: ['name', 'city'] }]
                }
            ]
        });

        if (!team) return res.status(404).json({ error: 'Team not found' });

        // Fetch members separately via Registration if association isn't direct
        // Assuming Registration has team_id
        const members = await Registration.findAll({
            where: { team_id: id },
            include: [
                {
                    model: Student,
                    attributes: ['id', 'name', 'department', 'year_of_study'],
                    include: [{ model: College, attributes: ['name', 'city'] }]
                }
            ]
        });

        res.json({ ...team.toJSON(), members });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get Teams by Sport
exports.getTeamsBySport = async (req, res) => {
    try {
        const { sportId } = req.params;

        // 1. Try to find explicit Team records
        let teams = await Team.findAll({
            where: { sport_id: sportId },
            include: [
                { model: Sport, attributes: ['id', 'name', 'category'] },
                {
                    model: Student,
                    as: 'Captain',
                    attributes: ['name'],
                    include: [{ model: College, attributes: ['name', 'city'] }]
                }
            ]
        });

        // 2. If no teams found, fallback to showing all registrations for this sport
        if (teams.length === 0) {
            const registrations = await Registration.findAll({
                include: [
                    {
                        model: Sport,
                        where: { id: sportId },
                        attributes: ['id', 'name', 'category']
                    },
                    {
                        model: Student,
                        attributes: ['name'],
                        include: [{ model: College, attributes: ['name', 'city'] }]
                    }
                ],
                order: [['created_at', 'ASC']]
            });

            // Format registrations to look like team objects for the frontend
            teams = registrations.map(reg => ({
                id: reg.id,
                team_name: reg.college_name || reg.Student?.name || 'Independent Player',
                college_info: reg.Student?.College,
                sport_id: sportId,
                captain_id: reg.student_id,
                locked: false,
                Sport: reg.Sports?.[0], // In belongsToMany, it returns an array
                Captain: reg.Student,
                is_registration_based: true // Flag to distinguish
            }));
        }

        res.json(teams);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create Team (Manual)
exports.createTeam = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { team_name, sport_id, captain_id } = req.body;

        // BasicValidation
        if (!team_name || !sport_id || !captain_id) {
            return res.status(400).json({ error: 'Team Name, Sport ID, and Captain ID are required' });
        }

        const team = await Team.create({
            team_name,
            sport_id,
            captain_id,
            locked: false
        }, { transaction: t });

        // Update Captain's registration to link to this team?
        // Logic might be complex if they are already registered individually.
        // For now, simple creation.

        await t.commit();
        res.status(201).json(team);
    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

// Update Team
exports.updateTeam = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body; // team_name, captain_id, locked

        const team = await Team.findByPk(id);
        if (!team) return res.status(404).json({ error: 'Team not found' });

        await team.update(updates);
        res.json({ message: 'Team updated', team });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete Team
exports.deleteTeam = async (req, res) => {
    try {
        const { id } = req.params;
        const team = await Team.findByPk(id);
        if (!team) return res.status(404).json({ error: 'Team not found' });

        // Logic check: Can't delete if in a match?
        // For now, allow delete.
        await team.destroy();
        res.json({ message: 'Team deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
