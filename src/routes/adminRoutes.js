const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Verify Payment: accessible by Super Admin and Sports Head
// The controller now accepts registrationId or registration_code in the BODY
router.post('/verify-payment', protect, authorize('super_admin', 'sports_head'), adminController.verifyPayment);

module.exports = router;
