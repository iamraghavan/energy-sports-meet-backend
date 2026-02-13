const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Verify Payment: accessible by Super Admin and Sports Head
router.post('/verify-payment', protect, authorize('super_admin', 'sports_head'), adminController.verifyPayment);

// Analytics: accessible by Super Admin only
router.get('/analytics', protect, authorize('super_admin'), adminController.getAnalytics);

// Reports: accessible by Super Admin only
router.get('/reports/matches', protect, authorize('super_admin'), adminController.generateMatchReport);

module.exports = router;
