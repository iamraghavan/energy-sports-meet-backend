const express = require('express');
const router = express.Router();
const scorerController = require('../controllers/scorerController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(authorize('super_admin', 'scorer'));

router.post('/matches/:matchId/start', scorerController.updateMatchStatus);
router.patch('/matches/:matchId/score', scorerController.updateScore);
router.post('/matches/:matchId/event', scorerController.logMatchEvent);
router.post('/matches/:matchId/end', scorerController.updateMatchStatus);

module.exports = router;
