/**
 * Soil Sample Comparison Module with Chart.js Bar & Radar charts
 */
let allSamples = [];
let barChart = null;
let radarChart = null;

document.addEventListener('DOMContentLoaded', async () => {
  Auth.requireAuth();

  const res = await Auth.apiCall('/soil');
  if (!res.success) return;

  allSamples = res.samples || [];

  populateSelectBoxes();
});

function populateSelectBoxes() {
  const sel1 = document.getElementById('sampleSelect1');
  const sel2 = document.getElementById('sampleSelect2');

  if (allSamples.length === 0) {
    sel1.innerHTML = '<option value="">No samples available</option>';
    sel2.innerHTML = '<option value="">No samples available</option>';
    return;
  }

  let options1 = '<option value="">Select Primary Sample...</option>';
  let options2 = '<option value="">Select Comparison Sample...</option>';

  allSamples.forEach((s, idx) => {
    const label = `#SMP-${s.id} - ${s.village}, ${s.district} (${s.soil_type} - Score ${s.degradation_score})`;
    options1 += `<option value="${s.id}" ${idx === 0 ? 'selected' : ''}>${label}</option>`;
    options2 += `<option value="${s.id}" ${idx === 1 ? 'selected' : ''}>${label}</option>`;
  });

  sel1.innerHTML = options1;
  sel2.innerHTML = options2;

  // Auto compare first two samples
  if (allSamples.length >= 2) {
    compareSamples();
  }
}

function compareSamples() {
  const id1 = parseInt(document.getElementById('sampleSelect1').value);
  const id2 = parseInt(document.getElementById('sampleSelect2').value);

  if (!id1 || !id2) {
    alert('Please select two soil samples to compare.');
    return;
  }

  if (id1 === id2) {
    alert('Please select two different soil samples for comparison.');
    return;
  }

  const s1 = allSamples.find(s => s.id === id1);
  const s2 = allSamples.find(s => s.id === id2);

  if (!s1 || !s2) return;

  // Render Comparison Table
  renderComparisonTable(s1, s2);

  // Render Superior Health Indicator
  renderHealthComparisonBadge(s1, s2);

  // Render Bar & Radar Charts
  renderBarChart(s1, s2);
  renderRadarChart(s1, s2);
}

function renderHealthComparisonBadge(s1, s2) {
  const container = document.getElementById('health-winner-container');
  
  let winner = null;
  let diff = Math.abs(s1.degradation_score - s2.degradation_score);

  if (s1.degradation_score < s2.degradation_score) {
    winner = s1;
  } else if (s2.degradation_score < s1.degradation_score) {
    winner = s2;
  }

  if (!winner) {
    container.innerHTML = `
      <div class="alert alert-info d-flex align-items-center mb-0">
        <i class="fas fa-equals fs-3 me-3"></i>
        <div>
          <h6 class="fw-bold mb-0">Identical Health Profile</h6>
          <span class="small">Both samples share the exact same soil degradation score (${s1.degradation_score}/100).</span>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="alert alert-success d-flex align-items-center mb-0 border-success border-2">
        <i class="fas fa-trophy fs-3 me-3 text-warning"></i>
        <div>
          <h6 class="fw-bold mb-0">Superior Soil Quality: Sample #SMP-${winner.id} (${winner.village}, ${winner.district})</h6>
          <span class="small">Sample #SMP-${winner.id} has a lower degradation score (${winner.degradation_score}/100 vs ${s1.id === winner.id ? s2.degradation_score : s1.degradation_score}/100) indicating superior soil fertility and lower degradation risk.</span>
        </div>
      </div>
    `;
  }
}

