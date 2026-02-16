const { Registration, Sport, Team } = require('../models');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { sendWhatsApp } = require('../utils/whatsapp');
const { sendEmail } = require('../utils/email');
const { getOTPEmailTemplate } = require('../utils/emailTemplates');

// Generate JWT for Student (using Registration ID/Registration Code)
const generateStudentToken = (id, type = 'student') => {
    return jwt.sign({ id, type }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

/**
 * @desc    Request OTP for Login/Register (Lead-First)
 * @route   POST /api/v1/auth/student/request-otp
 * @access  Public
 */
exports.requestOTP = async (req, res) => {
    try {
        const { identifier } = req.body; // mobile or email

        if (!identifier) {
            return res.status(400).json({ error: 'Email or Mobile number is required' });
        }

        const isEmail = identifier.includes('@');
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
        const otp_expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Find the LATEST registration for this identifier
        let registration = await Registration.findOne({
            where: isEmail ? { email: identifier } : { mobile: identifier },
            order: [['created_at', 'DESC']]
        });

        if (!registration) {
            return res.status(404).json({
                error: 'Registration not found. Please register first to access your account.',
                needsRegistration: true
            });
        }

        // Update OTP in the registration record
        registration.otp = otp;
        registration.otp_expiry = otp_expiry;
        await registration.save();

        // Send OTP
        if (isEmail) {
            const emailContent = getOTPEmailTemplate(otp);
            await sendEmail({
                to: identifier,
                subject: 'Login OTP - Energy Sports Meet 2026',
                html: emailContent.html,
                text: emailContent.text
            });
        } else {
            // WhatsApp OTP Login
            await sendWhatsApp({
                phone: identifier,
                template_name: 'egspogi_login_v1',
                template_language: 'en_US',
                variables: [otp],
                buttons: [otp] // For buttonURL1
            });
        }

        res.json({ message: `OTP sent to ${isEmail ? 'email' : 'WhatsApp'}` });
    } catch (error) {
        console.error('OTP Request Error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * @desc    Verify OTP and Login
 * @route   POST /api/v1/auth/student/verify-otp
 * @access  Public
 */
exports.verifyOTP = async (req, res) => {
    try {
        const { identifier, otp } = req.body;

        if (!identifier || !otp) {
            return res.status(400).json({ error: 'Identifier and OTP are required' });
        }

        const isEmail = identifier.includes('@');
        const registration = await Registration.findOne({
            where: isEmail ? { email: identifier } : { mobile: identifier },
            include: [
                {
                    model: Sport,
                    through: { attributes: [] }
                },
                {
                    model: Team,
                    as: 'Teams' // Re-check association in models/index.js if needed. It was Registration.hasMany(Team, { foreignKey: 'registration_id' })
                }
            ],
            order: [['created_at', 'DESC']]
        });

        if (!registration || registration.otp !== otp || new Date() > registration.otp_expiry) {
            return res.status(401).json({ error: 'Invalid or expired OTP' });
        }

        // Clear OTP after successful verify
        registration.otp = null;
        registration.otp_expiry = null;
        await registration.save();

        // Convert to JSON and remove sensitive fields
        const userData = registration.toJSON();
        delete userData.otp;
        delete userData.otp_expiry;

        res.json({
            ...userData,
            isNewUser: false,
            token: generateStudentToken(registration.id)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
