const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middlewares/authMiddleware');

// Protect all routes (User Authentication: Admin, Committee, SH, Scorer)
router.use(protect);

router.get('/stats', dashboardController.getDashboardStats);

module.exports = router;
