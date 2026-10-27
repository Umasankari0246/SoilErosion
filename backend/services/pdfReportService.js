const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generates a PDF Soil Analysis Report and streams to res or file.
 */
function generateSoilReportPDF(sampleData, res) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  if (res) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Soil_Report_Sample_${sampleData.id}.pdf`);
    doc.pipe(res);
  }

  // Header Banner
  doc.rect(0, 0, 595.28, 80).fill('#2c6e49');
  doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold').text('SMART SOIL CONSERVATION SYSTEM', 40, 25);
  doc.fontSize(12).font('Helvetica').text('Comprehensive Soil Degradation & Sustainability Report', 40, 50);

  doc.moveDown(3);
  doc.fillColor('#1a1a1a');

  // Report Reference Metadata
  doc.fontSize(10).font('Helvetica-Bold').text(`Report ID: SSR-${sampleData.id}-${Date.now().toString().slice(-4)}`, 40, 100);
  doc.font('Helvetica').text(`Date of Analysis: ${new Date(sampleData.analysis_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 350, 100, { align: 'right' });

  doc.strokeColor('#cccccc').lineWidth(1).moveTo(40, 118).lineTo(555, 118).stroke();

  // Section 1: User & Location Info
  doc.moveDown(1.5);
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c6e49').text('1. Sample Metadata & Location Profile');
  doc.moveDown(0.5);

  const startY = doc.y;
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#333333');
  doc.text('Farmer / Landowner:', 45, startY);
  doc.font('Helvetica').text(sampleData.farmer_name || sampleData.full_name || 'N/A', 170, startY);

  doc.font('Helvetica-Bold').text('State:', 45, startY + 18);
  doc.font('Helvetica').text(sampleData.state, 170, startY + 18);

  doc.font('Helvetica-Bold').text('District:', 45, startY + 36);
  doc.font('Helvetica').text(sampleData.district, 170, startY + 36);

  doc.font('Helvetica-Bold').text('Village / Area:', 45, startY + 54);
  doc.font('Helvetica').text(sampleData.village, 170, startY + 54);

  doc.font('Helvetica-Bold').text('Soil Type:', 320, startY);
  doc.font('Helvetica').text(sampleData.soil_type, 430, startY);

  doc.font('Helvetica-Bold').text('Soil Texture:', 320, startY + 18);
  doc.font('Helvetica').text(sampleData.soil_texture, 430, startY + 18);

  doc.font('Helvetica-Bold').text('Land Use:', 320, startY + 36);
  doc.font('Helvetica').text(sampleData.land_use, 430, startY + 36);

  doc.font('Helvetica-Bold').text('Crop Type:', 320, startY + 54);
  doc.font('Helvetica').text(sampleData.crop_type, 430, startY + 54);

  doc.moveDown(5);

  // Section 2: Degradation Assessment Box
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c6e49').text('2. Degradation Assessment Results');
  doc.moveDown(0.5);

  const scoreY = doc.y;
  let boxColor = '#4caf50';
  if (sampleData.degradation_score > 80) boxColor = '#d32f2f';
  else if (sampleData.degradation_score > 60) boxColor = '#f57c00';
  else if (sampleData.degradation_score > 40) boxColor = '#fbc02d';
  else if (sampleData.degradation_score > 20) boxColor = '#8bc34a';

  doc.rect(40, scoreY, 515, 60).fillAndStroke('#f8f9fa', '#e0e0e0');

  doc.fillColor(boxColor).fontSize(26).font('Helvetica-Bold').text(`${sampleData.degradation_score} / 100`, 60, scoreY + 15);
  doc.fillColor('#333333').fontSize(12).font('Helvetica-Bold').text(`Condition: ${sampleData.condition}`, 220, scoreY + 15);
  doc.fontSize(10).font('Helvetica').text(`Risk Level: ${sampleData.risk_level}`, 220, scoreY + 35);

  doc.y = scoreY + 75;

  // Section 3: Key Soil Parameters Table
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c6e49').text('3. Tested Soil Parameters');
  doc.moveDown(0.5);

  const tableTop = doc.y;
  doc.rect(40, tableTop, 515, 20).fill('#e8f5e9');
  doc.fillColor('#2c6e49').fontSize(9).font('Helvetica-Bold');
  doc.text('Parameter Name', 50, tableTop + 5);
  doc.text('Measured Value', 200, tableTop + 5);
  doc.text('Standard Reference Range', 360, tableTop + 5);

  const paramsList = [
    { name: 'Soil pH', val: sampleData.ph, ref: '6.0 - 7.5 (Optimal)' },
    { name: 'Soil Moisture (%)', val: `${sampleData.moisture}%`, ref: '>= 20.0%' },
    { name: 'Organic Carbon (%)', val: `${sampleData.organic_carbon}%`, ref: '>= 1.0%' },
    { name: 'Nitrogen (N)', val: `${sampleData.nitrogen} kg/ha`, ref: '>= 200.0 kg/ha' },
    { name: 'Phosphorus (P)', val: `${sampleData.phosphorus} kg/ha`, ref: '>= 15.0 kg/ha' },
    { name: 'Potassium (K)', val: `${sampleData.potassium} kg/ha`, ref: '>= 150.0 kg/ha' },
    { name: 'Electrical Conductivity (EC)', val: `${sampleData.electrical_conductivity} dS/m`, ref: '< 2.0 dS/m' },
    { name: 'Salinity', val: `${sampleData.salinity} ppt`, ref: '< 1.0 ppt' },
    { name: 'Soil Erosion Level', val: sampleData.erosion_level, ref: 'Low' }
  ];

  let currentY = tableTop + 20;
  paramsList.forEach((item, index) => {
    if (index % 2 === 1) {
      doc.rect(40, currentY, 515, 18).fill('#f9f9f9');
    }
    doc.fillColor('#333333').fontSize(9).font('Helvetica');
    doc.text(item.name, 50, currentY + 4);
    doc.text(String(item.val), 200, currentY + 4);
    doc.text(item.ref, 360, currentY + 4);
    currentY += 18;
  });

  doc.y = currentY + 15;

  // Section 4: Main Degradation Factors & Sustainable Recommendations
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c6e49').text('4. Contributing Factors & Recommended Actions');
  doc.moveDown(0.5);

  doc.fontSize(10).font('Helvetica-Bold').fillColor('#d32f2f').text('Main Degradation Causes:');
  doc.fontSize(9).font('Helvetica').fillColor('#333333').text(sampleData.main_factors || 'None', 40, doc.y + 4, { width: 515 });

  doc.moveDown(1.5);
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#2c6e49').text('Recommended Conservation Practices:');
  doc.moveDown(0.3);

  let recs = sampleData.recommended_actions;
  if (typeof recs === 'string') {
    try { recs = JSON.parse(recs); } catch (e) { recs = []; }
  }

  if (Array.isArray(recs) && recs.length > 0) {
    recs.forEach((rec, idx) => {
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#1b5e20').text(`${idx + 1}. ${rec.category || 'Action'}:`, { bulletRadius: 2 });
      doc.font('Helvetica').fillColor('#333333').text(rec.action || rec, { indent: 15, width: 500 });
      doc.moveDown(0.3);
    });
  } else {
    doc.fontSize(9).font('Helvetica').fillColor('#333333').text('Maintain standard soil organic practices and periodic soil testing.');
  }

  // Footer
  doc.fontSize(8).font('Helvetica-Oblique').fillColor('#888888').text(
    'Smart Soil Degradation Analysis System - Academic & Environmental Decision Support System',
    40, 780, { align: 'center' }
  );

  doc.end();
}

