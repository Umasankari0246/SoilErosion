const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const soilController = require('../controllers/soilController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.use(authenticateToken, requireAdmin);

router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

router.get('/soil', soilController.getSoilSamples);
router.get('/stats', adminController.getAdminStats);

module.exports = router;
