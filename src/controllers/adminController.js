const { Registration, Payment, Student, Sport, Team, College, sequelize } = require('../models');
const { generateConfirmationPDF } = require('../utils/pdf');
const { sendEmail } = require('../utils/email');

exports.verifyPayment = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { registrationId } = req.params;
        const { status, remarks } = req.body; // status: 'approved' | 'rejected'

        // Check if user is authorized (if not Super Admin)
        // Note: req.user is set by authMiddleware
        // We need to fetch registration first to check sport_id

        const registration = await Registration.findByPk(registrationId, {
            include: [
                { model: Student, include: [College] },
                { model: Sport },
                { model: Team },
                { model: Payment }
            ],
            transaction: t
        });

        if (!registration) {
            await t.rollback();
            return res.status(404).json({ error: 'Registration not found' });
        }

        // --- RBAC Check ---
        if (req.user.role === 'sports_head') {
            if (registration.sport_id !== req.user.assigned_sport_id) {
                await t.rollback();
                return res.status(403).json({ error: 'You are not authorized to verify registrations for this sport.' });
            }
        }
        // Super Admins can verify anything.
        // Scorers/Committee shouldn't even reach here due to route middleware, but safety first.
        if (!['super_admin', 'sports_head'].includes(req.user.role)) {
            await t.rollback();
            return res.status(403).json({ error: 'Unauthorized role.' });
        }
        // ------------------

        if (status === 'approved') {
            // Update Registration Status
            registration.status = 'approved';
            registration.payment_status = 'paid';
            await registration.save({ transaction: t });

            // Update Payment Status
            if (registration.Payment) {
                registration.Payment.verified_by = req.user.id;
                registration.Payment.verified_at = new Date();
                await registration.Payment.save({ transaction: t });
            }

            // Generate PDF
            const pdfBuffer = await generateConfirmationPDF(registration);

            // Send Email
            await sendEmail(
                registration.Student.email,
                'Registration Confirmed - Energy Sports Meet',
                `Dear ${registration.Student.name},\n\nYour registration for ${registration.Sport.name} has been approved. Please find the attached confirmation slip.\n\nRegards,\nEnergy Sports Meet Team`,
                [
                    {
                        filename: `confirmation-${registration.registration_code}.pdf`,
                        content: pdfBuffer
                    }
                ]
            );

        } else if (status === 'rejected') {
            registration.status = 'rejected';
            registration.payment_status = 'failed';
            await registration.save({ transaction: t });

            // Optionally send rejection email
        }

        await t.commit();
        res.json({ message: `Registration ${status} successfully` });

    } catch (error) {
        if (t) await t.rollback();
        console.error('Verification Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
