const { Student, Registration, Sport, Team, Payment, College, RegistrationSport, sequelize } = require('../models');
const { uploadToGitHub } = require('../utils/upload');
const { v4: uuidv4 } = require('uuid');
const { generateRegistrationPDF, generateCheckInPDF } = require('../utils/pdf');
const { Op } = require('sequelize');

/**
 * @desc    Public Student Registration
 * @route   POST /api/v1/register
 * @access  Public
 */
exports.registerStudent = async (req, res) => {
    let t;
    try {
        let {
            name, email, mobile, whatsapp, city, state,
            college_id, other_college,
            selected_sport_ids, // Expecting Array or comma-separated string
            accommodation_needed,
            college_contact, college_email, pd_name, pd_whatsapp,
            txn_id,
            create_team, team_name
        } = req.body;

        console.log('--- Public Registration Received ---');

        // Normalize selected_sport_ids
        if (typeof selected_sport_ids === 'string') {
            selected_sport_ids = selected_sport_ids.split(',').map(s => parseInt(s.trim()));
        }

        if (!selected_sport_ids || !Array.isArray(selected_sport_ids) || selected_sport_ids.length === 0) {
            throw new Error('At least one sport must be selected.');
        }

        // Basic Validation
        const requiredFields = ['name', 'email', 'mobile', 'txn_id', 'city', 'state'];
        const missing = requiredFields.filter(f => !req.body[f]);
        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }

        t = await sequelize.transaction();

        // 1. Handle College Metadata
        let finalCollegeName = '';
        let finalCollegeId = null;

        if (college_id && college_id !== 'other' && college_id !== '') {
            const college = await College.findByPk(college_id, { transaction: t });
            if (college) {
                finalCollegeId = college.id;
                finalCollegeName = college.name;

                // Update college PD info if provided (optional)
                const collegeUpdates = {};
                if (college_contact) collegeUpdates.college_contact = college_contact;
                if (college_email) collegeUpdates.college_email = college_email;
                if (pd_name) collegeUpdates.pd_name = pd_name;
                if (pd_whatsapp) collegeUpdates.pd_whatsapp = pd_whatsapp;

                if (Object.keys(collegeUpdates).length > 0) {
                    await college.update(collegeUpdates, { transaction: t });
                }
            } else {
                throw new Error('Selected college not found.');
            }
        } else if (other_college) {
            finalCollegeName = other_college;
            const [collegeInstance] = await College.findOrCreate({
                where: {
                    name: other_college,
                    city: city || 'Unknown',
                    state: state || 'Unknown'
                },
                defaults: { college_contact, college_email, pd_name, pd_whatsapp },
                transaction: t
            });
            finalCollegeId = collegeInstance.id;
        } else {
            throw new Error('College name is required.');
        }

        // 2. Sport Validation & Fee Calculation
        const sports = await Sport.findAll({
            where: { id: selected_sport_ids },
            transaction: t
        });

        if (sports.length !== selected_sport_ids.length) {
            throw new Error('One or more selected Sport IDs are invalid.');
        }

        const totalAmount = sports.reduce((sum, s) => sum + parseFloat(s.amount), 0);

        // 3. Create Registration (Lead-First)
        const currentYear = new Date().getFullYear();
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let randomSuffix = '';
        for (let i = 0; i < 6; i++) randomSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
        const registrationCode = `EGSP/ENERGY/${currentYear}/${randomSuffix}`;

        const registration = await Registration.create({
            registration_code: registrationCode,
            // Student Details saved directly in Registration
            name,
            email,
            mobile,
            whatsapp,
            city,
            state,
            other_college,
            // College Info
            college_id: finalCollegeId,
            college_name: finalCollegeName,
            college_city: city,
            college_state: state,
            pd_name,
            pd_whatsapp,
            college_email,
            college_contact,
            total_amount: totalAmount,
            accommodation_needed: accommodation_needed === 'true' || accommodation_needed === true,
            is_captain: true, // Lead is the captain
            payment_status: 'pending',
            status: 'pending'
        }, { transaction: t });

        // Skip Team creation as per request.

        // 6. Link Sports via Join Table
        const registrationSportsData = selected_sport_ids.map(sid => ({
            registration_id: registration.id,
            sport_id: sid
        }));
        await RegistrationSport.bulkCreate(registrationSportsData, { transaction: t });

        // 7. File Upload (Screenshot)
        let screenshotUrl = '';
        if (req.file) {
            screenshotUrl = await uploadToGitHub(req.file, 'payments');
        } else {
            throw new Error('Payment screenshot is required.');
        }

        // 8. Create Payment record
        await Payment.create({
            registration_id: registration.id,
            amount: totalAmount,
            txn_id: txn_id,
            screenshot_url: screenshotUrl
        }, { transaction: t });

        await t.commit();

        // 9. Notifications (Async)
        const { sendWhatsApp } = require('../utils/whatsapp');
        const { sendEmail } = require('../utils/email');
        const { getRegistrationReceiptTemplate } = require('../utils/emailTemplates');

        const triggerNotifications = async () => {
            // Full summary for Email (no length restriction)
            const emailSportSummary = sports.map(s => `${s.name} (${s.category})`).join(', ');

            // Short summary for WhatsApp (due to template variable limits)
            let whatsappSportSummary = emailSportSummary;
            if (sports.length > 1) {
                whatsappSportSummary = "Multiple Events (Check Dashboard)";
            }

            try {
                await sendWhatsApp({
                    phone: mobile,
                    template_name: 'energy_sports_meet_2026_registration_received',
                    variables: [name, registrationCode, whatsappSportSummary, 'Pending']
                });
            } catch (err) { console.error('WhatsApp Notification Failed', err); }

            try {
                // Use full summary for email
                const content = getRegistrationReceiptTemplate({ name, regCode: registrationCode, sportName: emailSportSummary });
                await sendEmail({
                    to: email,
                    subject: 'Registration Received - Energy Sports Meet 2026',
                    text: content.text,
                    html: content.html
                });
            } catch (err) { console.error('Email Notification Failed', err); }

            try {
                const { appendRegistrationToSheet } = require('../utils/googleSheets');
                await appendRegistrationToSheet({
                    registration_code: registrationCode,
                    name, email, mobile, whatsapp, city, state,
                    sports: sportSummary, amount: totalAmount, txn_id,
                    payment_status: 'Pending', status: 'Pending',
                    accommodation: accommodation_needed,
                    college: finalCollegeName, pd_name, pd_whatsapp
                });
            } catch (err) { console.error('Google Sheets Backup Failed'); }
        };
        triggerNotifications();

        res.status(201).json({
            status: 'success',
            message: 'Registration successful',
            data: {
                registration_id: registration.id,
                registration_code: registrationCode,
                student: { name, email, mobile },
                payment: { total_amount: totalAmount, txn_id, status: 'pending' },
                sports: sports.map(s => ({ id: s.id, name: s.name })),
                team: null // Teams are no longer created during registration
            }
        });

    } catch (error) {
        if (t && !t.finished) await t.rollback();
        console.error('Registration Error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

/**
 * @desc    Get all registrations (Admin/Sports Head)
 */
exports.getRegistrations = async (req, res) => {
    try {
        const { role, assigned_sport_id } = req.user;
        let whereClause = {};

        if (role === 'sports_head' && assigned_sport_id) {
            // Filter logic for sports head
        }

        const registrations = await Registration.findAll({
            where: whereClause,
            include: [{ model: Sport }, { model: Team, as: 'Teams' }, { model: Payment }],
            order: [['created_at', 'DESC']]
        });
        res.json(registrations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * @desc    Get Registration details by ID or Code
 */
exports.getRegistrationById = async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'ID is required' });
        let whereClause = id.includes('EGSP') ? { registration_code: id } : { id };
        const registration = await Registration.findOne({
            where: whereClause,
            include: [{ model: Sport }, { model: Team, as: 'Teams' }, { model: Payment }]
        });
        if (!registration) return res.status(404).json({ error: 'Registration not found' });
        res.json(registration);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * @desc    Download Ticket PDF
 */
exports.downloadTicket = async (req, res) => {
    try {
        const id = req.params.id || req.query.id;
        let whereClause = id.includes('EGSP') ? { registration_code: id } : { id };
        const registration = await Registration.findOne({
            where: whereClause,
            include: [{ model: Sport }, { model: Payment }]
        });
        if (!registration) return res.status(404).json({ error: 'Registration not found' });
        const pdfBuffer = await generateRegistrationPDF(registration);
        
        // Set headers for file download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Energy_Sports_Meet_Ticket_${registration.registration_code.replace(/\//g, '_')}.pdf"`);
        
        res.send(pdfBuffer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * @desc    Download Check-in PDF
 */
exports.downloadCheckIn = async (req, res) => {
    try {
        const id = req.params.id || req.query.id;
        let whereClause = id.includes('EGSP') ? { registration_code: id } : { id };
        const registration = await Registration.findOne({
            where: whereClause,
            include: [{ model: Sport }]
        });
        if (!registration) return res.status(404).json({ error: 'Registration not found' });
        const pdfBuffer = await generateCheckInPDF(registration);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Energy_Meet_CheckIn_${registration.registration_code.replace(/\//g, '_')}.pdf"`);
        
        res.send(pdfBuffer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
