const jwt = require('jsonwebtoken');
const { User, Student } = require('../models');

exports.protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            req.user = await User.findByPk(decoded.id);

            if (!req.user) {
                return res.status(401).json({ error: 'User not found' });
            }

            next();
        } catch (error) {
            console.error('Auth Middleware Error:', error);
            res.status(401).json({ error: 'Not authorized' });
        }
    }

    if (!token) {
        res.status(401).json({ error: 'Not authorized, no token' });
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};

exports.protectStudent = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (decoded.type !== 'student') {
                return res.status(401).json({ error: 'Not authorized as student' });
            }

            // In Lead-First flow, the "Student" is actually a Registration record
            req.student = await Registration.findByPk(decoded.id);

            if (!req.student) {
                return res.status(401).json({ error: 'Registration record not found' });
            }

            next();
        } catch (error) {
            console.error('Student Auth Middleware Error:', error);
            res.status(401).json({ error: 'Not authorized' });
        }
    }

    if (!token) {
        res.status(401).json({ error: 'Not authorized, no token' });
    }
};
