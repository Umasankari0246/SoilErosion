const express = require('express');
const router = express.Router();
const soilController = require('../controllers/soilController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, soilController.createSoilSample);
router.get('/', authenticateToken, soilController.getSoilSamples);
router.get('/:id', authenticateToken, soilController.getSoilSampleById);
router.put('/:id', authenticateToken, soilController.updateSoilSample);
router.delete('/:id', authenticateToken, soilController.deleteSoilSample);

module.exports = router;
