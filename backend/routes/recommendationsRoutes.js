const express = require('express');
const router = express.Router();
const recommendationsController = require('../controllers/recommendationsController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, recommendationsController.getRecommendations);

module.exports = router;
