const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/studentDashboardController');
const { protectStudent } = require('../middlewares/authMiddleware');

// All routes here require student authentication (via Registration record)
router.use(protectStudent);

router.get('/', dashboardController.getDashboard);

// Team Management
router.post('/teams', dashboardController.createTeam);
router.put('/teams/:teamId', dashboardController.updateTeam);
router.delete('/teams/:teamId', dashboardController.deleteTeam);
router.post('/teams/:teamId/members', dashboardController.addTeamMember);

// Member Management
router.post('/teams/:teamId/members/bulk', dashboardController.bulkAddTeamMembers);
router.put('/members/bulk', dashboardController.bulkUpdateTeamMembers);
router.delete('/members/bulk', dashboardController.bulkDeleteTeamMembers);
router.put('/members/:memberId', dashboardController.updateTeamMember);
router.patch('/members/:memberId', dashboardController.updateTeamMember);
router.delete('/members/:memberId', dashboardController.deleteTeamMember);

module.exports = router;
