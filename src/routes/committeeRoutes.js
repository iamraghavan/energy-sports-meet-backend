const express = require('express');
const router = express.Router();
const committeeController = require('../controllers/committeeController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Only Committee and Admins can check in
router.post('/check-in/:registrationId', protect, authorize('super_admin', 'committee'), committeeController.checkInStudent);

module.exports = router;
