const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const upload = require('../middlewares/uploadMiddleware');
const { protect, authorize, protectStudent } = require('../middlewares/authMiddleware');

// Public Registration
// Public Registration
router.post('/', upload.single('screenshot'), registrationController.registerStudent);

// Protected: View Registrations
// Super Admin & Sports Head can view
// Protected: View Registrations
// Super Admin & Sports Head can view
router.get('/', protect, authorize('super_admin', 'sports_head'), registrationController.getRegistrations);

// Public/Protected: Get Specific Registration Details (for ID Card/Status)
// Uses Query Param ?id=... to handle slashes in registration codes
router.get('/details', registrationController.getRegistrationById);

// Download Ticket PDF (Supports both /:id/ticket and /ticket?id=...)
router.get('/ticket', registrationController.downloadTicket);
router.get('/:id/ticket', registrationController.downloadTicket);

router.get('/checkin', registrationController.downloadCheckIn);
router.get('/:id/checkin', registrationController.downloadCheckIn);

module.exports = router;
