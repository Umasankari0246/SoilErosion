const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/pdf/:soilId', authenticateToken, reportsController.downloadSoilPDFReport);
router.get('/mysql-pdf', reportsController.downloadMySQLCodePDF);

module.exports = router;
