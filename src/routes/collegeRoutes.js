const express = require('express');
const router = express.Router();
const collegeController = require('../controllers/collegeController');

router.post('/', collegeController.createCollege);
router.get('/', collegeController.getAllColleges);

module.exports = router;
