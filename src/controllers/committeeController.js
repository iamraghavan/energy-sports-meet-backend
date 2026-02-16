const { Registration, Student, College, Sport, Payment, Team } = require('../models');
const { generateCheckInPDF } = require('../utils/pdf');
const { Op } = require('sequelize');

// @desc    List registrations for Committee (Advanced Search)
// @access  Private (Committee/Admin)
exports.getRegistrations = async (req, res) => {
    try {
        const { 
            search, 
            sport_id, 
            status, 
            payment_status,
            college_id,
            date_from, 
            date_to 
        } = req.query;

        let where = {};

        // 1. Exact Filters
        if (status) where.status = status;
        if (payment_status) where.payment_status = payment_status;
        if (college_id) where.college_id = college_id;

        // 2. Date Range
        if (date_from && date_to) {
            where.created_at = { [Op.between]: [date_from, date_to] };
        }

        // 3. Search (Name, RegCode, Mobile) -> Applied directly on Registration
        if (search) {
            where[Op.or] = [
                { registration_code: { [Op.like]: `%${search}%` } },
                { name: { [Op.like]: `%${search}%` } },
                { mobile: { [Op.like]: `%${search}%` } }
            ];
        }

        const registrations = await Registration.findAll({
            where,
            include: [
                {
                    model: Sport,
                    where: sport_id ? { id: sport_id } : {},
                    required: !!sport_id
                },
                { model: College, attributes: ['name', 'city'] }
            ],
            limit: 100,
            order: [['created_at', 'DESC']]
        });

        res.json(registrations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Update Check-in Details
// @access  Private (Committee/Admin)
exports.updateCheckIn = async (req, res) => {
    try {
        const { kit_delivered, id_verified, checked_in } = req.body;
        const registration = await Registration.findByPk(req.params.id);
        
        if (!registration) return res.status(404).json({ error: 'Registration not found' });

        // Update fields if provided
        if (typeof checked_in !== 'undefined') {
            registration.checked_in = checked_in;
            registration.checkin_time = checked_in ? new Date() : null;
        }
        if (typeof kit_delivered !== 'undefined') registration.kit_delivered = kit_delivered;
        if (typeof id_verified !== 'undefined') registration.id_verified = id_verified;

        await registration.save();

        res.json({
            message: 'Check-in details updated',
            data: {
                checked_in: registration.checked_in,
                checkin_time: registration.checkin_time,
                kit_delivered: registration.kit_delivered,
                id_verified: registration.id_verified
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Generate Check-in Pass (HTML)
// @access  Private (Committee/Admin)
exports.generatePass = async (req, res) => {
    try {
        const registration = await Registration.findByPk(req.params.id, {
            include: [{ model: Sport }, { model: Payment }]
        });

        if (!registration) return res.status(404).json({ error: 'Registration not found' });

        // Generate HTML instead of PDF
        const { generatePassHTML } = require('../utils/passTemplate');
        const passHtml = await generatePassHTML(registration);

        res.set('Content-Type', 'text/html');
        res.send(passHtml);
    } catch (error) {
        console.error("Pass Generation Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get student profile & status (unchanged but cleaned up)
// @access  Private (Committee/Admin)
exports.getStudentDetails = async (req, res) => {
    // Since getting "Student" by ID is ambiguous (Student ID or Reg ID?),
    // and Registration IS the student profile now, we should fetch by Registration ID.
    // If frontend sends student ID, it might fail if we don't have it.
    // Assuming frontend calls this with Registration ID from the table.
    try {
        const registration = await Registration.findByPk(req.params.id, {
            include: [{ model: Sport }, { model: Payment }, { model: Team, as: 'Teams' }]
        });

        if (!registration) return res.status(404).json({ error: 'Student/Registration not found' });
        res.json(registration);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
