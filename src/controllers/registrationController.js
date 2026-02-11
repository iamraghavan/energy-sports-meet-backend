const { Student, Registration, Sport, Team, Payment, sequelize } = require('../models');
const { uploadToGitHub } = require('../utils/upload');
const { v4: uuidv4 } = require('uuid');

exports.registerStudent = async (req, res) => {
    // ... (Existing registerStudent logic - kept as is)
    // For brevity in this tool call, I'm not re-pasting the whole function unless I change it.
    // But since I am appending new functions, I should use append or rewrite the whole file. 
    // Given the previous file was fully written, I will rewrite it to include getRegistrations.

    // Start transaction
    const t = await sequelize.transaction();

    try {
        console.log('--- Registration Request Received ---');
        // ... (Logs)

        let {
            name, dob, gender, email, mobile, whatsapp, city, state,
            college_id, other_college, department, year_of_study,
            sport_id, accommodation_needed,
            team_name, create_team, join_team_id,
            txn_id
        } = req.body;

        // ... (Validation)
        // Basic Required Fields
        if (!name || !dob || !gender || !email || !mobile || !department || !year_of_study || !sport_id || !txn_id) {
            throw new Error('Missing required fields (name, dob, gender, email, mobile, department, year, sport_id, txn_id)');
        }

        let formattedDob = dob;
        if (dob.includes('-')) {
            const parts = dob.split('-');
            if (parts[0].length === 2 && parts[2].length === 4) {
                formattedDob = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        }

        let finalCollegeId = college_id;
        if (!college_id || college_id === 'other' || college_id === '') {
            finalCollegeId = null;
            if (!other_college) {
                if (req.body.college_name) {
                    other_college = req.body.college_name;
                } else {
                    throw new Error('Please specify your college name if "Other" is selected.');
                }
            }
        }

        // Student Handling
        let student = await Student.findOne({
            where: { email: email },
            transaction: t
        });

        if (student) {
            const existingReg = await Registration.findOne({
                where: { student_id: student.id },
                transaction: t
            });
            if (existingReg) {
                throw new Error(`Student with email ${email} is already registered.`);
            }
        } else {
            student = await Student.create({
                name, dob: formattedDob, gender, email, mobile, whatsapp, city, state,
                college_id: finalCollegeId, other_college, department, year_of_study
            }, { transaction: t });
        }

        // Sport Validation
        const sport = await Sport.findByPk(sport_id, { transaction: t });
        if (!sport) throw new Error('Invalid Sport ID');

        let teamId = null;
        let isCaptain = false;

        // Team Logic
        if (sport.type === 'Team') {
            if (create_team === 'true' || create_team === true) {
                if (!team_name) throw new Error('Team Name is required to create a team.');
                const newTeam = await Team.create({
                    sport_id: sport.id, team_name, captain_id: student.id, locked: false
                }, { transaction: t });
                teamId = newTeam.id;
                isCaptain = true;
            } else if (join_team_id) {
                const team = await Team.findByPk(join_team_id, { transaction: t });
                if (!team) throw new Error('Team to join not found.');
                if (team.locked) throw new Error('Team is locked.');
                const currentMembers = await Registration.count({ where: { team_id: team.id }, transaction: t });
                if (currentMembers >= sport.max_players) throw new Error('Team is full.');
                teamId = team.id;
            } else {
                throw new Error('For Team Sports, you must either Create a Team or Join one.');
            }
        }

        // File Upload
        let screenshotUrl = '';
        if (req.file) {
            try {
                screenshotUrl = await uploadToGitHub(req.file, 'payments');
            } catch (err) {
                throw new Error('Failed to upload payment screenshot. Please try again.');
            }
        } else {
            throw new Error('Payment screenshot is required.');
        }

        // Create Registration
        const currentYear = new Date().getFullYear();
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let randomSuffix = '';
        for (let i = 0; i < 8; i++) {
            randomSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const registrationCode = `EGSP/ENERGY/${currentYear}/${randomSuffix}`;

        const registration = await Registration.create({
            registration_code: registrationCode,
            student_id: student.id,
            sport_id: sport.id,
            team_id: teamId,
            is_captain: isCaptain,
            accommodation_needed: accommodation_needed === 'true' || accommodation_needed === true,
            payment_status: 'pending',
            status: 'pending'
        }, { transaction: t });

        // Create Payment
        await Payment.create({
            registration_id: registration.id,
            amount: sport.amount,
            txn_id: txn_id,
            screenshot_url: screenshotUrl
        }, { transaction: t });

        await t.commit();
        res.status(201).json({
            message: 'Registration successful',
            registration_code: registrationCode,
            student_id: student.id,
            payment_status: 'pending'
        });

    } catch (error) {
        if (t) await t.rollback();
        console.error('Registration Controller Error:', error);
        res.status(500).json({
            error: error.message || 'Internal Server Error',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// NEW: Get Registrations (Role-Based)
exports.getRegistrations = async (req, res) => {
    try {
        const { role, assigned_sport_id } = req.user; // From authMiddleware

        let whereClause = {};

        // If Sports Head, filter by assigned sport
        if (role === 'sports_head') {
            if (!assigned_sport_id) {
                return res.status(403).json({ error: 'Sports Head has no assigned sport.' });
            }
            whereClause.sport_id = assigned_sport_id;
        }

        // If filtering by query params (e.g. status)
        if (req.query.status) {
            whereClause.status = req.query.status;
        }

        const registrations = await Registration.findAll({
            where: whereClause,
            include: [
                { model: Student },
                { model: Sport },
                { model: Team },
                { model: Payment }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json(registrations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// NEW: Get Registration by ID or Code
exports.getRegistrationById = async (req, res) => {
    try {
        const { id } = req.params; // Can be UUID or EGSP code

        let whereClause = {};
        // Simple check: if it looks like a UUID, search by ID, else by code
        if (id.includes('EGSP')) {
            whereClause.registration_code = id;
        } else {
            whereClause.id = id;
        }

        const registration = await Registration.findOne({
            where: whereClause,
            include: [
                { model: Student, include: [College] },
                { model: Sport },
                { model: Team },
                { model: Payment }
            ]
        });

        if (!registration) {
            return res.status(404).json({ error: 'Registration not found' });
        }

        res.json(registration);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
