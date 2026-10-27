/**
 * Dashboard Logic - Dynamically fetches database stats & renders Chart.js visualizations
 */
document.addEventListener('DOMContentLoaded', async () => {
  Auth.requireAuth();

  await loadSummaryStats();
  await loadTrendsAndCharts();
});

async function loadSummaryStats() {
  const data = await Auth.apiCall('/dashboard/stats');
  if (!data.success) return;

  const stats = data.stats;
  document.getElementById('stat-total-samples').innerText = stats.total_samples || 0;
  document.getElementById('stat-healthy-soil').innerText = stats.healthy_count || 0;
  document.getElementById('stat-moderate-deg').innerText = stats.moderate_deg_count || 0;
  document.getElementById('stat-severe-deg').innerText = (stats.high_deg_count || 0) + (stats.severe_deg_count || 0);
  document.getElementById('stat-activities').innerText = stats.total_activities || 0;

  // Render Recent Analysis Table
  const tableBody = document.getElementById('recent-analysis-table');
  if (tableBody && data.recent_analyses) {
    if (data.recent_analyses.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">No soil test records found. <a href="soil-analysis.html">Create your first sample analysis</a>.</td></tr>`;
      return;
    }

    let rowsHtml = '';
    data.recent_analyses.forEach(item => {
      let badgeClass = 'badge-healthy';
      if (item.condition.includes('Severe')) badgeClass = 'badge-severe';
      else if (item.condition.includes('High')) badgeClass = 'badge-high';
      else if (item.condition.includes('Moderate')) badgeClass = 'badge-moderate';
      else if (item.condition.includes('Low')) badgeClass = 'badge-low';

      rowsHtml += `
        <tr>
          <td class="fw-bold">#SMP-${item.id}</td>
          <td>${item.village}, ${item.district}</td>
          <td><span class="badge bg-secondary-subtle text-dark">${item.soil_type}</span></td>
          <td>${item.ph}</td>
          <td>${item.organic_carbon}%</td>
          <td>${item.moisture}%</td>
          <td class="fw-bold">${item.degradation_score}/100</td>
          <td><span class="badge ${badgeClass} px-2 py-1">${item.condition}</span></td>
          <td class="small text-muted">${new Date(item.analysis_date).toLocaleDateString()}</td>
        </tr>
      `;
    });
    tableBody.innerHTML = rowsHtml;
  }
}

async function loadTrendsAndCharts() {
  const data = await Auth.apiCall('/dashboard/trends');
  if (!data.success) return;

  // Chart 1: Degradation Distribution (Doughnut)
  const distCanvas = document.getElementById('chart-condition-dist');
  if (distCanvas) {
    const distData = data.condition_distribution || [];
    const labels = distData.map(d => d.condition);
    const counts = distData.map(d => d.count);

    new Chart(distCanvas, {
      type: 'doughnut',
      data: {
        labels: labels.length ? labels : ['Healthy', 'Low Deg', 'Moderate Deg', 'Severe Deg'],
        datasets: [{
          data: counts.length ? counts : [0, 0, 0, 0],
          backgroundColor: ['#3976a8', '#54a6a0', '#d7a64a', '#cf7f6a']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  // Chart 2: Soil pH Chart (Bar)
  const phCanvas = document.getElementById('chart-ph');
  if (phCanvas) {
    const phStats = data.ph_stats || { acidic: 0, optimal: 0, alkaline: 0 };
    new Chart(phCanvas, {
      type: 'bar',
      data: {
        labels: ['Acidic (<6.0)', 'Optimal (6.0-7.5)', 'Alkaline (>7.5)'],
        datasets: [{
          label: 'Number of Soil Samples',
          data: [phStats.acidic, phStats.optimal, phStats.alkaline],
          backgroundColor: ['#e53935', '#43a047', '#fb8c00']
        }]
      },
      options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
  }

  // Chart 3: Organic Carbon Chart (Doughnut)
  const ocCanvas = document.getElementById('chart-oc');
  if (ocCanvas) {
    const ocStats = data.oc_stats || { low: 0, moderate: 0, healthy: 0 };
    new Chart(ocCanvas, {
      type: 'doughnut',
      data: {
        labels: ['Deficient (<0.5%)', 'Moderate (0.5-0.99%)', 'Healthy (>=1.0%)'],
        datasets: [{
          data: [ocStats.low, ocStats.moderate, ocStats.healthy],
          backgroundColor: ['#d32f2f', '#fbc02d', '#2e7d32']
        }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
  }

  // Chart 4: Soil Nutrient Chart (Bar)
  const nutrientCanvas = document.getElementById('chart-nutrients');
  if (nutrientCanvas) {
    const nAvgs = data.nutrient_averages || { avg_n: 0, avg_p: 0, avg_k: 0 };
    new Chart(nutrientCanvas, {
      type: 'bar',
      data: {
        labels: ['Nitrogen (N)', 'Phosphorus (P)', 'Potassium (K)'],
        datasets: [{
          label: 'Average Concentration (kg/ha)',
          data: [nAvgs.avg_n, nAvgs.avg_p, nAvgs.avg_k],
          backgroundColor: ['#1e88e5', '#8e24aa', '#43a047']
        }]
      },
      options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
  }

  // Chart 5: Degradation Trend Over Time (Line)
  const trendCanvas = document.getElementById('chart-time-trend');
  if (trendCanvas) {
    const trendData = data.time_trend || [];
    const dates = trendData.map(t => new Date(t.analysis_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const scores = trendData.map(t => t.avg_score);

    new Chart(trendCanvas, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'Avg Degradation Index (0-100)',
          data: scores,
          borderColor: '#2c6e49',
          backgroundColor: 'rgba(44, 110, 73, 0.15)',
          fill: true,
          tension: 0.3,
          pointRadius: 5
        }]
      },
      options: { responsive: true, scales: { y: { beginAtZero: true, max: 100 } } }
    });
  }
}
