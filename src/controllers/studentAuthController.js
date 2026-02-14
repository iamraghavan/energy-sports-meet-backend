const { Student } = require('../models');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { sendWhatsApp } = require('../utils/whatsapp');
const { sendEmail } = require('../utils/email');

// Generate JWT for Student
const generateStudentToken = (id) => {
    return jwt.sign({ id, type: 'student' }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

/**
 * @desc    Request OTP for Login/Register
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

        let student = await Student.findOne({
            where: isEmail ? { email: identifier } : { mobile: identifier }
        });

        if (!student) {
            return res.status(404).json({
                error: 'Registration not found. Please register first to access your account.',
                needsRegistration: true
            });
        }

        // Update OTP
        student.otp = otp;
        student.otp_expiry = otp_expiry;
        await student.save();

        // Send OTP
        if (isEmail) {
            await sendEmail({
                to: identifier,
                subject: 'Your Login OTP - Energy Sports Meet 2026',
                text: `Your OTP for login is ${otp}. It expires in 10 minutes.`,
                html: `<p>Your OTP for login is <b>${otp}</b>. It expires in 10 minutes.</p>`
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
 * @desc    Verify OTP and Login/Register
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
        const student = await Student.findOne({
            where: isEmail ? { email: identifier } : { mobile: identifier }
        });

        if (!student || student.otp !== otp || new Date() > student.otp_expiry) {
            return res.status(401).json({ error: 'Invalid or expired OTP' });
        }

        // Clear OTP after successful verify
        student.otp = null;
        student.otp_expiry = null;
        await student.save();

        // Check if registration is complete (has name and city)
        const isNewUser = student.name === 'Pending Registration';

        res.json({
            id: student.id,
            name: student.name,
            email: student.email,
            mobile: student.mobile,
            isNewUser,
            token: generateStudentToken(student.id)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
