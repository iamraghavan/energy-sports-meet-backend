const express = require('express');
const router = express.Router();
const sportsHeadController = require('../controllers/sportsHeadController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(authorize('super_admin', 'sports_head'));

router.post('/matches/schedule', sportsHeadController.scheduleMatch);
router.get('/teams', sportsHeadController.getSportTeams);
router.post('/teams/:teamId/players/:studentId', sportsHeadController.addPlayerToTeam);

module.exports = router;
