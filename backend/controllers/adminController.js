const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function getUsers(req, res) {
  try {
    const { search, role, status } = req.query;
    let sql = 'SELECT id, full_name, email, phone, role, status, created_at FROM users WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (role) {
      sql += ' AND role = ?';
      params.push(role);
    }

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY id DESC';

    const users = await db.query(sql, params);
    return res.json({ success: true, count: users.length, users });
  } catch (err) {
    console.error('Admin Get Users Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch users list.' });
  }
}

async function createUser(req, res) {
  try {
    const { full_name, email, phone, password, role, status } = req.body;
    if (!full_name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Full name, email, and password are required.' });
    }

    const existing = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email address already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (full_name, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
      [full_name, email.toLowerCase().trim(), phone || '', hashedPassword, role || 'user', status || 'active']
    );

    return res.status(201).json({ success: true, message: 'User created successfully.', user_id: result.insertId });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create user.' });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { full_name, email, phone, role, status, password } = req.body;

    const existing = await db.query('SELECT id FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let sql = 'UPDATE users SET full_name=?, email=?, phone=?, role=?, status=?';
    const params = [full_name, email.toLowerCase().trim(), phone, role, status];

    if (password && password.trim().length >= 6) {
      const hashedPassword = await bcrypt.hash(password, 10);
      sql += ', password=?';
      params.push(hashedPassword);
    }

    sql += ' WHERE id=?';
    params.push(id);

    await db.query(sql, params);
    return res.json({ success: true, message: 'User updated successfully.' });
  } catch (err) {
    console.error('Admin Update User Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own active admin account.' });
    }

    await db.query('DELETE FROM users WHERE id = ?', [id]);
    return res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete user.' });
  }
}

async function getAdminStats(req, res) {
  try {
    const totalUsers = (await db.query('SELECT COUNT(*) as c FROM users'))[0].c;
    const totalSamples = (await db.query('SELECT COUNT(*) as c FROM soil_samples'))[0].c;
    const totalActivities = (await db.query('SELECT COUNT(*) as c FROM conservation_activities'))[0].c;

    const healthyCount = (await db.query("SELECT COUNT(*) as c FROM degradation_analysis WHERE `condition` LIKE '%Healthy%'"))[0].c;
    const degradedCount = totalSamples - healthyCount;

    return res.json({
      success: true,
      stats: {
        total_users: totalUsers,
        total_samples: totalSamples,
        total_activities: totalActivities,
        healthy_samples: healthyCount,
        degraded_samples: degradedCount
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load admin stats.' });
  }
}

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getAdminStats
};
