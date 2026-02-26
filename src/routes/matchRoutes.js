const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Public: View Live Matches
router.get('/live', matchController.getLiveMatches);

// Public: Get All Matches for a Sport
router.get('/sport/:sportId', matchController.getMatchesBySport);

// Public: Get Specific Match Details
router.get('/:matchId', matchController.getMatchById);

// Protected: Scorer/Admin CRUD
router.post('/', protect, authorize('super_admin', 'sports_head', 'scorer'), matchController.createMatch);
router.put('/:matchId', protect, authorize('super_admin', 'sports_head', 'scorer'), matchController.updateMatchDetails); // Edit Time/Teams
router.delete('/:matchId', protect, authorize('super_admin', 'scorer'), matchController.deleteMatch); // Delete Match

// Score Updates (Emit Sockets)
router.put('/:matchId/score', protect, authorize('super_admin', 'scorer'), matchController.updateScore);

// Lineup Management
router.get('/:matchId/lineup', matchController.getMatchLineup);
router.post('/:matchId/lineup', protect, authorize('super_admin', 'scorer'), matchController.updateLineup);

// Dynamic Match Events (Ball-by-ball, Goal logs)
// Payload: { event_type: 'run', value: 4, key: 'runs', team_id: '...', player_id: '...' }
router.post('/:matchId/event', protect, authorize('super_admin', 'scorer'), matchController.updateMatchEvent);

// Match State (Striker, Bowler, etc.)
router.post('/:matchId/state', protect, authorize('super_admin', 'scorer'), matchController.updateMatchState);

// Toss Result
router.post('/:matchId/toss', protect, authorize('super_admin', 'scorer'), matchController.updateToss);

module.exports = router;
