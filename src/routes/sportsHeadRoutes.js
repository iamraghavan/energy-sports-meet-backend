const express = require('express');
const router = express.Router();
const sportsHeadController = require('../controllers/sportsHeadController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(authorize('super_admin', 'sports_head'));

const matchController = require('../controllers/matchController');

// Overview Stats
router.get('/stats', sportsHeadController.getOverviewStats);
router.get('/analytics', sportsHeadController.getAnalytics);

// Match Routes (Shared Logic with Emails/Sockets)
router.get('/matches', sportsHeadController.getMatches);
router.post('/matches/schedule', matchController.createMatch);
router.patch('/matches/:matchId', matchController.updateMatchDetails);

// Team Routes
router.get('/teams', sportsHeadController.getSportTeams);
router.post('/teams', sportsHeadController.createTeam);
router.get('/teams/:id', sportsHeadController.getTeamDetails);
router.put('/teams/:id', sportsHeadController.updateTeam);
router.delete('/teams/:id', sportsHeadController.deleteTeam);

// Student/Player Routes
router.get('/students', sportsHeadController.getAllStudents);
router.post('/teams/:teamId/players/:studentId', sportsHeadController.addPlayerToTeam);
router.delete('/teams/:teamId/players/:studentId', sportsHeadController.removePlayerFromTeam);

// Registration View
router.get('/registrations', sportsHeadController.getRegistrations);

module.exports = router;
