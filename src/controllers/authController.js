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
        const { username, password } = req.body;

        const user = await User.findOne({ where: { username } });

        if (user && (await user.comparePassword(password))) {
            res.json({
                id: user.id,
                username: user.username,
                role: user.role,
                assigned_sport_id: user.assigned_sport_id,
                token: generateToken(user.id),
            });
        } else {
            res.status(401).json({ error: 'Invalid email or password' });
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
        const { username, password, role, assigned_sport_id } = req.body;

        const userExists = await User.findOne({ where: { username } });

        if (userExists) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const user = await User.create({
            username,
            password,
            role,
            assigned_sport_id
        });

        if (user) {
            res.status(201).json({
                id: user.id,
                username: user.username,
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
            attributes: { exclude: ['password'] }
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
