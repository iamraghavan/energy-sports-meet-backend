const express = require('express');
const router = express.Router();
const scorerController = require('../controllers/scorerController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(authorize('super_admin', 'scorer'));

router.patch('/matches/:matchId/score', scorerController.updateScore);
router.patch('/matches/:matchId/status', scorerController.updateMatchStatus);
router.post('/matches/:matchId/event', scorerController.logMatchEvent);

module.exports = router;
