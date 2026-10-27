const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let pool = null;
let sqliteDb = null;
let useSQLite = false;

// Unified database query wrapper supporting parameterized queries
async function query(sql, params = []) {
  if (!useSQLite && pool) {
    try {
      const [rows] = await pool.execute(sql, params);
      return rows;
    } catch (err) {
      console.warn('MySQL Query Error, retrying or falling back:', err.message);
      throw err;
    }
  } else if (sqliteDb) {
    return new Promise((resolve, reject) => {
      // Normalize MySQL parameters and syntax if needed for SQLite
      let normalizedSql = sql
        .replace(/ENGINE=InnoDB/gi, '')
        .replace(/DEFAULT CHARSET=\w+/gi, '')
        .replace(/COLLATE=\w+/gi, '')
        .replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT')
        .replace(/ENUM\([^)]+\)/gi, 'TEXT')
        .replace(/`condition`/g, 'condition');

      // Detect SELECT vs INSERT/UPDATE/DELETE
      const trimSql = normalizedSql.trim().toUpperCase();
      if (trimSql.startsWith('SELECT') || trimSql.startsWith('PRAGMA')) {
        sqliteDb.all(normalizedSql, params, (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        });
      } else {
        sqliteDb.run(normalizedSql, params, function (err) {
          if (err) return reject(err);
          resolve({ insertId: this.lastID, affectedRows: this.changes });
        });
      }
    });
  } else {
    throw new Error('Database not initialized');
  }
}