/**
 * Generates Soil_Conservation_MySQL_Code.pdf
 */
function generateMySQLCodePDF(outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);

    // Title Banner
    doc.rect(0, 0, 595.28, 80).fill('#1b4332');
    doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text('MYSQL DATABASE DOCUMENTATION & CODE', 40, 22);
    doc.fontSize(11).font('Helvetica').text('A Smart System for Soil Degradation Analysis and Sustainable Land Conservation', 40, 48);

    doc.moveDown(3);
    doc.fillColor('#1a1a1a');

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#2c6e49').text('1. Executive Overview & Architecture');
    doc.fontSize(9).font('Helvetica').fillColor('#333333').text(
      'This document provides the complete MySQL database design, entity-relationship structure, primary & foreign key constraints, indexes, and queries used in the Soil Conservation system. Built for direct import into MySQL Workbench 8.0+.',
      40, doc.y + 4, { width: 515 }
    );

    doc.moveDown(1.5);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#2c6e49').text('2. Schema Definitions (DDL & DML Scripts)');
    doc.moveDown(0.5);

    const sqlFilePath = path.join(__dirname, '../../database/soil_conservation_db.sql');
    let sqlCode = '';
    try {
      sqlCode = fs.readFileSync(sqlFilePath, 'utf8');
    } catch (e) {
      sqlCode = '-- SQL file missing';
    }

    doc.fontSize(7.5).font('Courier').fillColor('#212529');
    
    const lines = sqlCode.split('\n');
    let pageCount = 1;

    for (let i = 0; i < lines.length; i++) {
      if (doc.y > 740) {
        doc.addPage();
        pageCount++;
        doc.rect(0, 0, 595.28, 30).fill('#1b4332');
        doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold').text(`MySQL Code Reference - Page ${pageCount}`, 40, 10);
        doc.moveDown(2);
        doc.fontSize(7.5).font('Courier').fillColor('#212529');
      }
      doc.text(lines[i], 40, doc.y, { width: 515 });
    }

    doc.end();

    writeStream.on('finish', () => resolve(outputPath));
    writeStream.on('error', reject);
  });
}

module.exports = {
  generateSoilReportPDF,
  generateMySQLCodePDF
};
