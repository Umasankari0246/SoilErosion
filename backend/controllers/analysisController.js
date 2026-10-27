const db = require('../config/db');
const { calculateSoilDegradation } = require('../services/soilAnalysisService');

async function analyzeOnTheFly(req, res) {
  try {
    const analysis = calculateSoilDegradation(req.body);
    return res.json({ success: true, analysis });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Analysis calculation failed.' });
  }
}

async function getAnalysisBySoilId(req, res) {
  try {
    const { soilId } = req.params;
    const rows = await db.query(
      `SELECT d.*, s.soil_type, s.district, s.village 
       FROM degradation_analysis d
       JOIN soil_samples s ON d.soil_sample_id = s.id
       WHERE d.soil_sample_id = ?`,
      [soilId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Analysis not found.' });
    }

    return res.json({ success: true, analysis: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve analysis.' });
  }
}

module.exports = {
  analyzeOnTheFly,
  getAnalysisBySoilId
};
