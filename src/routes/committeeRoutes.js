const express = require('express');
const router = express.Router();
const committeeController = require('../controllers/committeeController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(authorize('super_admin', 'committee'));

// Search & List
router.get('/registrations', committeeController.getRegistrations);

// Check-in Operations
router.patch('/checkin/:id', committeeController.updateCheckIn);
router.get('/registrations/:id/print-pass', committeeController.generatePass);

// Student Profile
router.get('/student/:id', committeeController.getStudentDetails);

module.exports = router;
