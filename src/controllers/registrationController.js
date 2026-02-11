const { Student, Registration, Sport, Team, Payment, sequelize } = require('../models');
const { uploadToGitHub } = require('../utils/upload');
const { v4: uuidv4 } = require('uuid');

exports.registerStudent = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const {
            name, dob, gender, email, mobile, whatsapp, city, state,
            college_id, department, year_of_study,
            sport_id, accommodation_needed,
            team_name, team_members // Array of member objects if team sport
        } = req.body;

        // 1. Check if student already registered for ANY sport
        // Note: User requirement said "One sport only".
        // We check by email or mobile.
        // However, a student might be in the DB but not registered (?) or we treat Student entry as registration.
        // The requirement says "One sport only -> SELECT COUNT(*) FROM registrations WHERE student_id=?".
        // So we first find or create the student.

        let student = await Student.findOne({
            where: {
                email: email
            },
            transaction: t
        });

        if (student) {
            // Check if already registered
            const existingReg = await Registration.findOne({
                where: { student_id: student.id },
                transaction: t
            });

            if (existingReg) {
                await t.rollback();
                return res.status(409).json({ error: 'Student already registered for a sport.' });
            }
        } else {
            // Create new student
            student = await Student.create({
                name, dob, gender, email, mobile, whatsapp, city, state,
                college_id, department, year_of_study
            }, { transaction: t });
        }

        // 2. Validate Sport
        const sport = await Sport.findByPk(sport_id, { transaction: t });
        if (!sport) {
            await t.rollback();
            return res.status(404).json({ error: 'Sport not found' });
        }

        let teamId = null;
        let isCaptain = false;

        // 3. Handle Team Logic
        if (sport.type === 'Team') {
            // Logic for team registration is complex.
            // Option A: Captain registers the team and themselves.
            // Option B: Players join an existing team (locked?).
            // For simplicity and "Student Registration" flow:
            // We assume the CURRENT user is registering.

            if (req.body.create_team) {
                // Creating a new team
                if (!team_name) {
                    await t.rollback();
                    return res.status(400).json({ error: 'Team name is required for team sports.' });
                }

                const newTeam = await Team.create({
                    sport_id: sport.id,
                    team_name: team_name,
                    captain_id: student.id,
                    locked: false
                }, { transaction: t });

                teamId = newTeam.id;
                isCaptain = true;

            } else if (req.body.join_team_id) {
                // Joining existing team
                const team = await Team.findByPk(req.body.join_team_id, { transaction: t });
                if (!team) {
                    await t.rollback();
                    return res.status(404).json({ error: 'Team not found' });
                }
                if (team.locked) {
                    await t.rollback();
                    return res.status(400).json({ error: 'Team is locked.' });
                }

                // Check max players
                const currentCount = await Registration.count({ where: { team_id: team.id }, transaction: t });
                if (currentCount >= sport.max_players) {
                    await t.rollback();
                    return res.status(400).json({ error: 'Team is full.' });
                }

                teamId = team.id;
            } else {
                // Must either create or join
                await t.rollback();
                return res.status(400).json({ error: 'Must provide create_team=true or join_team_id for team sports.' });
            }
        }

        // 4. Handle File Upload (Payment Screenshot)
        let screenshotUrl = '';
        if (req.file) {
            // Upload to GitHub
            screenshotUrl = await uploadToGitHub(req.file, 'payments');
        } else {
            await t.rollback();
            return res.status(400).json({ error: 'Payment screenshot is required.' });
        }

        // 5. Create Registration
        const registrationCode = `REG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const registration = await Registration.create({
            registration_code: registrationCode,
            student_id: student.id,
            sport_id: sport.id,
            team_id: teamId,
            is_captain: isCaptain,
            accommodation_needed: accommodation_needed || false,
            payment_status: 'pending',
            status: 'pending'
        }, { transaction: t });

        // 6. Create Payment Record
        await Payment.create({
            registration_id: registration.id,
            amount: sport.amount, // Using sport amount
            txn_id: req.body.txn_id || 'N/A',
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
        console.error('Registration Error:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};
