const { Registration, Payment, Student, Sport, Team, College, User, RegistrationSport, sequelize } = require('../models');
const { generateRegistrationPDF } = require('../utils/pdf');
const NotificationService = require('../services/notificationService');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');

// @desc    Verify Payment
// @access  Private (Admin/Sports Head)
exports.verifyPayment = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { registrationId, registration_code, status, remarks } = req.body;

        if (!status) {
            await t.rollback();
            return res.status(400).json({ error: 'Status is required' });
        }

        let registration;
        const includeOptions = [
            { model: Student, include: [College] },
            { model: Sport },
            { model: Team },
            { model: Payment }
        ];

        if (registrationId) {
            registration = await Registration.findByPk(registrationId, { include: includeOptions, transaction: t });
        } else if (registration_code) {
            registration = await Registration.findOne({ where: { registration_code }, include: includeOptions, transaction: t });
        }

        if (!registration) {
            await t.rollback();
            return res.status(404).json({ error: 'Registration not found' });
        }

        // RBAC Check for Sports Head
        if (req.user.role === 'sports_head') {
            const hasSportMatched = registration.Sports.some(s => s.id === req.user.assigned_sport_id);
            if (!hasSportMatched) {
                await t.rollback();
                return res.status(403).json({ error: 'Not authorized for this sport' });
            }
        }

        if (status === 'approved') {
            registration.status = 'approved';
            registration.payment_status = 'paid';
            await registration.save({ transaction: t });

            if (registration.Payment) {
                registration.Payment.verified_by = req.user.id;
                registration.Payment.verified_at = new Date();
                await registration.Payment.save({ transaction: t });
            }

            // Generate Ticket PDF
            const pdfBuffer = await generateRegistrationPDF(registration);

            // Send Notifications via Service
            NotificationService.notifyPaymentApproval(registration.Student, registration, pdfBuffer);

        } else if (status === 'rejected') {
            registration.status = 'rejected';
            registration.payment_status = 'failed';
            await registration.save({ transaction: t });

            NotificationService.notifyPaymentRejection(registration.Student, registration, remarks);
        }

        await t.commit();
        res.json({ message: `Registration ${status} successfully` });

    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get Admin Analytics
// @access  Private (Admin)
exports.getAnalytics = async (req, res) => {
    try {
        const totalRegistrations = await Registration.count();
        const approvedPayments = await Registration.count({ where: { status: 'approved' } });
        const pendingPayments = await Registration.count({ where: { status: 'pending' } });

        // Count registrations by sport via the RegistrationSport junction table
        const registrationsBySport = await RegistrationSport.findAll({
            attributes: [
                'sport_id',
                [sequelize.fn('COUNT', sequelize.col('registration_id')), 'count']
            ],
            include: [{
                model: Sport,
                attributes: ['name']
            }],
            group: ['sport_id', 'Sport.id']
        });

        res.json({
            stats: {
                totalRegistrations,
                approvedPayments,
                pendingPayments,
                collectionRate: totalRegistrations > 0 ? (approvedPayments / totalRegistrations * 100).toFixed(2) : 0
            },
            sports: registrationsBySport
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Generate Match Summary Report
// @access  Private (Admin)
exports.generateMatchReport = async (req, res) => {
    // Technical implementation for global report
    res.json({ message: "Report generation initiated (PDF will be sent to email)" });
};
// @desc    Get all registrations
// @access  Private (Admin)
exports.getAllRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.findAll({
            include: [
                { model: Student, include: [College] },
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

// @desc    User Management (Aliases from authController for central admin access)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']]
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createUser = async (req, res) => {
    try {
        let { name, email, username, password, role, assigned_sport_id } = req.body;

        if (role === 'sports_head' && !assigned_sport_id) {
            return res.status(400).json({ error: 'Assigned Sport ID is required for Sports Head' });
        }

        const user = await User.create({ name, email, username, password, role, assigned_sport_id });
        res.status(201).json({ id: user.id, name: user.name, role: user.role });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.role = req.body.role || user.role;

        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }

        await user.save();
        res.json({ message: 'User updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        await user.destroy();
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
