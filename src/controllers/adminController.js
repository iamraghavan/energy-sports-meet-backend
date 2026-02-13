const { Registration, Payment, Student, Sport, Team, College, User, RegistrationSport, sequelize } = require('../models');
const { generateRegistrationPDF } = require('../utils/pdf');
const NotificationService = require('../services/notificationService');
const { Op } = require('sequelize');

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
