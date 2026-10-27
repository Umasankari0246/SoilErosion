const db = require('../config/db');
const { calculateSoilDegradation } = require('../services/soilAnalysisService');

async function createSoilSample(req, res) {
  try {
    const userId = req.user.id;
    const {
      state, district, village, latitude, longitude,
      soil_type, soil_texture, land_use, crop_type, analysis_date,
      ph, moisture, organic_carbon, nitrogen, phosphorus, potassium,
      electrical_conductivity, salinity, erosion_level
    } = req.body;

    // Validate parameters
    const parsedPh = parseFloat(ph);
    const parsedMoisture = parseFloat(moisture);
    const parsedOc = parseFloat(organic_carbon);

    if (isNaN(parsedPh) || parsedPh < 0 || parsedPh > 14) {
      return res.status(400).json({ success: false, message: 'Invalid pH value. Must be between 0 and 14.' });
    }
    if (isNaN(parsedMoisture) || parsedMoisture < 0 || parsedMoisture > 100) {
      return res.status(400).json({ success: false, message: 'Invalid Moisture percentage. Must be between 0 and 100%.' });
    }
    if (isNaN(parsedOc) || parsedOc < 0 || parsedOc > 20) {
      return res.status(400).json({ success: false, message: 'Invalid Organic Carbon percentage. Must be between 0 and 20%.' });
    }

    // 1. Insert Soil Sample metadata
    const sampleResult = await db.query(
      `INSERT INTO soil_samples (user_id, state, district, village, latitude, longitude, soil_type, soil_texture, land_use, crop_type, analysis_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        state || 'Maharashtra',
        district || 'District Area',
        village || 'Village',
        parseFloat(latitude) || 19.0760,
        parseFloat(longitude) || 72.8777,
        soil_type || 'Alluvial',
        soil_texture || 'Loam',
        land_use || 'Agricultural',
        crop_type || 'General Crop',
        analysis_date || new Date().toISOString().split('T')[0]
      ]
    );

    const soilSampleId = sampleResult.insertId;

    // 2. Insert Soil Parameters
    await db.query(
      `INSERT INTO soil_parameters (soil_sample_id, ph, moisture, organic_carbon, nitrogen, phosphorus, potassium, electrical_conductivity, salinity, erosion_level)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        soilSampleId,
        parsedPh,
        parsedMoisture,
        parsedOc,
        parseFloat(nitrogen) || 200,
        parseFloat(phosphorus) || 15,
        parseFloat(potassium) || 150,
        parseFloat(electrical_conductivity) || 1.0,
        parseFloat(salinity) || 0.5,
        erosion_level || 'Low'
      ]
    );

    // 3. Calculate Soil Degradation Score via Algorithm Service
    const analysis = calculateSoilDegradation({
      ph: parsedPh,
      moisture: parsedMoisture,
      organic_carbon: parsedOc,
      nitrogen: parseFloat(nitrogen) || 200,
      phosphorus: parseFloat(phosphorus) || 15,
      potassium: parseFloat(potassium) || 150,
      electrical_conductivity: parseFloat(electrical_conductivity) || 1.0,
      salinity: parseFloat(salinity) || 0.5,
      erosion_level: erosion_level || 'Low'
    });

    // 4. Save Analysis Result
    await db.query(
      `INSERT INTO degradation_analysis (soil_sample_id, degradation_score, \`condition\`, risk_level, main_factors)
       VALUES (?, ?, ?, ?, ?)`,
      [
        soilSampleId,
        analysis.degradation_score,
        analysis.condition,
        analysis.risk_level,
        analysis.main_factors
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Soil sample recorded and analyzed successfully!',
      soil_sample_id: soilSampleId,
      analysis
    });

  } catch (err) {
    console.error('Create Soil Sample Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process and record soil sample.' });
  }
}

