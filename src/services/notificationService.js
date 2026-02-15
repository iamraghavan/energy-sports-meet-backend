const { sendEmail } = require('../utils/email');
const { sendWhatsApp } = require('../utils/whatsapp');
const {
    getRegistrationApprovalTemplate,
    getRegistrationRejectionTemplate
} = require('../utils/emailTemplates');
const logger = require('../utils/logger');

/**
 * Notification Service to handle multi-channel alerts
 */
class NotificationService {
    /**
     * Notify student about payment approval
     */
    static async notifyPaymentApproval(student, registration, pdfBuffer) {
        try {
            // 1. Send Email
            const emailContent = getRegistrationApprovalTemplate({
                name: student.name,
                regCode: registration.registration_code,
                sportName: registration.Sport.name,
                sportType: registration.Sport.type
            });

            await sendEmail({
                to: student.email,
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

            // 2. Send WhatsApp - REMOVED (Handled in Controller with PDF Header)
            /*
            await sendWhatsApp({
                phone: student.phone,
                template_name: 'payment_success',
                variables: [student.name, registration.Sport.name, registration.registration_code],
                buttons: [`${process.env.FRONTEND_URL}/registration/status?id=${registration.registration_code}`]
            });
            */

            logger.info(`Notifications sent to ${student.name} for approved registration ${registration.registration_code}`);
        } catch (error) {
            logger.error(`Notification Error (Approval): ${error.message}`);
        }
    }

    /**
     * Notify student about payment rejection
     */
    static async notifyPaymentRejection(student, registration, reason) {
        try {
            const emailContent = getRegistrationRejectionTemplate({
                name: student.name,
                sportName: registration.Sport.name,
                reason: reason || 'Payment verification failed.'
            });

            await sendEmail({
                to: student.email,
                subject: `Update: ${registration.Sport.name} Registration`,
                text: emailContent.text,
                html: emailContent.html
            });

            await sendWhatsApp({
                phone: student.phone,
                template_name: 'payment_rejection',
                variables: [student.name, registration.Sport.name, reason || 'Verification Failed']
            });

            logger.info(`Rejection notifications sent to ${student.name}`);
        } catch (error) {
            logger.error(`Notification Error (Rejection): ${error.message}`);
        }
    }

    /**
     * Notify teams about match schedules
     */
    static async notifyMatchSchedule(teams, match) {
        // Implementation for match notification
        // ...
    }
}

module.exports = NotificationService;
