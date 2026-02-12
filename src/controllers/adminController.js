const { Registration, Payment, Student, Sport, Team, College, sequelize } = require('../models');
const { generateRegistrationPDF } = require('../utils/pdf');
const { sendEmail } = require('../utils/email');
const { getRegistrationApprovalTemplate, getRegistrationRejectionTemplate } = require('../utils/emailTemplates');

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

        // --- RBAC Check ---
        if (req.user.role === 'sports_head' && registration.sport_id !== req.user.assigned_sport_id) {
            await t.rollback();
            return res.status(403).json({ error: 'You are not authorized to verify registrations for this sport.' });
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

            // Professional Email Template
            const emailContent = getRegistrationApprovalTemplate({
                name: registration.Student.name,
                regCode: registration.registration_code,
                sportName: registration.Sport.name,
                sportType: registration.Sport.type
            });

            // Send Email with PDF attachment
            await sendEmail({
                to: registration.Student.email,
                subject: `Confirmed: ${registration.Sport.name} - Energy Sports Meet 2026`,
                text: emailContent.text,
                html: emailContent.html,
                attachments: [
                    {
                        filename: `Ticket-${registration.registration_code.replace(/\//g, '-')}.pdf`,
                        content: pdfBuffer
                    }
                ]
            });

        } else if (status === 'rejected') {
            registration.status = 'rejected';
            registration.payment_status = 'failed';
            await registration.save({ transaction: t });

            // Send Rejection Email (Optional but requested for "all usecases")
            const emailContent = getRegistrationRejectionTemplate({
                name: registration.Student.name,
                sportName: registration.Sport.name,
                reason: remarks || 'Payment verification failed.'
            });

            await sendEmail({
                to: registration.Student.email,
                subject: `Update: ${registration.Sport.name} Registration`,
                text: emailContent.text,
                html: emailContent.html
            });
        }

        await t.commit();
        res.json({ message: `Registration ${status} successfully` });

    } catch (error) {
        if (t) await t.rollback();
        console.error('Verification Error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
