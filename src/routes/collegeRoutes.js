const express = require('express');
const router = express.Router();
const collegeController = require('../controllers/collegeController');

router.post('/', collegeController.createCollege);
router.post('/bulk', collegeController.bulkCreateColleges);
router.get('/', collegeController.getAllColleges);

module.exports = router;
