const express = require('express');
const router = express.Router();
const sportController = require('../controllers/sportController');

router.post('/', sportController.createSport);
router.get('/', sportController.getAllSports);

module.exports = router;
