const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, analysisController.analyzeOnTheFly);
router.get('/:soilId', authenticateToken, analysisController.getAnalysisBySoilId);

module.exports = router;
