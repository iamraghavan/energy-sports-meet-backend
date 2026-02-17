const { Match, Team, Sport, Registration, Student, College, sequelize, TeamMember } = require('../models');
const { Op } = require('sequelize');

// ==========================================
// OVERVIEW STATS
// ==========================================

// @desc    Get Overview Stats for Sports Head Dashboard
// @access  Private (Sports Head)
exports.getOverviewStats = async (req, res) => {
    try {
        const sport_id = req.user.assigned_sport_id;

        // 1. Total Teams
        const totalTeams = await Team.count({ where: { sport_id } });

        // 2. Total Registered Players (Approved Registrations for this Sport)
        // Note: This counts approved registrations, not necessarily players assigned to teams.
        const totalPlayers = await Registration.count({
            include: [{
                model: Sport,
                where: { id: sport_id }
            }],
            where: { status: 'approved' }
        });

        // 3. Upcoming Matches
        const upcomingMatches = await Match.count({
            where: {
                sport_id,
                start_time: { [Op.gt]: new Date() },
                status: 'scheduled'
            }
        });

        // 4. Live Matches (Optional, if applicable)
        const liveMatches = await Match.count({
            where: {
                sport_id,
                status: 'live' // Assuming 'live' status exists
            }
        });
        
        // 5. Recent Activity (Last 5 approved registrations)
        const recentRegistrations = await Registration.findAll({
            include: [{ model: Sport, where: { id: sport_id }, attributes: [] }],
            where: { status: 'approved' },
            limit: 5,
            order: [['created_at', 'DESC']],
            attributes: ['id', 'name', 'registration_code', 'created_at']
        });

        res.json({
            stats: {
                total_teams: totalTeams,
                total_players: totalPlayers,
                upcoming_matches: upcomingMatches,
                live_matches: liveMatches
            },
            recent_activity: recentRegistrations
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get Detailed Analytics for Sports Head
// @access  Private (Sports Head)
exports.getAnalytics = async (req, res) => {
    try {
        const sport_id = req.user.assigned_sport_id;

        // 1. Match Statistics
        const matches = await Match.findAll({
            where: { sport_id },
            attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            group: ['status']
        });

        // 2. Team Statistics (Player counts per team)
        const teams = await Team.findAll({
            where: { sport_id },
            attributes: ['id', 'team_name'],
            include: [{
                model: TeamMember,
                as: 'Members', // Ensure alias definition in models/index.js match this
                attributes: []
            }],
            attributes: [
                'id', 
                'team_name',
                [sequelize.fn('COUNT', sequelize.col('Members.id')), 'player_count']
            ],
            group: ['Team.id', 'Team.team_name'] 
        });

        // 3. Registration Trends (Last 7 days) - Optional optimization
        // ...

        res.json({
            match_distribution: matches.reduce((acc, curr) => {
                acc[curr.status] = parseInt(curr.getDataValue('count'));
                return acc;
            }, { scheduled: 0, completed: 0, live: 0 }),
            team_sizes: teams,
            total_matches: matches.reduce((sum, curr) => sum + parseInt(curr.getDataValue('count')), 0)
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// MATCH MANAGEMENT
// ==========================================

// @desc    Get All Matches for Assigned Sport
// @access  Private (Sports Head)
exports.getMatches = async (req, res) => {
    try {
        const sport_id = req.user.assigned_sport_id;
        const { status } = req.query; // Optional filter: scheduled, live, completed

        let whereClause = { sport_id };
        if (status) {
            whereClause.status = status;
        }

        const matches = await Match.findAll({
            where: whereClause,
            include: [
                { model: Team, as: 'TeamA', attributes: ['id', 'team_name'] },
                { model: Team, as: 'TeamB', attributes: ['id', 'team_name'] },
                { model: Sport, attributes: ['id', 'name'] }
            ],
            order: [['start_time', 'ASC']]
        });

        res.json(matches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

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
// @desc    Create a new team
// @access  Private (Sports Head)
exports.createTeam = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { team_name, registration_id } = req.body; 
        // We require registration_id (of the captain/lead) to determine College and Owner.
        
        const sport_id = req.user.assigned_sport_id;

        if (!registration_id) {
            await t.rollback();
            return res.status(400).json({ error: 'Registration ID of the captain/lead player is required to create a team.' });
        }

        // 1. Fetch Registration to get College Context
        const registration = await Registration.findByPk(registration_id, { transaction: t });
        if (!registration) {
            await t.rollback();
            return res.status(404).json({ error: 'Registration not found' });
        }

        // 2. Ensure Student Record Exists (Captain)
        let student = await Student.findOne({ 
            where: { 
                [Op.or]: [{ mobile: registration.mobile }, { email: registration.email }] 
            },
            transaction: t
        });

        if (!student) {
            student = await Student.create({
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
            }, { transaction: t });
        }

        // 3. Create Team
        const team = await Team.create({ 
            team_name, 
            captain_id: student.id,
            sport_id,
            registration_id: registration.id, // Owner
            college_id: registration.college_id || 0, // 0 for 'Other' if null? Schema says non-null. 
            // If college_id is null (Other), we might need a fallback or ensure Registration has it.
            // Registration schema allows null college_id. Team schema does NOT.
            // CAUTION: If registration.college_id is null, we need to handle it. 
            // Assuming 0 or specific generic ID for "Other". For now, using optional chaining or 0.
            locked: false
        }, { transaction: t });

        // 4. Add Captain as Team Member
        await TeamMember.create({
            team_id: team.id,
            student_id: student.id,
            role: 'Captain'
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
            // Fix: Remove sport_id from top-level where clause as it's not a column
            where: { status: 'approved' }, 
            include: [
                {
                    model: Sport, 
                    where: { id: sport_id },
                    required: true
                },
                { model: Team, as: 'Teams', attributes: ['id', 'team_name'] }
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
    const t = await sequelize.transaction();
    try {
        const { teamId, studentId } = req.params; // studentId here is actually Registration ID passed from frontend
        // Note: The frontend lists "Registrations". When dragging/adding, it passes Registration ID.
        // But TeamMember table requires a valid existing 'Student' record.
        
        // 1. Fetch Registration
        const registration = await Registration.findByPk(studentId, { transaction: t });
        if (!registration) {
            await t.rollback();
            return res.status(404).json({ error: 'Registration not found' });
        }

        // 2. Find or Create Student Record
        // (to satisfy Foreign Key constraint in TeamMember)
        let student = await Student.findOne({ 
            where: { 
                [Op.or]: [{ mobile: registration.mobile }, { email: registration.email }] 
            },
            transaction: t
        });

        if (!student) {
            student = await Student.create({
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
            }, { transaction: t });
        }

        // 3. Check if already in this team
        const existingMember = await TeamMember.findOne({
            where: { team_id: teamId, student_id: student.id },
            transaction: t
        });

        if (existingMember) {
            await t.rollback();
            return res.status(400).json({ error: 'Player already in this team' });
        }

        // 4. Create Team Member Link
        const teamMember = await TeamMember.create({
            team_id: teamId,
            student_id: student.id,
            role: 'Player',
            sport_role: req.body.sport_role || null // Optional role details
        }, { transaction: t });

        await t.commit();
        res.status(201).json({ message: 'Player added to team', teamMember });

    } catch (error) {
        if (t) await t.rollback();
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
                    required: true,
                    attributes: ['id', 'name']
                },
                {
                    model: Team,
                    as: 'Teams', // Correct alias from models/index.js
                    required: false, // LEFT JOIN
                    attributes: ['id', 'team_name']
                }
            ],
            order: [['created_at', 'DESC']]
        });

        // Transform to cleaner format
        const result = registrations.map(reg => {
            // 'Teams' is an array due to hasMany association.
            // We are interested if ANY team exists for this registration (as owner).
            // In a strict scenario, a registration might only own one team per sport, but schema allows many.
            // We'll take the first one if exists, or check length.
            
            const ownedTeams = reg.Teams || [];
            const hasTeam = ownedTeams.length > 0;
            
            return {
                ...reg.toJSON(),
                team_created: hasTeam,
                team_info: hasTeam ? { id: ownedTeams[0].id, name: ownedTeams[0].team_name } : null
            };
        });

        res.json(result);
    } catch (error) {
        console.error("Error in getRegistrations:", error);
        res.status(500).json({ error: error.message });
    }
};
exports.bulkAddPlayers = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { teamId } = req.params;
        // Accept either 'players' (Object Array) or 'registration_ids' (ID Array - Legacy)
        const { players, registration_ids } = req.body; 

        let items = [];
        
        // Normalize input to array of objects
        if (Array.isArray(players) && players.length > 0) {
            items = players;
        } else if (Array.isArray(registration_ids) && registration_ids.length > 0) {
            items = registration_ids.map(id => ({ student_id: id })); // Map legacy
        }

        if (items.length === 0) {
            await t.rollback();
            return res.status(400).json({ error: 'No players provided' });
        }

        const added = [];
        const errors = [];
        const sport_id = req.user.assigned_sport_id;

        // Verify Team
        const team = await Team.findOne({ where: { id: teamId, sport_id }, transaction: t });
        if (!team) {
            await t.rollback();
            return res.status(404).json({ error: 'Team not found or mismatch sport' });
        }

        for (const item of items) {
            try {
                // item can be { name, mobile, email }, { student_id: 'REG-...' }, or just { student_id: UUID }
                let student = null;

                // 1. Resolve Student
                if (item.student_id) {
                    // Look up by ID/Code
                    let reg = await Registration.findOne({ where: { registration_code: item.student_id }, transaction: t });
                    if (!reg) reg = await Registration.findByPk(item.student_id, { transaction: t });
                    
                    if (reg) {
                        // Find/Create Student from Registration
                        student = await Student.findOne({ 
                            where: { [Op.or]: [{ mobile: reg.mobile }, { email: reg.email }] },
                            transaction: t 
                        });
                        if (!student) {
                            student = await Student.create({
                                name: reg.name,
                                email: reg.email,
                                mobile: reg.mobile,
                                whatsapp: reg.whatsapp,
                                city: reg.college_city,
                                state: reg.college_state,
                                college_id: reg.college_id,
                                department: reg.department,
                                year_of_study: reg.year_of_study
                            }, { transaction: t });
                        }
                    } else {
                        // Try Student UUID directly
                        student = await Student.findByPk(item.student_id, { transaction: t });
                    }
                } else if (item.name && (item.mobile || item.email)) {
                    // Look up by Mobile/Email (Direct Check)
                    const whereClause = [];
                    if (item.mobile) whereClause.push({ mobile: item.mobile });
                    if (item.email) whereClause.push({ email: item.email });

                    student = await Student.findOne({ 
                        where: { [Op.or]: whereClause },
                        transaction: t 
                    });

                    // If not found, Create New Student directly
                    if (!student) {
                        student = await Student.create({
                            name: item.name,
                            email: item.email || null,
                            mobile: item.mobile || null,
                            city: item.city || 'Unknown',
                            state: item.state || 'Unknown',
                            college_id: item.college_id || null, // Optional
                            other_college: item.other_college || null
                        }, { transaction: t });
                    }
                }

                if (!student) {
                    errors.push({ item, error: 'Student could not be resolved or created (Missing Name/Mobile)' });
                    continue;
                }

                // 3. Check membership and Update/Create
                const existing = await TeamMember.findOne({
                    where: { team_id: teamId, student_id: student.id },
                    transaction: t
                });

                // Prepare Member Data
                const memberData = {
                    role: item.role || 'Player',
                    sport_role: item.sport_role,
                    batting_style: item.batting_style,
                    bowling_style: item.bowling_style,
                    is_wicket_keeper: item.is_wicket_keeper ? true : false,
                    additional_details: item.additional_details
                };

                if (!existing) {
                    await TeamMember.create({
                        team_id: teamId,
                        student_id: student.id,
                        ...memberData
                    }, { transaction: t });
                    added.push(student.id);
                } else {
                    // Start of Selection
                    // If member exists, we might want to update their role/details? 
                    // The user said "add bulk", usually implies new. 
                    // Let's UPDATE existing members if found, to be safe/useful.
                    await existing.update(memberData, { transaction: t });
                    added.push(student.id);
                    // End of Selection
                }

            } catch (err) {
                errors.push({ item, error: err.message });
            }
        }

        await t.commit();
        res.status(201).json({ message: 'Bulk add processed', added, errors });

    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

exports.updatePlayerDetails = async (req, res) => {
    try {
        const { teamId, studentId } = req.params;
        const updates = req.body; // { role, sport_role }

        // Note: studentId in param usually matches Registration ID in frontend lists, 
        // BUT TeamMember links to Student ID.
        // If frontend passes Registration ID, we must resolve Student ID first.
        // Ideally frontend passes Student ID if known, or we lookup.
        // As per bulkAdd, we linked Registration -> Student.
        
        // Let's assume studentId param IS the student.id (UUID) if accessing team members.
        // OR if accessing from registration list, it is reg.id.
        // Update logic: find TeamMember by team_id and student_id.
        
        // If the ID passed is a Registration ID, we need to find the student.
        // Try finding by PK as Student first?
        let member = await TeamMember.findOne({ where: { team_id: teamId, student_id: studentId } });
        
        if (!member) {
             // Fallback: maybe studentId is a Registration ID?
             const reg = await Registration.findByPk(studentId);
             if (reg) {
                 const student = await Student.findOne({ where: { email: reg.email } });
                 if (student) {
                     member = await TeamMember.findOne({ where: { team_id: teamId, student_id: student.id } });
                 }
             }
        }

        if (!member) return res.status(404).json({ error: 'Team member not found' });

        await member.update(updates);
        res.json({ message: 'Player updated', member });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Import Team Members from Excel JSON
// @access  Private (Sports Head)
exports.importTeamMembers = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        // Payload: Array of objects matching Excel columns
        // [{ team_id, student_id, role, sport_role, batting_style, bowling_style, is_wicket_keeper, additional_details }]
        const { players } = req.body;
        const sport_id = req.user.assigned_sport_id;

        if (!Array.isArray(players) || players.length === 0) {
            await t.rollback();
            return res.status(400).json({ error: 'No player data provided' });
        }

        const stats = { added: 0, updated: 0, errors: [] };

        for (const row of players) {
            try {
                const { team_id, student_id, role, sport_role, batting_style, bowling_style, is_wicket_keeper, additional_details } = row;

                if (!team_id || !student_id) {
                    stats.errors.push({ row, error: 'Missing team_id or student_id' });
                    continue;
                }

                // 1. Validate Team (Must belong to assigned sport)
                const team = await Team.findOne({ where: { id: team_id, sport_id }, transaction: t });
                if (!team) {
                    stats.errors.push({ student_id, error: `Team ${team_id} not found or mismatch sport` });
                    continue;
                }

                // 2. Resolve Student
                let student = null;

                if (student_id) {
                    // Case A: ID/Code Provided
                     // Try Registration Code
                    let registration = await Registration.findOne({ where: { registration_code: student_id }, transaction: t });
                    if (!registration) {
                        // Try UUID (Registration ID)
                        registration = await Registration.findByPk(student_id, { transaction: t });
                    }
                    if (registration) {
                        // Find/Create Student from Registration
                        student = await Student.findOne({ 
                            where: { [Op.or]: [{ mobile: registration.mobile }, { email: registration.email }] },
                            transaction: t
                        });
                        if (!student) {
                            student = await Student.create({
                                name: registration.name,
                                email: registration.email,
                                mobile: registration.mobile,
                                whatsapp: registration.whatsapp,
                                city: registration.college_city,
                                state: registration.college_state,
                                college_id: registration.college_id,
                                department: registration.department,
                                year_of_study: registration.year_of_study
                            }, { transaction: t });
                        }
                    } else {
                        // Try UUID (Student ID) directly
                        student = await Student.findByPk(student_id, { transaction: t });
                    }
                } else if (row.name && (row.mobile || row.email)) {
                    // Case B: Direct Details Provided (No ID)
                    // Check if Student exists
                    const whereClause = [];
                    if (row.mobile) whereClause.push({ mobile: row.mobile });
                    if (row.email) whereClause.push({ email: row.email });

                    student = await Student.findOne({ 
                        where: { [Op.or]: whereClause },
                        transaction: t 
                    });

                    // If not found in Student, check Registration to be safe?
                    // Actually, if they are registered, they should be in Student table if they were ever processed.
                    // But maybe they registered but no Student record created yet?
                    if (!student) {
                        const registration = await Registration.findOne({
                            where: { [Op.or]: whereClause },
                            transaction: t
                        });

                        if (registration) {
                             student = await Student.create({
                                name: registration.name,
                                email: registration.email,
                                mobile: registration.mobile,
                                whatsapp: registration.whatsapp,
                                city: registration.college_city,
                                state: registration.college_state,
                                college_id: registration.college_id,
                                department: registration.department,
                                year_of_study: registration.year_of_study
                            }, { transaction: t });
                        } else {
                            // Create NEW Student (Direct Entry)
                            // We need minimal fields. College?
                            // Assuming 'Other' or null if not provided.
                            student = await Student.create({
                                name: row.name,
                                email: row.email || null,
                                mobile: row.mobile || null,
                                city: 'Unknown', // Default
                                state: 'Unknown', // Default
                                college_id: null // Independent/Other
                            }, { transaction: t });
                        }
                    }
                }

                if (!student) {
                    stats.errors.push({ row, error: 'Student could not be resolved or created (Missing Name/Mobile)' });
                    continue;
                }

                // 3. Create or Update TeamMember
                const existingMember = await TeamMember.findOne({
                    where: { team_id: team.id, student_id: student.id },
                    transaction: t
                });

                // Normalize Boolean
                let isWK = false;
                if (typeof is_wicket_keeper === 'string') {
                    isWK = ['yes', 'true', '1'].includes(is_wicket_keeper.toLowerCase());
                } else {
                    isWK = !!is_wicket_keeper;
                }

                const memberData = {
                    role: role || 'Player',
                    sport_role: sport_role,
                    batting_style: batting_style,
                    bowling_style: bowling_style,
                    is_wicket_keeper: isWK,
                    additional_details: additional_details
                };

                if (existingMember) {
                    await existingMember.update(memberData, { transaction: t });
                    stats.updated++;
                } else {
                    await TeamMember.create({
                        team_id: team.id,
                        student_id: student.id,
                        ...memberData
                    }, { transaction: t });
                    stats.added++;
                }

            } catch (rowErr) {
                stats.errors.push({ row, error: rowErr.message });
            }
        }

        await t.commit();
        res.json({ message: 'Import processing completed', stats });

    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ error: error.message });
    }
};
