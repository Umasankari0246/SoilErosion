const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDB } = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const soilRoutes = require('./routes/soilRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const recommendationsRoutes = require('./routes/recommendationsRoutes');
const conservationRoutes = require('./routes/conservationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportsRoutes = require('./routes/reportsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/soil', soilRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/conservation', conservationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportsRoutes);

// Catch-all for single-page style navigation if needed
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  } else {
    res.status(404).json({ success: false, message: 'API Endpoint Not Found' });
  }
});

// Initialize Database & Start Server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`=================================================================`);
    console.log(`🚀 Soil Conservation Backend Server running on http://localhost:${PORT}`);
    console.log(`=================================================================`);
  });
}).catch(err => {
  console.error('Fatal Database Initialization Error:', err);
});
