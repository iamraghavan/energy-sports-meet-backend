const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const upload = require('../middlewares/uploadMiddleware');

router.post('/', upload.single('screenshot'), registrationController.registerStudent);

module.exports = router;
