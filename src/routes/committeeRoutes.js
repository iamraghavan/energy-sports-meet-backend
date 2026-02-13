const express = require('express');
const router = express.Router();
const committeeController = require('../controllers/committeeController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(authorize('super_admin', 'committee'));

router.get('/registrations', committeeController.getRegistrations);
router.patch('/checkin/:id', committeeController.updateCheckIn);

module.exports = router;
