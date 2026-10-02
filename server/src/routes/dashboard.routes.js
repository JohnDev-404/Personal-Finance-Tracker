const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { validate } = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { summaryQuerySchema } = require('../validators/dashboard.validator');

const router = express.Router();

router.use(authenticate);

router.get('/summary', validate(summaryQuerySchema, 'query'), dashboardController.summary);

module.exports = router;