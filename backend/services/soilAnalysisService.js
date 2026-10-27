/**
 * Deterministic Soil Degradation Analysis Algorithm
 * Calculates soil degradation score (0 - 100), condition classification, risk level,
 * contributing risk factors, and recommended conservation actions.
 */

function calculateSoilDegradation(params) {
  const ph = parseFloat(params.ph);
  const moisture = parseFloat(params.moisture);
  const organicCarbon = parseFloat(params.organic_carbon);
  const nitrogen = parseFloat(params.nitrogen);
  const phosphorus = parseFloat(params.phosphorus);
  const potassium = parseFloat(params.potassium);
  const ec = parseFloat(params.electrical_conductivity);
  const salinity = parseFloat(params.salinity);
  const erosionLevel = (params.erosion_level || 'Low').trim();

  let score = 0;
  const factors = [];

  // 1. pH Imbalance (Max 20 Points)
  // Optimal pH range for general crops: 6.0 - 7.5
  if (ph < 5.0) {
    score += 20;
    factors.push('Severe Soil Acidity (pH < 5.0)');
  } else if (ph < 6.0) {
    const penalty = (6.0 - ph) * 15;
    score += penalty;
    factors.push('Moderate Soil Acidity (pH 5.0 - 5.9)');
  } else if (ph > 8.5) {
    score += 20;
    factors.push('Severe Soil Alkalinity (pH > 8.5)');
  } else if (ph > 7.5) {
    const penalty = (ph - 7.5) * 15;
    score += penalty;
    factors.push('Moderate Soil Alkalinity (pH 7.6 - 8.5)');
  }

  // 2. Organic Carbon Deficit (Max 20 Points)
  // Target: >= 1.0%
  if (organicCarbon < 0.25) {
    score += 20;
    factors.push('Critical Organic Carbon Depletion (< 0.25%)');
  } else if (organicCarbon < 0.50) {
    score += 15;
    factors.push('Severe Organic Carbon Deficit (0.25% - 0.49%)');
  } else if (organicCarbon < 0.80) {
    score += 10;
    factors.push('Moderate Organic Carbon Deficit (0.50% - 0.79%)');
  } else if (organicCarbon < 1.00) {
    score += 5;
    factors.push('Mild Organic Carbon Deficit (0.80% - 0.99%)');
  }

  // 3. Soil Moisture Deficit (Max 15 Points)
  // Optimal range: >= 20%
  if (moisture < 8.0) {
    score += 15;
    factors.push('Acute Soil Moisture Deficit (< 8%)');
  } else if (moisture < 15.0) {
    score += 10;
    factors.push('Low Soil Moisture (8% - 14.9%)');
  } else if (moisture < 20.0) {
    score += 5;
    factors.push('Sub-optimal Soil Moisture (15% - 19.9%)');
  }

  // 4. Salinity & Electrical Conductivity (Max 20 Points)
  // Normal EC < 2.0 dS/m; Salinity < 1.0 ppt
  if (ec >= 6.0 || salinity >= 5.0) {
    score += 20;
    factors.push('Extreme Salinity & Electrical Conductivity (EC >= 6 dS/m)');
  } else if (ec >= 3.0 || salinity >= 2.5) {
    score += 14;
    factors.push('High Soil Salinity & EC (EC 3-6 dS/m)');
  } else if (ec >= 2.0 || salinity >= 1.5) {
    score += 8;
    factors.push('Moderate Soil Salinity (EC 2-3 dS/m)');
  }

  // 5. Nutrient Deficiencies (Max 15 Points: 5 points each for N, P, K)
  // Benchmarks: N >= 200 kg/ha, P >= 15 kg/ha, K >= 150 kg/ha
  let nutrientDeficitCount = 0;
  if (nitrogen < 150) {
    score += 5;
    nutrientDeficitCount++;
  }
  if (phosphorus < 10) {
    score += 5;
    nutrientDeficitCount++;
  }
  if (potassium < 120) {
    score += 5;
    nutrientDeficitCount++;
  }
  if (nutrientDeficitCount > 0) {
    factors.push(`Essential Macronutrient Deficiency (${nutrientDeficitCount} of 3 primary NPK elements low)`);
  }

  // 6. Soil Erosion Level (Max 10 Points)
  if (erosionLevel === 'Severe') {
    score += 10;
    factors.push('Severe Topsoil Erosion');
  } else if (erosionLevel === 'High') {
    score += 7.5;
    factors.push('High Topsoil Erosion');
  } else if (erosionLevel === 'Moderate') {
    score += 4.0;
    factors.push('Moderate Soil Erosion');
  }

  // Final Score Clamping (0 - 100)
  const finalScore = Math.min(100, Math.max(0, Math.round(score * 100) / 100));

  // Condition Classification
  let condition = 'Healthy';
  let riskLevel = 'Low';

  if (finalScore <= 20) {
    condition = 'Healthy';
    riskLevel = 'Low';
  } else if (finalScore <= 40) {
    condition = 'Low Degradation';
    riskLevel = 'Mild';
  } else if (finalScore <= 60) {
    condition = 'Moderate Degradation';
    riskLevel = 'Medium';
  } else if (finalScore <= 80) {
    condition = 'High Degradation';
    riskLevel = 'High';
  } else {
    condition = 'Severe Degradation';
    riskLevel = 'Critical';
  }

  // Generate Tailored Recommended Actions based on factors
  const recommendedActions = generateRecommendations(factors, ph, organicCarbon, salinity, moisture, erosionLevel);

  return {
    degradation_score: finalScore,
    condition,
    risk_level: riskLevel,
    main_factors: factors.length > 0 ? factors.join('; ') : 'None. Soil parameters are within healthy sustainable bounds.',
    factors_array: factors,
    recommended_actions: recommendedActions
  };
}

