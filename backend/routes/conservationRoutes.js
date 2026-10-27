const express = require('express');
const router = express.Router();
const conservationController = require('../controllers/conservationController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, conservationController.createActivity);
router.get('/', authenticateToken, conservationController.getActivities);
router.put('/:id', authenticateToken, conservationController.updateActivity);
router.delete('/:id', authenticateToken, conservationController.deleteActivity);

module.exports = router;
