const db = require('../config/db');

async function createActivity(req, res) {
  try {
    const userId = req.user.id;
    const { soil_sample_id, activity_type, description, start_date, end_date, status, notes } = req.body;

    if (!activity_type || !description || !start_date) {
      return res.status(400).json({ success: false, message: 'Activity type, description, and start date are required.' });
    }

    const result = await db.query(
      `INSERT INTO conservation_activities (user_id, soil_sample_id, activity_type, description, start_date, end_date, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        parseInt(soil_sample_id) || 1,
        activity_type,
        description,
        start_date,
        end_date || null,
        status || 'Planned',
        notes || ''
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Conservation activity recorded successfully!',
      activity_id: result.insertId
    });

  } catch (err) {
    console.error('Create Conservation Activity Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to record conservation activity.' });
  }
}

async function getActivities(req, res) {
  try {
    const isUser = req.user.role !== 'admin';
    const userId = req.user.id;

    let sql = `
      SELECT 
        c.id, c.user_id, c.soil_sample_id, c.activity_type, c.description,
        c.start_date, c.end_date, c.status, c.notes, c.created_at,
        s.village, s.district, s.soil_type,
        u.full_name as farmer_name
      FROM conservation_activities c
      JOIN soil_samples s ON c.soil_sample_id = s.id
      JOIN users u ON c.user_id = u.id
    `;

    const params = [];
    if (isUser) {
      sql += ` WHERE c.user_id = ?`;
      params.push(userId);
    }

    sql += ` ORDER BY c.start_date DESC, c.id DESC`;

    const activities = await db.query(sql, params);
    return res.json({ success: true, count: activities.length, activities });

  } catch (err) {
    console.error('Get Conservation Activities Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve conservation activities.' });
  }
}

async function updateActivity(req, res) {
  try {
    const { id } = req.params;
    const { activity_type, description, start_date, end_date, status, notes } = req.body;

    const existing = await db.query('SELECT user_id FROM conservation_activities WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Activity record not found.' });
    }

    if (req.user.role !== 'admin' && existing[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }

    await db.query(
      `UPDATE conservation_activities SET activity_type=?, description=?, start_date=?, end_date=?, status=?, notes=?
       WHERE id=?`,
      [activity_type, description, start_date, end_date || null, status, notes || '', id]
    );

    return res.json({ success: true, message: 'Conservation activity updated successfully.' });

  } catch (err) {
    console.error('Update Conservation Activity Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update conservation activity.' });
  }
}

async function deleteActivity(req, res) {
  try {
    const { id } = req.params;

    const existing = await db.query('SELECT user_id FROM conservation_activities WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Activity record not found.' });
    }

    if (req.user.role !== 'admin' && existing[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }

    await db.query('DELETE FROM conservation_activities WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Conservation activity deleted successfully.' });

  } catch (err) {
    console.error('Delete Conservation Activity Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete activity.' });
  }
}

module.exports = {
  createActivity,
  getActivities,
  updateActivity,
  deleteActivity
};