function generateRecommendations(factors, ph, organicCarbon, salinity, moisture, erosionLevel) {
  const actions = [];

  if (erosionLevel === 'High' || erosionLevel === 'Severe' || factors.some(f => f.includes('Erosion'))) {
    actions.push({
      category: 'Soil Erosion Control',
      action: 'Implement contour bunding, vegetative barriers using Vetiver grass, terracing along slope lines, and maintain continuous cover cropping.'
    });
  }

  if (organicCarbon < 0.8 || factors.some(f => f.includes('Organic Carbon'))) {
    actions.push({
      category: 'Organic Carbon Enrichment',
      action: 'Incorporate well-decomposed farmyard manure (FYM at 10-15 t/ha), vermicompost, green manure crops (Dhaincha/Sunnhemp), and practice minimum soil disturbance.'
    });
  }

  if (salinity > 1.5 || factors.some(f => f.includes('Salinity'))) {
    actions.push({
      category: 'Salinity & Reclamation Management',
      action: 'Improve sub-surface tile drainage, apply agricultural gypsum (CaSO4.2H2O) to displace sodium ions, perform heavy freshwater leaching, and select salt-tolerant crops.'
    });
  }

  if (moisture < 15 || factors.some(f => f.includes('Moisture'))) {
    actions.push({
      category: 'Moisture Conservation',
      action: 'Apply organic crop residue mulching (5 t/ha), construct farm ponds for rainwater harvesting, install micro-drip irrigation, and use hydrogel soil conditioners.'
    });
  }

  if (ph < 6.0) {
    actions.push({
      category: 'Soil Acidity Correction',
      action: 'Apply agricultural lime (CaCO3) or dolomitic limestone based on soil buffering capacity during land preparation to increase soil pH.'
    });
  } else if (ph > 7.8) {
    actions.push({
      category: 'Soil Alkalinity Correction',
      action: 'Broadcast elemental sulfur or apply sulfur-enriched organic compost to lower soil pH toward neutral.'
    });
  }

  if (factors.some(f => f.includes('Macronutrient'))) {
    actions.push({
      category: 'Integrated Nutrient Management',
      action: 'Apply soil-test targeted bio-fertilizers (Azotobacter, Phosphate Solubilizing Bacteria) along with split-dosing of balanced NPK fertilizers.'
    });
  }

  if (actions.length === 0) {
    actions.push({
      category: 'Sustainable Maintenance',
      action: 'Maintain current crop rotation, regular organic mulching, and periodic soil health monitoring to protect soil fertility.'
    });
  }

  return actions;
}

module.exports = {
  calculateSoilDegradation
};