async function initDB() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'soil_conservation_db';
  const port = parseInt(process.env.DB_PORT || '3306');

  console.log(`[DB] Attempting MySQL connection to ${host}:${port} (${database})...`);

  try {
    // Attempt MySQL connection pool
    const tempPool = mysql.createPool({
      host,
      user,
      password,
      database,
      port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    const connection = await tempPool.getConnection();
    console.log('✅ [DB] Successfully connected to MySQL database!');
    connection.release();
    pool = tempPool;
    useSQLite = false;
    return;
  } catch (mysqlErr) {
    console.warn(`⚠️ [DB] MySQL connection failed (${mysqlErr.message}). Switching to embedded local database mode for instant seamless testing...`);
    
    // SQLite Fallback setup
    const dbDir = path.join(__dirname, '../../database');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    const dbPath = path.join(dbDir, 'soil_conservation_local.sqlite');

    sqliteDb = new sqlite3.Database(dbPath);
    useSQLite = true;

    // Initialize tables in SQLite if brand new
    await initSQLiteSchema();
    console.log('✅ [DB] Embedded local database ready!');
  }
}

async function initSQLiteSchema() {
  const bcrypt = require('bcryptjs');
  const defaultHash = await bcrypt.hash('password123', 10);

  const createTablesSql = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      status TEXT NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS soil_samples (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      state TEXT NOT NULL,
      district TEXT NOT NULL,
      village TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      soil_type TEXT NOT NULL,
      soil_texture TEXT NOT NULL,
      land_use TEXT NOT NULL,
      crop_type TEXT NOT NULL,
      analysis_date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );`,

    `CREATE TABLE IF NOT EXISTS soil_parameters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      soil_sample_id INTEGER NOT NULL UNIQUE,
      ph REAL NOT NULL,
      moisture REAL NOT NULL,
      organic_carbon REAL NOT NULL,
      nitrogen REAL NOT NULL,
      phosphorus REAL NOT NULL,
      potassium REAL NOT NULL,
      electrical_conductivity REAL NOT NULL,
      salinity REAL NOT NULL,
      erosion_level TEXT NOT NULL DEFAULT 'Low',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (soil_sample_id) REFERENCES soil_samples(id) ON DELETE CASCADE
    );`,

    `CREATE TABLE IF NOT EXISTS degradation_analysis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      soil_sample_id INTEGER NOT NULL UNIQUE,
      degradation_score REAL NOT NULL,
      condition TEXT NOT NULL,
      risk_level TEXT NOT NULL,
      main_factors TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (soil_sample_id) REFERENCES soil_samples(id) ON DELETE CASCADE
    );`,

    `CREATE TABLE IF NOT EXISTS recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      factor TEXT NOT NULL,
      recommendation TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'Medium',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS conservation_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      soil_sample_id INTEGER NOT NULL,
      activity_type TEXT NOT NULL,
      description TEXT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE,
      status TEXT NOT NULL DEFAULT 'Planned',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (soil_sample_id) REFERENCES soil_samples(id) ON DELETE CASCADE
    );`
  ];

  for (const sql of createTablesSql) {
    await query(sql);
  }

  // Seed sample data if users table is empty
  const userCount = await query('SELECT COUNT(*) as count FROM users');
  if (userCount && userCount[0] && userCount[0].count === 0) {
    console.log('[DB] Seeding sample data into embedded local database...');
    
    // Insert Users
    await query(`INSERT INTO users (id, full_name, email, phone, password, role, status) VALUES 
      (1, 'Dr. Ramesh Kumar', 'admin@soilcare.org', '+91 9876543210', ?, 'admin', 'active'),
      (2, 'Suresh Patel', 'suresh.patel@gmail.com', '+91 9812345678', ?, 'user', 'active'),
      (3, 'Anita Sharma', 'anita.sharma@yahoo.com', '+91 9723456789', ?, 'user', 'active'),
      (4, 'Rajesh Singh', 'rajesh.singh@outlook.com', '+91 9634567890', ?, 'user', 'active')`, 
      [defaultHash, defaultHash, defaultHash, defaultHash]
    );

    // Insert Soil Samples
    await query(`INSERT INTO soil_samples (id, user_id, state, district, village, latitude, longitude, soil_type, soil_texture, land_use, crop_type, analysis_date) VALUES
      (1, 2, 'Maharashtra', 'Nashik', 'Ozar', 20.0984, 73.9185, 'Black Cotton Soil', 'Clay Loam', 'Agricultural', 'Grapevine', '2026-08-15'),
      (2, 2, 'Maharashtra', 'Pune', 'Baramati', 18.1517, 74.5771, 'Alluvial Soil', 'Silty Clay', 'Agricultural', 'Sugarcane', '2026-08-20'),
      (3, 3, 'Punjab', 'Ludhiana', 'Jagraon', 30.7850, 75.4740, 'Alluvial Soil', 'Sandy Loam', 'Agricultural', 'Wheat', '2026-08-25'),
      (4, 3, 'Punjab', 'Bhatinda', 'Talwandi', 30.2110, 74.9450, 'Arid/Sandy Soil', 'Sandy', 'Agricultural', 'Cotton', '2026-09-01'),
      (5, 4, 'Karnataka', 'Mandya', 'Pandavapura', 12.5020, 76.6710, 'Red Soil', 'Loamy Sand', 'Agricultural', 'Paddy', '2026-09-05'),
      (6, 4, 'Gujarat', 'Kutch', 'Bhuj', 23.2420, 69.6660, 'Saline/Marshy Soil', 'Clay', 'Fallow', 'None', '2026-09-10')`
    );

    // Insert Soil Parameters
    await query(`INSERT INTO soil_parameters (id, soil_sample_id, ph, moisture, organic_carbon, nitrogen, phosphorus, potassium, electrical_conductivity, salinity, erosion_level) VALUES
      (1, 1, 6.80, 24.50, 0.85, 240.00, 18.50, 210.00, 1.10, 0.40, 'Low'),
      (2, 2, 8.20, 14.00, 0.35, 110.00, 8.20, 120.00, 3.40, 2.80, 'Moderate'),
      (3, 3, 7.10, 28.00, 0.92, 280.00, 22.00, 250.00, 0.95, 0.20, 'Low'),
      (4, 4, 8.60, 9.50, 0.22, 85.00, 6.50, 95.00, 4.80, 4.20, 'High'),
      (5, 5, 5.40, 18.00, 0.45, 150.00, 11.00, 160.00, 1.80, 0.80, 'Moderate'),
      (6, 6, 8.90, 6.00, 0.15, 60.00, 4.00, 70.00, 7.50, 8.50, 'Severe')`
    );

    // Insert Degradation Analyses
    await query(`INSERT INTO degradation_analysis (id, soil_sample_id, degradation_score, condition, risk_level, main_factors) VALUES
      (1, 1, 18.50, 'Healthy', 'Low', 'None. Parameters are within sustainable agronomic limits.'),
      (2, 2, 54.00, 'Moderate Degradation', 'Medium', 'Alkaline pH, Low Organic Carbon, High Salinity, Nitrogen Deficiency'),
      (3, 3, 14.00, 'Healthy', 'Low', 'Optimal organic carbon and balanced NPK balance.'),
      (4, 4, 76.50, 'High Degradation', 'High', 'Severe Alkalinity, Low Organic Carbon, Low Soil Moisture, High Salinity, High Soil Erosion'),
      (5, 5, 48.00, 'Moderate Degradation', 'Medium', 'Soil Acidity (Low pH), Moderate Organic Carbon Deficit, Moderate Soil Erosion'),
      (6, 6, 92.00, 'Severe Degradation', 'Critical', 'Extreme Salinity, Severe Soil Erosion, Acute Organic Carbon Depletion, Critical Moisture Deficit')`
    );

    // Insert Recommendations
    await query(`INSERT INTO recommendations (id, factor, recommendation, priority) VALUES
      (1, 'Soil Erosion', 'Implement contour bunding, vegetative barriers (Vetiver grass), terracing, and continuous cover cropping to minimize topsoil runoff.', 'High'),
      (2, 'Low Organic Carbon', 'Apply well-decomposed farmyard manure (10-15 t/ha), compost, green manure (Dhaincha/Sunnhemp), and practice minimum tillage.', 'High'),
      (3, 'High Salinity', 'Improve sub-surface field drainage, apply agricultural gypsum (CaSO4.2H2O), practice leaching with good quality water, and cultivate salt-tolerant crops.', 'High'),
      (4, 'Low Moisture', 'Adopt organic mulching (crop residue 5 t/ha), drip irrigation, rainwater harvesting ponds, and soil hydrogel application to enhance water retention.', 'Medium'),
      (5, 'Nutrient Deficiency', 'Apply soil-test-based bio-fertilizers (Azotobacter, PSB), balanced NPK formulations, and micronutrient foliar sprays (Zinc, Iron).', 'Medium'),
      (6, 'Acidic Soil (Low pH)', 'Incorporate agricultural lime (CaCO3) or dolomite at recommended rates during field preparation to neutralize excess acidity.', 'Medium'),
      (7, 'Alkaline Soil (High pH)', 'Apply elemental sulfur, iron sulfate, or organic compost enriched with elemental sulfur to gradually lower soil pH to neutral range.', 'Medium')`
    );

    // Insert Conservation Activities
    await query(`INSERT INTO conservation_activities (id, user_id, soil_sample_id, activity_type, description, start_date, end_date, status, notes) VALUES
      (1, 2, 2, 'Compost Application & Gypsum Treatment', 'Applied 5 tonnes of organic compost mixed with agricultural gypsum to reduce soil salinity and improve structure.', '2026-08-22', '2026-09-05', 'Completed', 'Significant moisture retention improvement noted after 2 weeks.'),
      (2, 3, 4, 'Cover Cropping & Vetiver Barrier', 'Planted Leguminous cover crops (Cowpea) and established Vetiver grass lines along contour slope.', '2026-09-02', '2026-10-15', 'In Progress', 'Vegetative growth starting to anchor topsoil.'),
      (3, 4, 5, 'Lime Application & Mulching', 'Broadcasted agricultural lime at 2 t/ha to correct low pH and applied paddy straw mulching.', '2026-09-06', NULL, 'Planned', 'Scheduled to start right after monsoon showers.')`
    );
  }
}

module.exports = {
  query,
  initDB,
  isSQLite: () => useSQLite
};
