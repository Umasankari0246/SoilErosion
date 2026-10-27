/**
 * Reports Center & PDF Export Module
 */
let sampleList = [];

document.addEventListener('DOMContentLoaded', async () => {
  Auth.requireAuth();

  const res = await Auth.apiCall('/soil');
  if (!res.success) return;

  sampleList = res.samples || [];
  renderReportsList(sampleList);
});

function renderReportsList(samples) {
  const container = document.getElementById('reports-grid');

  if (samples.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-5 text-muted">
        <i class="fas fa-file-pdf fs-1 mb-3 text-secondary"></i>
        <h5>No Diagnostic Reports Generated Yet</h5>
        <p>Analyze a soil sample to generate publication-ready PDF reports.</p>
        <a href="soil-analysis.html" class="btn btn-primary-custom">Analyze Soil Now</a>
      </div>
    `;
    return;
  }

  let html = '';
  samples.forEach(s => {
    let badgeClass = 'badge-healthy';
    if (s.condition.includes('Severe')) badgeClass = 'badge-severe';
    else if (s.condition.includes('High')) badgeClass = 'badge-high';
    else if (s.condition.includes('Moderate')) badgeClass = 'badge-moderate';
    else if (s.condition.includes('Low')) badgeClass = 'badge-low';

    html += `
      <div class="col-md-6 col-lg-4">
        <div class="custom-card p-4 h-100 d-flex flex-column justify-content-between">
          <div>
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="fw-bold text-success">#SMP-${s.id}</span>
              <span class="badge ${badgeClass} px-2 py-1">${s.condition}</span>
            </div>
            <h5 class="fw-bold mb-1">${s.village}, ${s.district}</h5>
            <div class="small text-muted mb-3"><i class="fas fa-calendar-alt me-1"></i>${new Date(s.analysis_date).toLocaleDateString()}</div>
            
            <div class="bg-light p-3 rounded mb-3">
              <div class="d-flex justify-content-between small mb-1">
                <span>Soil Type:</span> <strong>${s.soil_type}</strong>
              </div>
              <div class="d-flex justify-content-between small mb-1">
                <span>Degradation Score:</span> <strong>${s.degradation_score} / 100</strong>
              </div>
              <div class="d-flex justify-content-between small">
                <span>Soil pH:</span> <strong>${s.ph}</strong>
              </div>
            </div>
          </div>

          <div class="d-flex gap-2 pt-2 border-top">
            <a href="analysis-result.html?id=${s.id}" class="btn btn-sm btn-outline-success flex-grow-1"><i class="fas fa-eye me-1"></i>View Result</a>
            <a href="/api/reports/pdf/${s.id}" class="btn btn-sm btn-danger text-white"><i class="fas fa-file-pdf me-1"></i>PDF</a>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}
