/**
 * Soil Analysis Form Handler & Client Validation
 */
document.addEventListener('DOMContentLoaded', () => {
  Auth.requireAuth();

  const form = document.getElementById('soilAnalysisForm');
  const alertContainer = document.getElementById('alert-container');
  const submitBtn = document.getElementById('submitBtn');

  // Input Range Validations
  const phInput = document.getElementById('ph');
  const moistureInput = document.getElementById('moisture');
  const ocInput = document.getElementById('organic_carbon');

  phInput.addEventListener('input', () => {
    const val = parseFloat(phInput.value);
    if (val < 0 || val > 14) {
      phInput.classList.add('is-invalid');
    } else {
      phInput.classList.remove('is-invalid');
    }
  });

  moistureInput.addEventListener('input', () => {
    const val = parseFloat(moistureInput.value);
    if (val < 0 || val > 100) {
      moistureInput.classList.add('is-invalid');
    } else {
      moistureInput.classList.remove('is-invalid');
    }
  });

  ocInput.addEventListener('input', () => {
    const val = parseFloat(ocInput.value);
    if (val < 0 || val > 20) {
      ocInput.classList.add('is-invalid');
    } else {
      ocInput.classList.remove('is-invalid');
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertContainer.innerHTML = '';

    const ph = parseFloat(phInput.value);
    const moisture = parseFloat(moistureInput.value);
    const organic_carbon = parseFloat(ocInput.value);

    if (ph < 0 || ph > 14 || isNaN(ph)) {
      alertContainer.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle me-2"></i>pH must be between 0.00 and 14.00.</div>`;
      return;
    }

    if (moisture < 0 || moisture > 100 || isNaN(moisture)) {
      alertContainer.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle me-2"></i>Moisture % must be between 0.00% and 100.00%.</div>`;
      return;
    }

    if (organic_carbon < 0 || organic_carbon > 20 || isNaN(organic_carbon)) {
      alertContainer.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle me-2"></i>Organic Carbon % must be between 0.00% and 20.00%.</div>`;
      return;
    }

    const payload = {
      state: document.getElementById('state').value.trim(),
      district: document.getElementById('district').value.trim(),
      village: document.getElementById('village').value.trim(),
      latitude: parseFloat(document.getElementById('latitude').value) || 20.0,
      longitude: parseFloat(document.getElementById('longitude').value) || 73.0,
      soil_type: document.getElementById('soil_type').value,
      soil_texture: document.getElementById('soil_texture').value,
      land_use: document.getElementById('land_use').value,
      crop_type: document.getElementById('crop_type').value.trim() || 'General Crop',
      analysis_date: document.getElementById('analysis_date').value || new Date().toISOString().split('T')[0],
      ph,
      moisture,
      organic_carbon,
      nitrogen: parseFloat(document.getElementById('nitrogen').value) || 200,
      phosphorus: parseFloat(document.getElementById('phosphorus').value) || 15,
      potassium: parseFloat(document.getElementById('potassium').value) || 150,
      electrical_conductivity: parseFloat(document.getElementById('electrical_conductivity').value) || 1.0,
      salinity: parseFloat(document.getElementById('salinity').value) || 0.5,
      erosion_level: document.getElementById('erosion_level').value
    };

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading-spinner me-2"></span> Calculating Degradation Score...';

    const res = await Auth.apiCall('/soil', 'POST', payload);

    if (res.success) {
      alertContainer.innerHTML = `<div class="alert alert-success"><i class="fas fa-check-circle me-2"></i>Analysis completed! Opening result assessment...</div>`;
      setTimeout(() => {
        window.location.href = `analysis-result.html?id=${res.soil_sample_id}`;
      }, 700);
    } else {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-calculator me-2"></i>Run Degradation Analysis';
      alertContainer.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-triangle me-2"></i>${res.message || 'Analysis submission failed.'}</div>`;
    }
  });
});
