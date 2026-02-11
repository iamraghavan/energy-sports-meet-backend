const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// In valid system, add verifyAdmin middleware here
router.post('/verify-payment/:registrationId', adminController.verifyPayment);

module.exports = router;
