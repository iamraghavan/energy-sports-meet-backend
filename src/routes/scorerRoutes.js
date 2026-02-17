const express = require('express');
const router = express.Router();
const scorerController = require('../controllers/scorerController');
const matchController = require('../controllers/matchController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(authorize('super_admin', 'scorer'));

// --- Match Management (CRUD) ---
router.post('/matches', matchController.createMatch);
router.get('/matches/:matchId', matchController.getMatchById); // View details
router.put('/matches/:matchId', matchController.updateMatchDetails); // Update time/venue/referee
router.delete('/matches/:matchId', matchController.deleteMatch);

// --- Lineup Management ---
router.get('/matches/:matchId/lineup', matchController.getMatchLineup);
router.post('/matches/:matchId/lineup', matchController.updateLineup); // Add/Remove Player

// --- Live Scoring & Status ---
router.post('/matches/:matchId/start', (req, res, next) => {
    req.body.status = 'live';
    matchController.updateScore(req, res, next);
});

router.put('/matches/:matchId/score', matchController.updateScore);

router.post('/matches/:matchId/end', (req, res, next) => {
    req.body.status = 'completed';
    matchController.updateScore(req, res, next);
});

// --- Dynamic Events (Ball-by-ball, Goals) ---
router.post('/matches/:matchId/event', matchController.updateMatchEvent);

module.exports = router;
