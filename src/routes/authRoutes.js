const express = require('express');
const router = express.Router();
const { login, createUser, getAllUsers, deleteUser, updateProfile } = require('../controllers/authController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.post('/login', login);

// Super Admin User Management
router.post('/create-user', protect, authorize('super_admin'), createUser);
router.get('/users', protect, authorize('super_admin'), getAllUsers);
router.delete('/users/:id', protect, authorize('super_admin'), deleteUser);

// Profile Management (All authenticated users)
router.put('/profile', protect, updateProfile);

module.exports = router;
