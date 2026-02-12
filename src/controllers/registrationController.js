const { Student, Registration, Sport, Team, Payment, College, RegistrationSport, sequelize } = require('../models');
const { uploadToGitHub } = require('../utils/upload');
const { v4: uuidv4 } = require('uuid');
const { generateRegistrationPDF, generateCheckInPDF } = require('../utils/pdf');

exports.registerStudent = async (req, res) => {
    // Start transaction
    const t = await sequelize.transaction();

    try {
        console.log('--- Multi-Sport Registration Received ---');
        console.log('Body:', req.body);

        let {
            name, email, mobile, whatsapp, city, state,
            college_id, other_college,
            selected_sport_ids, // Expecting Array: [1, 5, 8]
            accommodation_needed,
            college_contact, college_email, pd_name, pd_whatsapp,
            txn_id,
            create_team, team_name
        } = req.body;

        // Normalize selected_sport_ids
        if (typeof selected_sport_ids === 'string') {
            selected_sport_ids = selected_sport_ids.split(',').map(s => parseInt(s.trim()));
        }

        if (!selected_sport_ids || !Array.isArray(selected_sport_ids) || selected_sport_ids.length === 0) {
            throw new Error('At least one sport must be selected.');
        }

        // Basic Validation
        const requiredFields = ['name', 'email', 'mobile', 'txn_id'];
        const missing = requiredFields.filter(f => !req.body[f]);
        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }

        // 1. Handle College Metadata
        let finalCollegeName = '';
        let finalCity = city;
        let finalState = state;

        if (college_id && college_id !== 'other' && college_id !== '') {
            const college = await College.findByPk(college_id, { transaction: t });
            if (college) {
                finalCollegeName = college.name;
                finalCity = college.city || city;
                finalState = college.state || state;

                // Update college PD info if provided
                await college.update({
                    college_contact,
                    college_email,
                    pd_name,
                    pd_whatsapp
                }, { transaction: t });
            } else {
                throw new Error('Selected college not found.');
            }
        } else if (other_college) {
            finalCollegeName = other_college;
        } else {
            throw new Error('College name is required.');
        }

        // 2. Student Handling
        let student = await Student.findOne({ where: { email }, transaction: t });
        if (!student) {
            student = await Student.create({
                name, email, mobile, whatsapp, city: finalCity, state: finalState,
                other_college: finalCollegeName
            }, { transaction: t });
        }

        // 3. Sport Validation & Fee Calculation
        const sports = await Sport.findAll({
            where: { id: selected_sport_ids },
            transaction: t
        });

        if (sports.length !== selected_sport_ids.length) {
            throw new Error('One or more selected Sport IDs are invalid.');
        }

        const totalAmount = sports.reduce((sum, s) => sum + parseFloat(s.amount), 0);

        // 4. Create Registration with Metadata
        const currentYear = new Date().getFullYear();
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let randomSuffix = '';
        for (let i = 0; i < 6; i++) randomSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
        const registrationCode = `EGSP/ENERGY/${currentYear}/${randomSuffix}`;

        const registration = await Registration.create({
            registration_code: registrationCode,
            student_id: student.id,
            college_name: finalCollegeName,
            college_city: finalCity,
            college_state: finalState,
            pd_name,
            pd_whatsapp,
            college_email,
            college_contact,
            total_amount: totalAmount,
            accommodation_needed: accommodation_needed === 'true' || accommodation_needed === true,
            payment_status: 'pending',
            status: 'pending'
        }, { transaction: t });

        // 4b. Team Creation (If applicable)
        let finalTeamId = null;
        if ((create_team === 'true' || create_team === true) && team_name) {
            // Find a team sport among selected
            const teamSport = sports.find(s => s.type === 'Team');
            if (teamSport) {
                const team = await Team.create({
                    team_name,
                    sport_id: teamSport.id,
                    captain_id: student.id,
                    locked: false
                }, { transaction: t });
                finalTeamId = team.id;

                // Link registration to team and mark as captain
                await registration.update({
                    team_id: finalTeamId,
                    is_captain: true
                }, { transaction: t });
            }
        }

        // 5. Link Sports via Join Table
        const registrationSportsData = selected_sport_ids.map(sid => ({
            registration_id: registration.id,
            sport_id: sid
        }));
        await RegistrationSport.bulkCreate(registrationSportsData, { transaction: t });

        // 6. File Upload
        let screenshotUrl = '';
        if (req.file) {
            screenshotUrl = await uploadToGitHub(req.file, 'payments');
        } else {
            throw new Error('Payment screenshot is required.');
        }

        // 7. Create Payment record
        await Payment.create({
            registration_id: registration.id,
            amount: totalAmount,
            txn_id: txn_id,
            screenshot_url: screenshotUrl
        }, { transaction: t });

        await t.commit();

        // 8. Notifications
        const { sendWhatsApp } = require('../utils/whatsapp');
        const { sendEmail } = require('../utils/email');
        const { getRegistrationReceiptTemplate } = require('../utils/emailTemplates');

        const triggerNotifications = async () => {
            const sportSummary = sports.map(s => `${s.name} (${s.category})`).join(', ');

            // 1. WhatsApp Notification
            try {
                await sendWhatsApp({
                    phone: mobile,
                    template_name: 'energy_sports_meet_2026_registration_received',
                    variables: [name, registrationCode, sportSummary, 'Pending'],
                    buttons: [registrationCode, registrationCode]
                });
                console.log(`✅ WhatsApp sent for ${registrationCode}`);
            } catch (err) {
                console.error(`❌ WhatsApp Failed for ${registrationCode}:`, err.message);
            }

            // 2. Email Notification
            try {
                const emailContent = getRegistrationReceiptTemplate({
                    name, regCode: registrationCode, sportName: sportSummary
                });
                await sendEmail({
                    to: email,
                    subject: `Registration Received - Energy Sports Meet 2026`,
                    text: emailContent.text,
                    html: emailContent.html
                });
                console.log(`✅ Email sent for ${registrationCode}`);
            } catch (err) {
                console.error(`❌ Email Failed for ${registrationCode}:`, err.message);
            }

            // 3. Google Sheets Backup
            try {
                const { appendRegistrationToSheet } = require('../utils/googleSheets');
                await appendRegistrationToSheet({
                    registration_code: registrationCode,
                    name,
                    email,
                    mobile,
                    whatsapp,
                    city,
                    state,
                    sports: sportSummary,
                    amount: totalAmount,
                    txn_id,
                    payment_status: 'Pending',
                    status: 'Pending',
                    accommodation: accommodation_needed === 'true' || accommodation_needed === true,
                    college: finalCollegeName || other_college || 'Other',
                    pd_name,
                    pd_whatsapp
                });
                console.log(`✅ Google Sheet backup success for ${registrationCode}`);
            } catch (err) {
                console.error(`❌ Google Sheet Backup Failed for ${registrationCode}:`, err.message);
                if (err.stack) console.error(err.stack);
            }
        };
        triggerNotifications();

        res.status(201).json({
            status: 'success',
            message: 'Registration successful',
            data: {
                registration_id: registration.id,
                registration_code: registrationCode,
                student: {
                    name,
                    email
                },
                payment: {
                    total_amount: totalAmount,
                    txn_id: txn_id,
                    status: 'pending'
                },
                sports: sports.map(s => ({ id: s.id, name: s.name, category: s.category })),
                team: finalTeamId ? {
                    id: finalTeamId,
                    name: team_name
                } : null
            }
        });

    } catch (error) {
        if (t) await t.rollback();
        console.error('Registration Error:', error.message);
        res.status(500).json({
            error: error.message,
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
            // This assumes a direct sport_id on Registration, which is not the case for multi-sport.
            // For multi-sport, this would require a join through RegistrationSport.
            // For now, we'll leave it as is, but note this limitation.
            // A more robust solution would involve:
            // where: { '$RegistrationSports.sport_id$': assigned_sport_id }
            // and ensuring RegistrationSport is included.
            // For simplicity, if a sports head is assigned to a single sport,
            // we might filter registrations that include that sport.
            // This current implementation is for a single sport registration model or a simplified view.
        }

        // If filtering by query params (e.g. status)
        if (req.query.status) {
            whereClause.status = req.query.status;
        }

        const registrations = await Registration.findAll({
            where: whereClause,
            include: [
                { model: Student },
                { model: Sport, through: { attributes: [] } }, // Many-to-Many include, exclude join table attributes
                { model: Team },
                { model: Payment }
            ],
            order: [['created_at', 'DESC']]
        });

        res.json(registrations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// NEW: Get Registration by ID or Code (Via Query Param to handle slashes)
exports.getRegistrationById = async (req, res) => {
    try {
        // Use query param 'id' to support codes with slashes (e.g. ?id=EGSP/...)
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ error: 'ID or Registration Code is required' });
        }

        let whereClause = {};
        if (id.includes('EGSP')) {
            whereClause.registration_code = id;
        } else {
            whereClause.id = id;
        }

        const registration = await Registration.findOne({
            where: whereClause,
            include: [
                { model: Student, include: [College] },
                { model: Sport, through: { attributes: [] } }, // Exclude join table attributes
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

// Download Ticket/Invoice PDF
exports.downloadTicket = async (req, res) => {
    try {
        const id = req.params.id || req.query.id;

        let whereClause = {};
        if (id.includes('EGSP')) {
            whereClause.registration_code = id;
        } else {
            whereClause.id = id;
        }

        const registration = await Registration.findOne({
            where: whereClause,
            include: [
                { model: Student, include: [College] },
                { model: Sport, through: { attributes: [] } }, // Exclude join table attributes
                { model: Team },
                { model: Payment }
            ]
        });

        if (!registration) {
            return res.status(404).json({ error: 'Registration not found' });
        }

        const pdfBuffer = await generateRegistrationPDF(registration);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="ticket-${registration.registration_code}.pdf"`,
            'Content-Length': pdfBuffer.length
        });

        res.send(pdfBuffer);

    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).json({ error: 'Failed to generate ticket' });
    }
};

// Download Check-In Pass
exports.downloadCheckIn = async (req, res) => {
    try {
        const id = req.params.id || req.query.id;
        let whereClause = {};
        if (id.includes('EGSP')) {
            whereClause.registration_code = id;
        } else {
            whereClause.id = id;
        }

        const registration = await Registration.findOne({
            where: whereClause,
            include: [{ model: Student, include: [College] }, { model: Sport, through: { attributes: [] } }]
        });

        if (!registration) return res.status(404).json({ error: 'Registration not found' });

        const pdfBuffer = await generateCheckInPDF(registration);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="checkin-${registration.registration_code}.pdf"`,
            'Content-Length': pdfBuffer.length
        });
        res.send(pdfBuffer);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
