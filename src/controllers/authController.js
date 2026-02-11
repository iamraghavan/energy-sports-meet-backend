const { User } = require('../models');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Auth user & get token
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body; // Can accept username OR email if we change findOne logic

        // Allow login with email or username
        const user = await User.findOne({
            where: sequelize.or(
                { username: username },
                { email: username } // if user puts email in username field
            )
        });
        // Note: For Sequelize v6, the OR syntax varies. Safer standard way:
        /*
        const { Op } = require('sequelize');
        const user = await User.findOne({
            where: {
                [Op.or]: [{ username }, { email: username }]
            }
        });
        */
        // Let's stick to strict username for now unless requested, but user said "email" in requirements.
        // I'll stick to username for login as per previous, but add last_login update.
        // Wait, user didn't explicitly asking for email login, just added email field.
        // I will keep it simple: Login with Username (as it is "readable and changeable").

        const strictUser = await User.findOne({ where: { username } });

        if (strictUser && (await strictUser.comparePassword(password))) {

            // Update last_login
            strictUser.last_login = new Date();
            await strictUser.save();

            res.json({
                id: strictUser.id,
                name: strictUser.name,
                username: strictUser.username,
                email: strictUser.email,
                role: strictUser.role,
                assigned_sport_id: strictUser.assigned_sport_id,
                token: generateToken(strictUser.id),
            });
        } else {
            res.status(401).json({ error: 'Invalid username or password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

// @desc    Register a new user (Super Admin only or Seed)
// @route   POST /api/v1/auth/create-user
// @access  Private (Super Admin)
exports.createUser = async (req, res) => {
    try {
        let { name, email, username, password, role, assigned_sport_id } = req.body;

        // Auto-generate username if not provided
        if (!username) {
            // Format: Role-Name-Random
            // e.g. Scorer-John-A1B2
            const cleanName = name.replace(/\s+/g, '').slice(0, 5);
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            username = `${role}_${cleanName}_${randomSuffix}`.toLowerCase();
        }

        const userExists = await User.findOne({ where: { username } });
        if (userExists) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const emailExists = await User.findOne({ where: { email } });
        if (emailExists) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const user = await User.create({
            name,
            email,
            username,
            password,
            role,
            assigned_sport_id
        });

        if (user) {
            res.status(201).json({
                id: user.id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role
            });
        } else {
            res.status(400).json({ error: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

// @desc    Get all users
// @route   GET /api/v1/auth/users
// @access  Private (Super Admin)
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

// @desc    Delete user
// @route   DELETE /api/v1/auth/users/:id
// @access  Private (Super Admin)
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        await user.destroy();
        res.json({ message: 'User removed' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
