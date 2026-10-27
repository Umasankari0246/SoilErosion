const db = require('../config/db');

async function getDashboardStats(req, res) {
  try {
    const isUserRole = req.user.role !== 'admin';
    const userId = req.user.id;

    let userFilter = isUserRole ? `WHERE s.user_id = ${userId}` : '';
    let actFilter = isUserRole ? `WHERE c.user_id = ${userId}` : '';

    // Summary Counts
    const samplesCount = await db.query(`SELECT COUNT(*) as count FROM soil_samples s ${userFilter}`);
    const totalSamples = samplesCount[0] ? samplesCount[0].count : 0;

    const conditionCounts = await db.query(`
      SELECT d.condition, COUNT(*) as count 
      FROM degradation_analysis d
      JOIN soil_samples s ON d.soil_sample_id = s.id
      ${userFilter}
      GROUP BY d.condition
    `);

    let healthyCount = 0;
    let lowDegCount = 0;
    let moderateDegCount = 0;
    let highDegCount = 0;
    let severeDegCount = 0;

    conditionCounts.forEach(row => {
      const cond = row.condition.toLowerCase();
      if (cond.includes('healthy')) healthyCount += row.count;
      else if (cond.includes('low')) lowDegCount += row.count;
      else if (cond.includes('moderate')) moderateDegCount += row.count;
      else if (cond.includes('high')) highDegCount += row.count;
      else if (cond.includes('severe')) severeDegCount += row.count;
    });

    const activitiesCount = await db.query(`SELECT COUNT(*) as count FROM conservation_activities c ${actFilter}`);
    const totalActivities = activitiesCount[0] ? activitiesCount[0].count : 0;

    // Recent 5 Analyses Table Data
    const recentAnalyses = await db.query(`
      SELECT 
        s.id, s.district, s.village, s.soil_type, s.analysis_date,
        p.ph, p.organic_carbon, p.moisture,
        d.degradation_score, d.condition, d.risk_level
      FROM soil_samples s
      JOIN soil_parameters p ON s.id = p.soil_sample_id
      JOIN degradation_analysis d ON s.id = d.soil_sample_id
      ${userFilter}
      ORDER BY s.analysis_date DESC, s.id DESC
      LIMIT 5
    `);

    return res.json({
      success: true,
      stats: {
        total_samples: totalSamples,
        healthy_count: healthyCount,
        low_deg_count: lowDegCount,
        moderate_deg_count: moderateDegCount,
        high_deg_count: highDegCount,
        severe_deg_count: severeDegCount,
        total_activities: totalActivities
      },
      recent_analyses: recentAnalyses
    });

  } catch (err) {
    console.error('Get Dashboard Stats Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load dashboard statistics.' });
  }
}

async function getDashboardTrends(req, res) {
  try {
    const isUserRole = req.user.role !== 'admin';
    const userId = req.user.id;
    let userFilter = isUserRole ? `WHERE s.user_id = ${userId}` : '';

    // 1. Condition Distribution
    const conditionDist = await db.query(`
      SELECT d.condition, COUNT(*) as count 
      FROM degradation_analysis d
      JOIN soil_samples s ON d.soil_sample_id = s.id
      ${userFilter}
      GROUP BY d.condition
    `);

    // 2. District-wise Degradation
    const districtDegradation = await db.query(`
      SELECT s.district, ROUND(AVG(d.degradation_score), 2) as avg_score, COUNT(s.id) as sample_count
      FROM soil_samples s
      JOIN degradation_analysis d ON s.id = d.soil_sample_id
      ${userFilter}
      GROUP BY s.district
      ORDER BY avg_score DESC
      LIMIT 10
    `);

    // 3. Degradation Score Trend Over Time
    const timeTrend = await db.query(`
      SELECT s.analysis_date, ROUND(AVG(d.degradation_score), 2) as avg_score
      FROM soil_samples s
      JOIN degradation_analysis d ON s.id = d.soil_sample_id
      ${userFilter}
      GROUP BY s.analysis_date
      ORDER BY s.analysis_date ASC
      LIMIT 15
    `);

    // 4. Soil pH Distribution
    const phStats = await db.query(`
      SELECT 
        SUM(CASE WHEN p.ph < 6.0 THEN 1 ELSE 0 END) as acidic,
        SUM(CASE WHEN p.ph BETWEEN 6.0 AND 7.5 THEN 1 ELSE 0 END) as optimal,
        SUM(CASE WHEN p.ph > 7.5 THEN 1 ELSE 0 END) as alkaline
      FROM soil_parameters p
      JOIN soil_samples s ON p.soil_sample_id = s.id
      ${userFilter}
    `);

    // 5. Organic Carbon Distribution
    const ocStats = await db.query(`
      SELECT 
        SUM(CASE WHEN p.organic_carbon < 0.5 THEN 1 ELSE 0 END) as low,
        SUM(CASE WHEN p.organic_carbon BETWEEN 0.5 AND 0.99 THEN 1 ELSE 0 END) as moderate,
        SUM(CASE WHEN p.organic_carbon >= 1.0 THEN 1 ELSE 0 END) as healthy
      FROM soil_parameters p
      JOIN soil_samples s ON p.soil_sample_id = s.id
      ${userFilter}
    `);

    // 6. Nutrient Averages (N, P, K)
    const nutrientAvgs = await db.query(`
      SELECT 
        ROUND(AVG(p.nitrogen), 2) as avg_n,
        ROUND(AVG(p.phosphorus), 2) as avg_p,
        ROUND(AVG(p.potassium), 2) as avg_k
      FROM soil_parameters p
      JOIN soil_samples s ON p.soil_sample_id = s.id
      ${userFilter}
    `);

    return res.json({
      success: true,
      condition_distribution: conditionDist,
      district_degradation: districtDegradation,
      time_trend: timeTrend,
      ph_stats: phStats[0] || { acidic: 0, optimal: 0, alkaline: 0 },
      oc_stats: ocStats[0] || { low: 0, moderate: 0, healthy: 0 },
      nutrient_averages: nutrientAvgs[0] || { avg_n: 0, avg_p: 0, avg_k: 0 }
    });

  } catch (err) {
    console.error('Get Dashboard Trends Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load chart trend data.' });
  }
}

module.exports = {
  getDashboardStats,
  getDashboardTrends
};
