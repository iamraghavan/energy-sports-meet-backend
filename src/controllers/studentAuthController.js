const { Registration, Sport, Team } = require('../models');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { sendWhatsApp } = require('../utils/whatsapp');
const { sendEmail } = require('../utils/email');

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
            order: [['createdAt', 'DESC']]
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
            await sendEmail({
                to: identifier,
                subject: 'Login OTP - Energy Sports Meet 2026',
                html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
                    <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 1px;">Energy Sports Meet 2026</h1>
                    </div>
                    <div style="padding: 40px 30px; text-align: center; color: #333333;">
                        <h2 style="margin-top: 0; color: #1e3a8a; font-size: 22px;">Verification Code</h2>
                        <p style="font-size: 16px; line-height: 1.6; color: #666666;">Use the following 6-digit code to complete your login. This code is valid for 10 minutes.</p>
                        
                        <div style="margin: 30px 0; background-color: #f3f4f6; border-radius: 10px; padding: 20px; display: inline-block;">
                            <span style="font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #1e3a8a; font-family: 'Courier New', Courier, monospace;">${otp}</span>
                        </div>
                        
                        <p style="font-size: 14px; color: #9ca3af; margin-bottom: 0;">If you didn't request this code, please ignore this email.</p>
                    </div>
                    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
                        <p style="font-size: 12px; color: #9ca3af; margin: 0;">&copy; 2026 E.G.S. Pillay Group of Institutions. All rights reserved.</p>
                        <p style="font-size: 12px; color: #9ca3af; margin: 5px 0 0 0;">Nagapattinam, Tamil Nadu.</p>
                    </div>
                </div>
                `
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
            order: [['createdAt', 'DESC']]
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
