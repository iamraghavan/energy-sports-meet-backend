const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Verify Payment: accessible by Super Admin and Sports Head
// The controller itself adds granular checks for Sports Head vs Assigned Sport
router.post('/verify-payment/:registrationId', protect, authorize('super_admin', 'sports_head'), adminController.verifyPayment);

module.exports = router;