async function getSoilSamples(req, res) {
  try {
    const { district, soil_type, degradation_level, search } = req.query;
    let sql = `
      SELECT 
        s.id, s.user_id, s.state, s.district, s.village, s.latitude, s.longitude,
        s.soil_type, s.soil_texture, s.land_use, s.crop_type, s.analysis_date, s.created_at,
        p.ph, p.moisture, p.organic_carbon, p.nitrogen, p.phosphorus, p.potassium,
        p.electrical_conductivity, p.salinity, p.erosion_level,
        d.degradation_score, d.condition, d.risk_level, d.main_factors,
        u.full_name as farmer_name, u.email as farmer_email
      FROM soil_samples s
      JOIN soil_parameters p ON s.id = p.soil_sample_id
      JOIN degradation_analysis d ON s.id = d.soil_sample_id
      JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;

    const params = [];

    // Filter by user role (admin sees all, regular user sees their own unless viewing public map)
    if (req.user && req.user.role !== 'admin' && !req.query.public_map) {
      sql += ` AND s.user_id = ?`;
      params.push(req.user.id);
    }

    if (district) {
      sql += ` AND s.district LIKE ?`;
      params.push(`%${district}%`);
    }

    if (soil_type) {
      sql += ` AND s.soil_type LIKE ?`;
      params.push(`%${soil_type}%`);
    }

    if (degradation_level) {
      sql += ` AND d.condition LIKE ?`;
      params.push(`%${degradation_level}%`);
    }

    if (search) {
      sql += ` AND (s.district LIKE ? OR s.village LIKE ? OR s.soil_type LIKE ? OR u.full_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY s.analysis_date DESC, s.id DESC`;

    const samples = await db.query(sql, params);
    return res.json({ success: true, count: samples.length, samples });

  } catch (err) {
    console.error('Get Soil Samples Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve soil samples.' });
  }
}

async function getSoilSampleById(req, res) {
  try {
    const { id } = req.params;

    const sql = `
      SELECT 
        s.id, s.user_id, s.state, s.district, s.village, s.latitude, s.longitude,
        s.soil_type, s.soil_texture, s.land_use, s.crop_type, s.analysis_date, s.created_at,
        p.ph, p.moisture, p.organic_carbon, p.nitrogen, p.phosphorus, p.potassium,
        p.electrical_conductivity, p.salinity, p.erosion_level,
        d.degradation_score, d.condition, d.risk_level, d.main_factors,
        u.full_name as farmer_name, u.email as farmer_email, u.phone as farmer_phone
      FROM soil_samples s
      JOIN soil_parameters p ON s.id = p.soil_sample_id
      JOIN degradation_analysis d ON s.id = d.soil_sample_id
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `;

    const rows = await db.query(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Soil sample record not found.' });
    }

    const sample = rows[0];

    // Recalculate dynamic recommendations
    const analysisResult = calculateSoilDegradation({
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

    sample.recommended_actions = analysisResult.recommended_actions;

    return res.json({ success: true, sample });

  } catch (err) {
    console.error('Get Soil Sample By ID Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch soil sample details.' });
  }
}

async function updateSoilSample(req, res) {
  try {
    const { id } = req.params;
    const {
      state, district, village, latitude, longitude,
      soil_type, soil_texture, land_use, crop_type, analysis_date,
      ph, moisture, organic_carbon, nitrogen, phosphorus, potassium,
      electrical_conductivity, salinity, erosion_level
    } = req.body;

    // Check ownership or admin
    const existing = await db.query('SELECT user_id FROM soil_samples WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }

    if (req.user.role !== 'admin' && existing[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }

    // Update metadata
    await db.query(
      `UPDATE soil_samples SET state=?, district=?, village=?, latitude=?, longitude=?, soil_type=?, soil_texture=?, land_use=?, crop_type=?, analysis_date=?
       WHERE id=?`,
      [state, district, village, latitude, longitude, soil_type, soil_texture, land_use, crop_type, analysis_date, id]
    );

    // Update parameters
    const parsedPh = parseFloat(ph);
    const parsedMoisture = parseFloat(moisture);
    const parsedOc = parseFloat(organic_carbon);

    await db.query(
      `UPDATE soil_parameters SET ph=?, moisture=?, organic_carbon=?, nitrogen=?, phosphorus=?, potassium=?, electrical_conductivity=?, salinity=?, erosion_level=?
       WHERE soil_sample_id=?`,
      [parsedPh, parsedMoisture, parsedOc, nitrogen, phosphorus, potassium, electrical_conductivity, salinity, erosion_level, id]
    );

    // Recalculate analysis
    const analysis = calculateSoilDegradation({
      ph: parsedPh,
      moisture: parsedMoisture,
      organic_carbon: parsedOc,
      nitrogen,
      phosphorus,
      potassium,
      electrical_conductivity,
      salinity,
      erosion_level
    });

    await db.query(
      `UPDATE degradation_analysis SET degradation_score=?, \`condition\`=?, risk_level=?, main_factors=?
       WHERE soil_sample_id=?`,
      [analysis.degradation_score, analysis.condition, analysis.risk_level, analysis.main_factors, id]
    );

    return res.json({ success: true, message: 'Soil sample updated and re-analyzed successfully!' });

  } catch (err) {
    console.error('Update Soil Sample Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update soil record.' });
  }
}

async function deleteSoilSample(req, res) {
  try {
    const { id } = req.params;

    const existing = await db.query('SELECT user_id FROM soil_samples WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Soil record not found.' });
    }

    if (req.user.role !== 'admin' && existing[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }

    await db.query('DELETE FROM soil_samples WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Soil sample deleted successfully.' });

  } catch (err) {
    console.error('Delete Soil Sample Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete soil sample.' });
  }
}

module.exports = {
  createSoilSample,
  getSoilSamples,
  getSoilSampleById,
  updateSoilSample,
  deleteSoilSample
};
