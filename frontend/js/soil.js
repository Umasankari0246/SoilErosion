/**
 * Soil History Table Management with Search & Filters
 */
let allSamples = [];

document.addEventListener('DOMContentLoaded', async () => {
  Auth.requireAuth();

  await fetchSoilRecords();

  document.getElementById('searchInput').addEventListener('input', applyFilters);
  document.getElementById('filterCondition').addEventListener('change', applyFilters);
  document.getElementById('filterSoilType').addEventListener('change', applyFilters);
});

async function fetchSoilRecords() {
  const res = await Auth.apiCall('/soil');
  if (!res.success) return;

  allSamples = res.samples || [];
  renderTable(allSamples);
}

function applyFilters() {
  const searchVal = document.getElementById('searchInput').value.toLowerCase().trim();
  const condVal = document.getElementById('filterCondition').value;
  const typeVal = document.getElementById('filterSoilType').value;

  const filtered = allSamples.filter(item => {
    const matchesSearch = !searchVal || 
      item.district.toLowerCase().includes(searchVal) ||
      item.village.toLowerCase().includes(searchVal) ||
      item.soil_type.toLowerCase().includes(searchVal) ||
      (item.farmer_name && item.farmer_name.toLowerCase().includes(searchVal));

    const matchesCond = !condVal || item.condition.includes(condVal);
    const matchesType = !typeVal || item.soil_type === typeVal;

    return matchesSearch && matchesCond && matchesType;
  });

  renderTable(filtered);
}

function renderTable(samples) {
  const tbody = document.getElementById('soil-records-table');
  const countBadge = document.getElementById('records-count');

  countBadge.innerText = `${samples.length} Record(s)`;

  if (samples.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11" class="text-center py-4 text-muted">No matching soil analysis records found.</td></tr>`;
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
      <tr>
        <td class="fw-bold">#SMP-${s.id}</td>
        <td>${s.village}, ${s.district}</td>
        <td><span class="badge bg-secondary-subtle text-dark">${s.soil_type}</span></td>
        <td>${s.ph}</td>
        <td>${s.organic_carbon}%</td>
        <td>${s.moisture}%</td>
        <td class="fw-bold">${s.degradation_score}</td>
        <td><span class="badge ${badgeClass} px-2 py-1">${s.condition}</span></td>
        <td class="small text-muted">${new Date(s.analysis_date).toLocaleDateString()}</td>
        <td>
          <a href="analysis-result.html?id=${s.id}" class="btn btn-sm btn-outline-success me-1" title="View Assessment"><i class="fas fa-eye"></i> View</a>
          <button onclick="deleteRecord(${s.id})" class="btn btn-sm btn-outline-danger" title="Delete Record"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

async function deleteRecord(id) {
  if (!confirm(`Are you sure you want to delete Soil Sample #SMP-${id}?`)) return;

  const res = await Auth.apiCall(`/soil/${id}`, 'DELETE');
  if (res.success) {
    allSamples = allSamples.filter(s => s.id !== id);
    applyFilters();
  } else {
    alert(res.message || 'Failed to delete record.');
  }
}
