const express = require('express');
const router = express.Router();
const scorerController = require('../controllers/scorerController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(authorize('super_admin', 'scorer'));

const matchController = require('../controllers/matchController');

// Match & Score Management (Uses shared MatchController for Sockets/Emails)
router.post('/matches/:matchId/start', (req, res, next) => {
    req.body.status = 'live'; // Enforce status change
    matchController.updateScore(req, res, next);
});

router.patch('/matches/:matchId/score', matchController.updateScore);

router.post('/matches/:matchId/event', matchController.updateMatchEvent);

router.post('/matches/:matchId/end', (req, res, next) => {
    req.body.status = 'completed'; // Enforce status change
    matchController.updateScore(req, res, next);
});

module.exports = router;
