const { User } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

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

        // Check for user by Username OR Email
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { username: username },
                    { email: username }
                ]
            }
        });

        if (user && (await user.comparePassword(password))) {

            // Update last_login
            user.last_login = new Date();
            await user.save();

            res.json({
                id: user.id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role,
                assigned_sport_id: user.assigned_sport_id,
                token: generateToken(user.id),
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
            const cleanName = name.replace(/\s+/g, '').slice(0, 5);
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            username = `${role}_${cleanName}_${randomSuffix}`.toLowerCase();
        }

        const userExists = await User.findOne({ where: { username } });
        if (userExists) return res.status(400).json({ error: 'Username already exists' });

        const emailExists = await User.findOne({ where: { email } });
        if (emailExists) return res.status(400).json({ error: 'Email already exists' });

        const user = await User.create({
            name, email, username, password, role, assigned_sport_id
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

// @desc    Update User Profile (Self)
// @route   PUT /api/v1/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.username = req.body.username || user.username;

            if (req.body.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(req.body.password, salt);
            }

            const updatedUser = await user.save();

            res.json({
                id: updatedUser.id,
                name: updatedUser.name,
                username: updatedUser.username,
                email: updatedUser.email,
                role: updatedUser.role,
                token: generateToken(updatedUser.id) // Optional: issue new token
            });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
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
