-- ============================================================================
-- Database Creation Script
-- Project: A Smart System for Soil Degradation Analysis and Sustainable Land Conservation
-- Compatible with MySQL Workbench 8.0+
-- ============================================================================

CREATE DATABASE IF NOT EXISTS soil_conservation_db;
USE soil_conservation_db;

-- ----------------------------------------------------------------------------
-- 1. Table: users
-- Stores registered system users including general farmers/researchers and admins.
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS conservation_activities;
DROP TABLE IF EXISTS degradation_analysis;
DROP TABLE IF EXISTS soil_parameters;
DROP TABLE IF EXISTS soil_samples;
DROP TABLE IF EXISTS recommendations;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. Table: soil_samples
-- Stores soil sample metadata, geographical location, and land usage profile.
-- ----------------------------------------------------------------------------
CREATE TABLE soil_samples (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    state VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    village VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    soil_type VARCHAR(50) NOT NULL,
    soil_texture VARCHAR(50) NOT NULL,
    land_use VARCHAR(50) NOT NULL,
    crop_type VARCHAR(50) NOT NULL,
    analysis_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_soil_location (state, district),
    INDEX idx_soil_user (user_id),
    INDEX idx_analysis_date (analysis_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. Table: soil_parameters
-- Stores chemical, physical, and nutrient test values for a soil sample.
-- Includes CHECK constraints for valid scientific ranges.
-- ----------------------------------------------------------------------------
CREATE TABLE soil_parameters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    soil_sample_id INT NOT NULL UNIQUE,
    ph DECIMAL(4, 2) NOT NULL CHECK (ph BETWEEN 0.00 AND 14.00),
    moisture DECIMAL(5, 2) NOT NULL CHECK (moisture BETWEEN 0.00 AND 100.00),
    organic_carbon DECIMAL(4, 2) NOT NULL CHECK (organic_carbon BETWEEN 0.00 AND 20.00),
    nitrogen DECIMAL(6, 2) NOT NULL CHECK (nitrogen >= 0.00),
    phosphorus DECIMAL(6, 2) NOT NULL CHECK (phosphorus >= 0.00),
    potassium DECIMAL(6, 2) NOT NULL CHECK (potassium >= 0.00),
    electrical_conductivity DECIMAL(6, 2) NOT NULL CHECK (electrical_conductivity >= 0.00),
    salinity DECIMAL(5, 2) NOT NULL CHECK (salinity BETWEEN 0.00 AND 50.00),
    erosion_level ENUM('Low', 'Moderate', 'High', 'Severe') NOT NULL DEFAULT 'Low',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (soil_sample_id) REFERENCES soil_samples(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. Table: degradation_analysis
-- Stores the calculated degradation score, condition, risk, and key factors.
-- ----------------------------------------------------------------------------
CREATE TABLE degradation_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    soil_sample_id INT NOT NULL UNIQUE,
    degradation_score DECIMAL(5, 2) NOT NULL CHECK (degradation_score BETWEEN 0.00 AND 100.00),
    `condition` VARCHAR(50) NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    main_factors TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (soil_sample_id) REFERENCES soil_samples(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_degradation_score (degradation_score),
    INDEX idx_condition (`condition`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. Table: recommendations
-- Stores rule-based sustainable land management practices mapped to degradation factors.
-- ----------------------------------------------------------------------------
CREATE TABLE recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    factor VARCHAR(100) NOT NULL,
    recommendation TEXT NOT NULL,
    priority ENUM('High', 'Medium', 'Low') NOT NULL DEFAULT 'Medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_factor (factor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. Table: conservation_activities
-- Tracks sustainable conservation actions undertaken by farmers/land managers.
-- ----------------------------------------------------------------------------
CREATE TABLE conservation_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    soil_sample_id INT NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    status ENUM('Planned', 'In Progress', 'Completed') NOT NULL DEFAULT 'Planned',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (soil_sample_id) REFERENCES soil_samples(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_activity_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- SEED DATA INSERTIONS
-- Password hashes correspond to 'password123' hashed with bcrypt (cost factor 10)
-- ============================================================================

INSERT INTO users (id, full_name, email, phone, password, role, status) VALUES
(1, 'Dr. Ramesh Kumar', 'admin@soilcare.org', '+91 9876543210', '$2a$10$7vN3n52K/j8Vl.p2R0B0e.w9B4G0J10x4t/E/e8B3u6Q3n9p2Y.Sy', 'admin', 'active'),
(2, 'Suresh Patel', 'suresh.patel@gmail.com', '+91 9812345678', '$2a$10$7vN3n52K/j8Vl.p2R0B0e.w9B4G0J10x4t/E/e8B3u6Q3n9p2Y.Sy', 'user', 'active'),
(3, 'Anita Sharma', 'anita.sharma@yahoo.com', '+91 9723456789', '$2a$10$7vN3n52K/j8Vl.p2R0B0e.w9B4G0J10x4t/E/e8B3u6Q3n9p2Y.Sy', 'user', 'active'),
(4, 'Rajesh Singh', 'rajesh.singh@outlook.com', '+91 9634567890', '$2a$10$7vN3n52K/j8Vl.p2R0B0e.w9B4G0J10x4t/E/e8B3u6Q3n9p2Y.Sy', 'user', 'active');

-- Sample Soil Records across different regions
INSERT INTO soil_samples (id, user_id, state, district, village, latitude, longitude, soil_type, soil_texture, land_use, crop_type, analysis_date) VALUES
(1, 2, 'Maharashtra', 'Nashik', 'Ozar', 20.0984, 73.9185, 'Black Cotton Soil', 'Clay Loam', 'Agricultural', 'Grapevine', '2026-08-15'),
(2, 2, 'Maharashtra', 'Pune', 'Baramati', 18.1517, 74.5771, 'Alluvial Soil', 'Silty Clay', 'Agricultural', 'Sugarcane', '2026-08-20'),
(3, 3, 'Punjab', 'Ludhiana', 'Jagraon', 30.7850, 75.4740, 'Alluvial Soil', 'Sandy Loam', 'Agricultural', 'Wheat', '2026-08-25'),
(4, 3, 'Punjab', 'Bhatinda', 'Talwandi', 30.2110, 74.9450, 'Arid/Sandy Soil', 'Sandy', 'Agricultural', 'Cotton', '2026-09-01'),
(5, 4, 'Karnataka', 'Mandya', 'Pandavapura', 12.5020, 76.6710, 'Red Soil', 'Loamy Sand', 'Agricultural', 'Paddy', '2026-09-05'),
(6, 4, 'Gujarat', 'Kutch', 'Bhuj', 23.2420, 69.6660, 'Saline/Marshy Soil', 'Clay', 'Fallow', 'None', '2026-09-10');

-- Soil Parameters
INSERT INTO soil_parameters (id, soil_sample_id, ph, moisture, organic_carbon, nitrogen, phosphorus, potassium, electrical_conductivity, salinity, erosion_level) VALUES
(1, 1, 6.80, 24.50, 0.85, 240.00, 18.50, 210.00, 1.10, 0.40, 'Low'),
(2, 2, 8.20, 14.00, 0.35, 110.00, 8.20, 120.00, 3.40, 2.80, 'Moderate'),
(3, 3, 7.10, 28.00, 0.92, 280.00, 22.00, 250.00, 0.95, 0.20, 'Low'),
(4, 4, 8.60, 9.50, 0.22, 85.00, 6.50, 95.00, 4.80, 4.20, 'High'),
(5, 5, 5.40, 18.00, 0.45, 150.00, 11.00, 160.00, 1.80, 0.80, 'Moderate'),
(6, 6, 8.90, 6.00, 0.15, 60.00, 4.00, 70.00, 7.50, 8.50, 'Severe');

-- Degradation Analyses
INSERT INTO degradation_analysis (id, soil_sample_id, degradation_score, `condition`, risk_level, main_factors) VALUES
(1, 1, 18.50, 'Healthy', 'Low', 'None. Parameters are within sustainable agronomic limits.'),
(2, 2, 54.00, 'Moderate Degradation', 'Medium', 'Alkaline pH, Low Organic Carbon, High Salinity, Nitrogen Deficiency'),
(3, 3, 14.00, 'Healthy', 'Low', 'Optimal organic carbon and balanced NPK balance.'),
(4, 4, 76.50, 'High Degradation', 'High', 'Severe Alkalinity, Low Organic Carbon, Low Soil Moisture, High Salinity, High Soil Erosion'),
(5, 5, 48.00, 'Moderate Degradation', 'Medium', 'Soil Acidity (Low pH), Moderate Organic Carbon Deficit, Moderate Soil Erosion'),
(6, 6, 92.00, 'Severe Degradation', 'Critical', 'Extreme Salinity, Severe Soil Erosion, Acute Organic Carbon Depletion, Critical Moisture Deficit');

-- Knowledge Base Recommendations
INSERT INTO recommendations (id, factor, recommendation, priority) VALUES
(1, 'Soil Erosion', 'Implement contour bunding, vegetative barriers (Vetiver grass), terracing, and continuous cover cropping to minimize topsoil runoff.', 'High'),
(2, 'Low Organic Carbon', 'Apply well-decomposed farmyard manure (10-15 t/ha), compost, green manure (Dhaincha/Sunnhemp), and practice minimum tillage.', 'High'),
(3, 'High Salinity', 'Improve sub-surface field drainage, apply agricultural gypsum (CaSO4.2H2O), practice leaching with good quality water, and cultivate salt-tolerant crops.', 'High'),
(4, 'Low Moisture', 'Adopt organic mulching (crop residue 5 t/ha), drip irrigation, rainwater harvesting ponds, and soil hydrogel application to enhance water retention.', 'Medium'),
(5, 'Nutrient Deficiency', 'Apply soil-test-based bio-fertilizers (Azotobacter, PSB), balanced NPK formulations, and micronutrient foliar sprays (Zinc, Iron).', 'Medium'),
(6, 'Acidic Soil (Low pH)', 'Incorporate agricultural lime (CaCO3) or dolomite at recommended rates during field preparation to neutralize excess acidity.', 'Medium'),
(7, 'Alkaline Soil (High pH)', 'Apply elemental sulfur, iron sulfate, or organic compost enriched with elemental sulfur to gradually lower soil pH to neutral range.', 'Medium');

-- Conservation Activities
INSERT INTO conservation_activities (id, user_id, soil_sample_id, activity_type, description, start_date, end_date, status, notes) VALUES
(1, 2, 2, 'Compost Application & Gypsum Treatment', 'Applied 5 tonnes of organic compost mixed with agricultural gypsum to reduce soil salinity and improve structure.', '2026-08-22', '2026-09-05', 'Completed', 'Significant moisture retention improvement noted after 2 weeks.'),
(2, 3, 4, 'Cover Cropping & Vetiver Barrier', 'Planted Leguminous cover crops (Cowpea) and established Vetiver grass lines along contour slope.', '2026-09-02', '2026-10-15', 'In Progress', 'Vegetative growth starting to anchor topsoil.'),
(3, 4, 5, 'Lime Application & Mulching', 'Broadcasted agricultural lime at 2 t/ha to correct low pH and applied paddy straw mulching.', '2026-09-06', NULL, 'Planned', 'Scheduled to start right after monsoon showers.');


-- ============================================================================
-- SAMPLE USEFUL QUERIES FOR ACADEMIC REFERENCE & DASHBOARD REPORTS
-- ============================================================================

-- Query 1: Soil Condition Summary for Dashboard Cards
SELECT 
    COUNT(s.id) AS total_samples,
    SUM(CASE WHEN d.condition = 'Healthy' THEN 1 ELSE 0 END) AS healthy_count,
    SUM(CASE WHEN d.condition LIKE '%Low%' THEN 1 ELSE 0 END) AS low_deg_count,
    SUM(CASE WHEN d.condition LIKE '%Moderate%' THEN 1 ELSE 0 END) AS moderate_deg_count,
    SUM(CASE WHEN d.condition LIKE '%High%' THEN 1 ELSE 0 END) AS high_deg_count,
    SUM(CASE WHEN d.condition LIKE '%Severe%' THEN 1 ELSE 0 END) AS severe_deg_count
FROM soil_samples s
JOIN degradation_analysis d ON s.id = d.soil_sample_id;

-- Query 2: District-wise Average Degradation Score
SELECT 
    s.district, 
    s.state,
    COUNT(s.id) AS sample_count, 
    ROUND(AVG(d.degradation_score), 2) AS avg_degradation_score
FROM soil_samples s
JOIN degradation_analysis d ON s.id = d.soil_sample_id
GROUP BY s.district, s.state
ORDER BY avg_degradation_score DESC;

-- Query 3: Full Soil Report Details by Sample ID
SELECT 
    s.id AS sample_id,
    u.full_name AS farmer_name,
    u.email AS farmer_email,
    CONCAT(s.village, ', ', s.district, ', ', s.state) AS location,
    s.soil_type,
    s.crop_type,
    p.ph,
    p.moisture,
    p.organic_carbon,
    p.nitrogen,
    p.phosphorus,
    p.potassium,
    p.salinity,
    p.erosion_level,
    d.degradation_score,
    d.condition,
    d.risk_level,
    d.main_factors
FROM soil_samples s
JOIN users u ON s.user_id = u.id
JOIN soil_parameters p ON s.id = p.soil_sample_id
JOIN degradation_analysis d ON s.id = d.soil_sample_id
WHERE s.id = 1;
