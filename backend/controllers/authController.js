const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'soil_conservation_super_secret_jwt_key_2026';

async function register(req, res) {
  try {
    const { full_name, email, phone, password, confirm_password, role } = req.body;

    // Validation
    if (!full_name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'All required fields must be provided.' });
    }

    if (confirm_password && password !== confirm_password) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    // Check duplicate email
    const existing = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email address already exists.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = (role === 'admin') ? 'admin' : 'user';

    const result = await db.query(
      'INSERT INTO users (full_name, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
      [full_name.trim(), email.toLowerCase().trim(), phone.trim(), hashedPassword, userRole, 'active']
    );

    const userId = result.insertId;

    // Issue JWT token
    const token = jwt.sign(
      { id: userId, email: email.toLowerCase().trim(), full_name, role: userRole },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: {
        id: userId,
        full_name,
        email: email.toLowerCase().trim(),
        phone,
        role: userRole
      }
    });

  } catch (err) {
    console.error('Registration Error:', err);
    return res.status(500).json({ success: false, message: 'Server error during user registration.' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
    }

    const users = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = users[0];

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ success: false, message: 'Server error during login authentication.' });
  }
}

async function getCurrentUser(req, res) {
  try {
    const users = await db.query('SELECT id, full_name, email, phone, role, status, created_at FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.json({ success: true, user: users[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve current user details.' });
  }
}

async function logout(req, res) {
  return res.json({ success: true, message: 'Logged out successfully.' });
}

module.exports = {
  register,
  login,
  getCurrentUser,
  logout
};
