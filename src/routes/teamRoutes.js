const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Public: View Teams
router.get('/', teamController.getAllTeams);
router.get('/sport/:sportId', teamController.getTeamsBySport);
router.get('/:id', teamController.getTeamById);

// Protected: CRUD
// Only Admins/Sports Heads should manage teams manually
router.post('/', protect, authorize('super_admin', 'sports_head'), teamController.createTeam);
router.put('/:id', protect, authorize('super_admin', 'sports_head'), teamController.updateTeam);
router.delete('/:id', protect, authorize('super_admin', 'sports_head'), teamController.deleteTeam);

module.exports = router;
