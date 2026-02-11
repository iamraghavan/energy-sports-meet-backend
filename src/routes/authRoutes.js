const express = require('express');
const router = express.Router();
const { login, createUser, getAllUsers, deleteUser } = require('../controllers/authController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.post('/login', login);

// Only Super Admin can manage users
router.post('/create-user', protect, authorize('super_admin'), createUser);
router.get('/users', protect, authorize('super_admin'), getAllUsers);
router.delete('/users/:id', protect, authorize('super_admin'), deleteUser);

module.exports = router;
