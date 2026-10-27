const db = require('../config/db');
const { generateSoilReportPDF, generateMySQLCodePDF } = require('../services/pdfReportService');
const { calculateSoilDegradation } = require('../services/soilAnalysisService');
const path = require('path');
const fs = require('fs');

async function downloadSoilPDFReport(req, res) {
  try {
    const { soilId } = req.params;
    const sql = `
      SELECT 
        s.id, s.state, s.district, s.village, s.soil_type, s.soil_texture, s.land_use, s.crop_type, s.analysis_date,
        p.ph, p.moisture, p.organic_carbon, p.nitrogen, p.phosphorus, p.potassium, p.electrical_conductivity, p.salinity, p.erosion_level,
        d.degradation_score, d.condition, d.risk_level, d.main_factors,
        u.full_name as farmer_name, u.email as farmer_email
      FROM soil_samples s
      JOIN soil_parameters p ON s.id = p.soil_sample_id
      JOIN degradation_analysis d ON s.id = d.soil_sample_id
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `;

    const rows = await db.query(sql, [soilId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Soil record not found.' });
    }

    const sample = rows[0];
    const recAnalysis = calculateSoilDegradation({
      ph: sample.ph,
      moisture: sample.moisture,
      organic_carbon: sample.organic_carbon,
      nitrogen: sample.nitrogen,
      phosphorus: sample.phosphorus,
      potassium: sample.potassium,
      electrical_conductivity: sample.electrical_conductivity,
      salinity: sample.salinity,
      erosion_level: sample.erosion_level
    });

    sample.recommended_actions = recAnalysis.recommended_actions;

    generateSoilReportPDF(sample, res);

  } catch (err) {
    console.error('Download Soil Report PDF Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate PDF report.' });
  }
}

async function downloadMySQLCodePDF(req, res) {
  try {
    const pdfPath = path.join(__dirname, '../../Soil_Conservation_MySQL_Code.pdf');

    // Generate if not existing or outdated
    await generateMySQLCodePDF(pdfPath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Soil_Conservation_MySQL_Code.pdf');
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);

  } catch (err) {
    console.error('Download MySQL PDF Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate MySQL code PDF.' });
  }
}

module.exports = {
  downloadSoilPDFReport,
  downloadMySQLCodePDF
};
