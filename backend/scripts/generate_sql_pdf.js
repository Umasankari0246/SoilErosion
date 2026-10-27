const path = require('path');
const { generateMySQLCodePDF } = require('../services/pdfReportService');

const outputPath = path.join(__dirname, '../../Soil_Conservation_MySQL_Code.pdf');

console.log('Generating Soil_Conservation_MySQL_Code.pdf...');
generateMySQLCodePDF(outputPath)
  .then(() => {
    console.log('✅ Soil_Conservation_MySQL_Code.pdf generated successfully at:', outputPath);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Failed to generate PDF:', err);
    process.exit(1);
  });
