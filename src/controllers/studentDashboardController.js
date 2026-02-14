const { Registration, Sport, Team, TeamMember, Student, RegistrationSport, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * @desc    Get Student Dashboard Info
 * @route   GET /api/v1/dashboard
 * @access  Private (Student)
 */
exports.getDashboard = async (req, res) => {
    try {
        // req.student is the Registration record from protectStudent middleware
        const registration = await Registration.findByPk(req.student.id, {
            include: [
                {
                    model: Sport,
                    through: { attributes: [] }
                },
                {
                    model: Team,
                    as: 'Teams',
                    include: [
                        {
                            model: TeamMember,
                            as: 'Members',
                            include: [{ model: Student, attributes: ['id', 'name', 'email', 'mobile'] }]
                        },
                        { model: Sport }
                    ]
                }
            ]
        });

        if (!registration) {
            return res.status(404).json({ error: 'Registration not found' });
        }

        res.json({
            registration: {
                id: registration.id,
                code: registration.registration_code,
                name: registration.name,
                email: registration.email,
                college: registration.college_name,
                status: registration.status,
                payment_status: registration.payment_status
            },
            registered_sports: registration.Sports,
            teams: registration.Teams
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * @desc    Create Team for a Sport
 * @route   POST /api/v1/dashboard/teams
 * @access  Private (Student)
 */
exports.createTeam = async (req, res) => {
    try {
        const { sport_id, team_name } = req.body;
        const registration_id = req.student.id;

        // Check if sport is part of registration
        const isRegistered = await RegistrationSport.findOne({
            where: { registration_id, sport_id }
        });

        if (!isRegistered) {
            return res.status(400).json({ error: 'You are not registered for this sport' });
        }

        // Check if team already exists for this registration/sport
        const existingTeam = await Team.findOne({
            where: { registration_id, sport_id }
        });

        if (existingTeam) {
            return res.status(400).json({ error: 'Team already created for this sport' });
        }

        const team = await Team.create({
            team_name,
            sport_id,
            registration_id,
            college_id: req.student.college_id,
            status: 'pending'
        });

        res.status(201).json(team);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * @desc    Update Team Details
 * @route   PUT /api/v1/dashboard/teams/:teamId
 * @access  Private (Student)
 */
exports.updateTeam = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { team_name } = req.body;

        const team = await Team.findOne({
            where: { id: teamId, registration_id: req.student.id }
        });

        if (!team) return res.status(404).json({ error: 'Team not found or unauthorized' });
        if (team.locked) return res.status(400).json({ error: 'Team is locked' });

        await team.update({ team_name });
        res.json(team);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * @desc    Delete Team
 * @route   DELETE /api/v1/dashboard/teams/:teamId
 * @access  Private (Student)
 */
exports.deleteTeam = async (req, res) => {
    try {
        const { teamId } = req.params;

        const team = await Team.findOne({
            where: { id: teamId, registration_id: req.student.id }
        });

        if (!team) return res.status(404).json({ error: 'Team not found or unauthorized' });
        if (team.locked) return res.status(400).json({ error: 'Team is locked' });

        await team.destroy(); // Cascading handled by FKs or manually
        res.json({ message: 'Team deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * @desc    Add Team Member
 * @route   POST /api/v1/dashboard/teams/:teamId/members
 * @access  Private (Student)
 */
exports.addTeamMember = async (req, res) => {
    let t;
    try {
        const { teamId } = req.params;
        const {
            name, email, mobile, dob, gender, city, state,
            role, sport_role, batting_style, bowling_style, is_wicket_keeper, additional_details
        } = req.body;

        const team = await Team.findOne({
            where: { id: teamId, registration_id: req.student.id }
        });

        if (!team) return res.status(403).json({ error: 'Not authorized or team not found' });
        if (team.locked) return res.status(400).json({ error: 'Team is locked' });

        t = await sequelize.transaction();

        // 1. Find or Create Student
        let student = await Student.findOne({
            where: { [Op.or]: [{ email }, { mobile }] },
            transaction: t
        });

        if (!student) {
            student = await Student.create({
                name, email, mobile, dob, gender, city: city || req.student.city, state: state || req.student.state,
                college_id: team.college_id
            }, { transaction: t });
        }

        // 2. Add to Team
        const member = await TeamMember.create({
            team_id: teamId,
            student_id: student.id,
            role: role || 'Player',
            sport_role,
            batting_style,
            bowling_style,
            is_wicket_keeper,
            additional_details
        }, { transaction: t });

        // Update captain if needed
        if (role === 'Captain') {
            await team.update({ captain_id: student.id }, { transaction: t });
        }

        await t.commit();
        res.status(201).json(member);
    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

/**
 * @desc    Update Team Member Details
 * @route   PUT /api/v1/dashboard/members/:memberId
 * @access  Private (Student)
 */
exports.updateTeamMember = async (req, res) => {
    try {
        const { memberId } = req.params;
        const updates = req.body;

        const member = await TeamMember.findByPk(memberId, {
            include: [{ model: Team }]
        });

        if (!member || member.Team.registration_id !== req.student.id) {
            return res.status(404).json({ error: 'Member not found or unauthorized' });
        }

        if (member.Team.locked) {
            return res.status(400).json({ error: 'Team is locked' });
        }

        await member.update(updates);

        // Update Team captain_id if role changed to Captain
        if (updates.role === 'Captain') {
            await member.Team.update({ captain_id: member.student_id });
        }

        res.json(member);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * @desc    Remove Team Member
 * @route   DELETE /api/v1/dashboard/members/:memberId
 * @access  Private (Student)
 */
exports.deleteTeamMember = async (req, res) => {
    try {
        const { memberId } = req.params;

        const member = await TeamMember.findByPk(memberId, {
            include: [{ model: Team }]
        });

        if (!member || member.Team.registration_id !== req.student.id) {
            return res.status(404).json({ error: 'Member not found or unauthorized' });
        }

        if (member.Team.locked) {
            return res.status(400).json({ error: 'Team is locked' });
        }

        // If removing the captain, clear team captain_id
        if (member.role === 'Captain') {
            await member.Team.update({ captain_id: null });
        }

        await member.destroy();
        res.json({ message: 'Member removed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * @desc    Bulk Add Team Members
 * @route   POST /api/v1/dashboard/teams/:teamId/members/bulk
 * @access  Private (Student)
 */
exports.bulkAddTeamMembers = async (req, res) => {
    let t;
    try {
        const { teamId } = req.params;
        const { members } = req.body; // Array of member objects

        if (!members || !Array.isArray(members) || members.length === 0) {
            return res.status(400).json({ error: 'Members array is required' });
        }

        const team = await Team.findOne({
            where: { id: teamId, registration_id: req.student.id }
        });

        if (!team) return res.status(403).json({ error: 'Not authorized or team not found' });
        if (team.locked) return res.status(400).json({ error: 'Team is locked' });

        t = await sequelize.transaction();

        const createdMembers = [];
        for (const m of members) {
            // Find or Create Student
            let student = await Student.findOne({
                where: { [Op.or]: [{ email: m.email }, { mobile: m.mobile }] },
                transaction: t
            });

            if (!student) {
                student = await Student.create({
                    name: m.name,
                    email: m.email,
                    mobile: m.mobile,
                    dob: m.dob,
                    gender: m.gender,
                    city: m.city || req.student.city,
                    state: m.state || req.student.state,
                    college_id: team.college_id
                }, { transaction: t });
            }

            const member = await TeamMember.create({
                team_id: teamId,
                student_id: student.id,
                role: m.role || 'Player',
                sport_role: m.sport_role,
                batting_style: m.batting_style,
                bowling_style: m.bowling_style,
                is_wicket_keeper: m.is_wicket_keeper,
                additional_details: m.additional_details
            }, { transaction: t });

            if (m.role === 'Captain') {
                await team.update({ captain_id: student.id }, { transaction: t });
            }

            createdMembers.push(member);
        }

        await t.commit();
        res.status(201).json(createdMembers);
    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

/**
 * @desc    Bulk Update Team Members
 * @route   PUT /api/v1/dashboard/members/bulk
 * @access  Private (Student)
 */
exports.bulkUpdateTeamMembers = async (req, res) => {
    let t;
    try {
        const { memberUpdates } = req.body; // Array of { id, ...updates }

        if (!memberUpdates || !Array.isArray(memberUpdates) || memberUpdates.length === 0) {
            return res.status(400).json({ error: 'memberUpdates array is required' });
        }

        t = await sequelize.transaction();

        const updatedMembers = [];
        for (const update of memberUpdates) {
            const member = await TeamMember.findByPk(update.id, {
                include: [{ model: Team }],
                transaction: t
            });

            if (!member || member.Team.registration_id !== req.student.id) {
                continue; // Skip unauthorized or non-existent
            }

            if (member.Team.locked) {
                continue; // Skip locked
            }

            await member.update(update, { transaction: t });

            if (update.role === 'Captain') {
                await member.Team.update({ captain_id: member.student_id }, { transaction: t });
            }

            updatedMembers.push(member);
        }

        await t.commit();
        res.json(updatedMembers);
    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

/**
 * @desc    Bulk Delete Team Members
 * @route   DELETE /api/v1/dashboard/members/bulk
 * @access  Private (Student)
 */
exports.bulkDeleteTeamMembers = async (req, res) => {
    let t;
    try {
        const { memberIds } = req.body; // Array of UUIDs

        if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
            return res.status(400).json({ error: 'memberIds array is required' });
        }

        t = await sequelize.transaction();

        for (const memberId of memberIds) {
            const member = await TeamMember.findByPk(memberId, {
                include: [{ model: Team }],
                transaction: t
            });

            if (!member || member.Team.registration_id !== req.student.id) {
                continue;
            }

            if (member.Team.locked) {
                continue;
            }

            if (member.role === 'Captain') {
                await member.Team.update({ captain_id: null }, { transaction: t });
            }

            await member.destroy({ transaction: t });
        }

        await t.commit();
        res.json({ message: 'Members deleted successfully' });
    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ error: error.message });
    }
};
