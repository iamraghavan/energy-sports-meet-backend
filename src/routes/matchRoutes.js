const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Public: View Live Matches
router.get('/live', matchController.getLiveMatches);

// Public: Get All Matches for a Sport
router.get('/sport/:sportId', matchController.getMatchesBySport);

// Protected: Scorer/Admin Create & Update
router.post('/', protect, authorize('super_admin', 'sports_head', 'scorer'), matchController.createMatch);
router.put('/:matchId/score', protect, authorize('super_admin', 'scorer'), matchController.updateScore);

module.exports = router;