function renderComparisonTable(s1, s2) {
  const tbody = document.getElementById('comparison-table-body');

  const rows = [
    { name: 'Sample ID', val1: `#SMP-${s1.id}`, val2: `#SMP-${s2.id}`, best: null },
    { name: 'Location', val1: `${s1.village}, ${s1.district}`, val2: `${s2.village}, ${s2.district}`, best: null },
    { name: 'Soil Type & Texture', val1: `${s1.soil_type} (${s1.soil_texture})`, val2: `${s2.soil_type} (${s2.soil_texture})`, best: null },
    { name: 'Degradation Score (0-100)', val1: s1.degradation_score, val2: s2.degradation_score, best: s1.degradation_score <= s2.degradation_score ? 1 : 2 },
    { name: 'Condition Status', val1: s1.condition, val2: s2.condition, best: null },
    { name: 'Soil pH', val1: s1.ph, val2: s2.ph, best: Math.abs(s1.ph - 7) <= Math.abs(s2.ph - 7) ? 1 : 2 },
    { name: 'Organic Carbon (%)', val1: `${s1.organic_carbon}%`, val2: `${s2.organic_carbon}%`, best: s1.organic_carbon >= s2.organic_carbon ? 1 : 2 },
    { name: 'Soil Moisture (%)', val1: `${s1.moisture}%`, val2: `${s2.moisture}%`, best: s1.moisture >= s2.moisture ? 1 : 2 },
    { name: 'Nitrogen (N kg/ha)', val1: s1.nitrogen, val2: s2.nitrogen, best: s1.nitrogen >= s2.nitrogen ? 1 : 2 },
    { name: 'Phosphorus (P kg/ha)', val1: s1.phosphorus, val2: s2.phosphorus, best: s1.phosphorus >= s2.phosphorus ? 1 : 2 },
    { name: 'Potassium (K kg/ha)', val1: s1.potassium, val2: s2.potassium, best: s1.potassium >= s2.potassium ? 1 : 2 },
    { name: 'Elect. Conduct. (dS/m)', val1: s1.electrical_conductivity, val2: s2.electrical_conductivity, best: s1.electrical_conductivity <= s2.electrical_conductivity ? 1 : 2 },
    { name: 'Salinity (ppt)', val1: s1.salinity, val2: s2.salinity, best: s1.salinity <= s2.salinity ? 1 : 2 },
    { name: 'Topsoil Erosion Level', val1: s1.erosion_level, val2: s2.erosion_level, best: null }
  ];

  let html = '';
  rows.forEach(r => {
    const highlight1 = r.best === 1 ? 'table-success fw-bold' : '';
    const highlight2 = r.best === 2 ? 'table-success fw-bold' : '';

    html += `
      <tr>
        <th class="bg-light" style="width: 30%;">${r.name}</th>
        <td class="${highlight1}">${r.val1} ${r.best === 1 ? '<i class="fas fa-check-circle text-success ms-1"></i>' : ''}</td>
        <td class="${highlight2}">${r.val2} ${r.best === 2 ? '<i class="fas fa-check-circle text-success ms-1"></i>' : ''}</td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

function renderBarChart(s1, s2) {
  const ctx = document.getElementById('chart-comparison-bar');
  if (barChart) barChart.destroy();

  barChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['pH Level', 'Organic Carbon (%)', 'Moisture (%)', 'Salinity (ppt)', 'EC (dS/m)'],
      datasets: [
        {
          label: `#SMP-${s1.id} (${s1.district})`,
          data: [s1.ph, s1.organic_carbon, s1.moisture, s1.salinity, s1.electrical_conductivity],
          backgroundColor: 'rgba(44, 110, 73, 0.8)'
        },
        {
          label: `#SMP-${s2.id} (${s2.district})`,
          data: [s2.ph, s2.organic_carbon, s2.moisture, s2.salinity, s2.electrical_conductivity],
          backgroundColor: 'rgba(230, 81, 0, 0.8)'
        }
      ]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } }
    }
  });
}

function renderRadarChart(s1, s2) {
  const ctx = document.getElementById('chart-comparison-radar');
  if (radarChart) radarChart.destroy();

  // Normalize parameters to 0-100 scale for radar comparison
  const norm1 = [
    Math.min(100, (s1.ph / 14) * 100),
    Math.min(100, (s1.organic_carbon / 2.0) * 100),
    Math.min(100, s1.moisture),
    Math.min(100, (s1.nitrogen / 300) * 100),
    Math.min(100, (s1.phosphorus / 30) * 100),
    Math.min(100, (s1.potassium / 300) * 100)
  ];

  const norm2 = [
    Math.min(100, (s2.ph / 14) * 100),
    Math.min(100, (s2.organic_carbon / 2.0) * 100),
    Math.min(100, s2.moisture),
    Math.min(100, (s2.nitrogen / 300) * 100),
    Math.min(100, (s2.phosphorus / 30) * 100),
    Math.min(100, (s2.potassium / 300) * 100)
  ];

  radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['pH Ratio', 'Organic Carbon', 'Moisture', 'Nitrogen (N)', 'Phosphorus (P)', 'Potassium (K)'],
      datasets: [
        {
          label: `#SMP-${s1.id} (${s1.district})`,
          data: norm1,
          borderColor: '#2c6e49',
          backgroundColor: 'rgba(44, 110, 73, 0.2)'
        },
        {
          label: `#SMP-${s2.id} (${s2.district})`,
          data: norm2,
          borderColor: '#e65100',
          backgroundColor: 'rgba(230, 81, 0, 0.2)'
        }
      ]
    },
    options: {
      responsive: true,
      scales: { r: { beginAtZero: true, max: 100 } }
    }
  });
}
