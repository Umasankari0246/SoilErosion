const db = require('../config/db');

async function getRecommendations(req, res) {
  try {
    const recommendations = await db.query('SELECT * FROM recommendations ORDER BY priority ASC, id ASC');
    return res.json({ success: true, count: recommendations.length, recommendations });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch recommendations.' });
  }
}

module.exports = {
  getRecommendations
};
