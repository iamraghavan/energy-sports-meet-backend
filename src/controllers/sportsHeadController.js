const { Match, Team, Sport, Registration, Student, College, sequelize } = require('../models');

// ==========================================
// MATCH MANAGEMENT
// ==========================================

// @desc    Schedule a new match
// @access  Private (Sports Head/Admin)
exports.scheduleMatch = async (req, res) => {
    try {
        const { sport_id, team_a_id, team_b_id, start_time, venue, referee_name } = req.body;

        if (req.user.role === 'sports_head' && sport_id !== req.user.assigned_sport_id) {
            return res.status(403).json({ error: 'You can only schedule matches for your assigned sport.' });
        }

        const match = await Match.create({
            sport_id,
            team_a_id,
            team_b_id,
            start_time,
            venue,
            referee_name,
            status: 'scheduled'
        });

        res.status(201).json(match);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Update match details
// @access  Private (Sports Head/Admin)
exports.updateMatch = async (req, res) => {
    try {
        const { id } = req.params;
        const match = await Match.findByPk(id);
        if (!match) return res.status(404).json({ error: 'Match not found' });

        if (req.user.role === 'sports_head' && match.sport_id !== req.user.assigned_sport_id) {
            return res.status(403).json({ error: 'Not authorized for this sport' });
        }

        await match.update(req.body);
        res.json({ message: 'Match updated successfully', match });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// TEAM MANAGEMENT
// ==========================================

// @desc    Get Teams for assigned sport (with Registration fallback)
// @access  Private (Sports Head)
exports.getSportTeams = async (req, res) => {
    try {
        const sport_id = req.user.assigned_sport_id;

        // 1. Try to find explicit Team records
        let teams = await Team.findAll({
            where: { sport_id },
            include: [
                { model: Sport, attributes: ['id', 'name', 'category'] },
                // Captain info from Student if available, else handled by frontend? 
                // Since Team has captain_id, it links to Student. If Student doesn't exist, this might be null.
                {
                    model: Student,
                    as: 'Captain',
                    attributes: ['name', 'mobile'],
                    include: [{ model: College, attributes: ['name', 'city'] }]
                }
            ]
        });

        // 2. Fallback: Return Registrations as pseudo-teams if no valid teams found
        // Use Registration data directly
        if (teams.length === 0) {
            const registrations = await Registration.findAll({
                include: [
                    {
                        model: Sport,
                        where: { id: sport_id },
                        attributes: ['id', 'name', 'category']
                    }
                ],
                where: { status: 'approved' }, // Only show approved players
                order: [['created_at', 'ASC']]
            });

            // Format registrations to look like team objects
            teams = registrations.map(reg => ({
                id: `REG-${reg.id}`,
                team_name: reg.college_name || reg.name || 'Independent Player',
                college_info: { name: reg.college_name, city: reg.college_city },
                sport_id: sport_id,
                captain_id: reg.id, // Using Reg ID effectively
                locked: false,
                Sport: reg.Sports?.[0], 
                Captain: { name: reg.name, mobile: reg.mobile }, // Mock Captain object from Reg data
                is_registration_based: true,
                registration_id: reg.id
            }));
        }

        res.json(teams);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getTeamDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const sport_id = req.user.assigned_sport_id;

        const team = await Team.findOne({ 
            where: { id, sport_id },
            include: [
                { model: Sport, attributes: ['id', 'name'] },
                { 
                    model: Student, 
                    as: 'Captain',
                    attributes: ['name', 'mobile']
                }
            ]
        });

        if (!team) return res.status(404).json({ error: 'Team not found or does not belong to your sport' });

        // Get members
        // Members are stored in TeamMembers table which LINKS to Student.
        // If Students are created only when added to teams (via Dashboard), then this works.
        // But if we want to show ALL registered students for this team...
        // Wait, if users registered individually, they are in Registration.
        // If they formed a team via Dashboard, they are in Team/TeamMembers.
        
        // This endpoint returns the explicit Team structure.
        const { TeamMember } = require('../models');
        const members = await TeamMember.findAll({
            where: { team_id: id },
            include: [{ model: Student, attributes: ['name', 'mobile'] }]
        });

        res.json({ ...team.toJSON(), members });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Create a new team
// @access  Private (Sports Head)
exports.createTeam = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { team_name, captain_id } = req.body; // captain_id here might be StudentID if selected from existing students
        const sport_id = req.user.assigned_sport_id;

        const team = await Team.create({ 
            team_name, 
            captain_id: captain_id || null, // Allow null captain initially
            sport_id,
            locked: false
        }, { transaction: t });

        await t.commit();
        res.status(201).json(team);
    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

exports.updateTeam = async (req, res) => {
    try {
        const { id } = req.params;
        const sport_id = req.user.assigned_sport_id;

        const team = await Team.findOne({ where: { id, sport_id } });
        if (!team) return res.status(404).json({ error: 'Team not found' });

        await team.update(req.body);
        res.json({ message: 'Team updated', team });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteTeam = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const sport_id = req.user.assigned_sport_id;

        const team = await Team.findOne({ where: { id, sport_id } });
        if (!team) return res.status(404).json({ error: 'Team not found' });

        await team.destroy({ transaction: t });
        await t.commit();
        res.json({ message: 'Team deleted' });
    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// STUDENT / PLAYER MANAGEMENT
// ==========================================

// @desc    Get all students for the assigned sport (pool of players)
// @access  Private (Sports Head)
exports.getAllStudents = async (req, res) => {
    try {
        const sport_id = req.user.assigned_sport_id;
        
        // Fetch from Registration, not Student
        const registrations = await Registration.findAll({
            where: { status: 'approved' },
            include: [
                {
                    model: Sport, 
                    where: { id: sport_id }
                },
                { model: Team, attributes: ['id', 'team_name'] }
            ]
        });

        const students = registrations.map(reg => ({
            registration_id: reg.id,
            name: reg.name,
            college: reg.college_name,
            team_id: reg.Teams?.[0]?.id, // Assuming implicit link via Registration->Team?
            // Actually Team links to Registration via registration_id
            team_name: reg.Teams?.[0]?.team_name,
            mobile: reg.mobile,
            department: reg.department
        }));

        res.json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Add player to team
// @access  Private (Sports Head)
exports.addPlayerToTeam = async (req, res) => {
    // This is complex because we need to link a Registration (person) to a Team (structure).
    // But Team Members are Students.
    // If Admin wants to add a "Registration" to a Team, we might need to create a Student record first?
    try {
        res.status(501).json({ message: 'Manual player addition via Sports Head console not fully implemented due to data model constraints.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Remove player from team
// @access  Private (Sports Head)
exports.removePlayerFromTeam = async (req, res) => {
     try {
        const { teamId, studentId } = req.params;
        const { TeamMember } = require('../models');

        await TeamMember.destroy({
            where: { team_id: teamId, student_id: studentId }
        });

        res.json({ message: 'Player removed from team' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    View registrations (Legacy/Full view)
// @access  Private (Sports Head)
exports.getRegistrations = async (req, res) => {
    try {
        const sport_id = req.user.assigned_sport_id;
        const registrations = await Registration.findAll({
            include: [
                {
                    model: Sport,
                    where: { id: sport_id },
                    required: true
                }
            ]
        });
        res.json(registrations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
