/**
 * Conservation Activities Tracker Module
 */
let userSoilSamples = [];
let allActivities = [];

document.addEventListener('DOMContentLoaded', async () => {
  Auth.requireAuth();

  await loadSoilSampleOptions();
  await loadActivities();

  document.getElementById('activityForm').addEventListener('submit', saveActivity);
});

async function loadSoilSampleOptions() {
  const res = await Auth.apiCall('/soil');
  if (!res.success) return;

  userSoilSamples = res.samples || [];

  const select = document.getElementById('soil_sample_id');
  if (userSoilSamples.length === 0) {
    select.innerHTML = '<option value="">No soil samples available</option>';
    return;
  }

  let options = '';
  userSoilSamples.forEach(s => {
    options += `<option value="${s.id}">#SMP-${s.id} - ${s.village}, ${s.district} (${s.soil_type})</option>`;
  });
  select.innerHTML = options;
}

async function loadActivities() {
  const res = await Auth.apiCall('/conservation');
  if (!res.success) return;

  allActivities = res.activities || [];
  renderActivitiesTable(allActivities);
}

function renderActivitiesTable(activities) {
  const tbody = document.getElementById('activities-table-body');
  const countBadge = document.getElementById('activity-count');

  countBadge.innerText = `${activities.length} Activity(ies)`;

  if (activities.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No conservation activities recorded yet. Click "Record New Activity" to start tracking.</td></tr>`;
    return;
  }

  let html = '';
  activities.forEach(act => {
    let statusClass = 'bg-warning text-dark';
    if (act.status === 'Completed') statusClass = 'bg-success text-white';
    else if (act.status === 'In Progress') statusClass = 'bg-info text-white';

    html += `
      <tr>
        <td class="fw-bold">#ACT-${act.id}</td>
        <td class="fw-bold text-success">${act.activity_type}</td>
        <td>${act.village ? `${act.village}, ${act.district}` : 'Sample #' + act.soil_sample_id}</td>
        <td class="small">${act.description}</td>
        <td class="small text-muted">${new Date(act.start_date).toLocaleDateString()}</td>
        <td class="small text-muted">${act.end_date ? new Date(act.end_date).toLocaleDateString() : 'Ongoing'}</td>
        <td><span class="badge ${statusClass} px-2 py-1">${act.status}</span></td>
        <td>
          <button onclick="deleteActivity(${act.id})" class="btn btn-sm btn-outline-danger" title="Delete"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

async function saveActivity(e) {
  e.preventDefault();
  const alertContainer = document.getElementById('activity-alert');
  alertContainer.innerHTML = '';

  const payload = {
    soil_sample_id: document.getElementById('soil_sample_id').value,
    activity_type: document.getElementById('activity_type').value,
    description: document.getElementById('description').value.trim(),
    start_date: document.getElementById('start_date').value,
    end_date: document.getElementById('end_date').value || null,
    status: document.getElementById('status').value,
    notes: document.getElementById('notes').value.trim()
  };

  const res = await Auth.apiCall('/conservation', 'POST', payload);

  if (res.success) {
    alertContainer.innerHTML = `<div class="alert alert-success"><i class="fas fa-check-circle me-2"></i>Conservation activity recorded!</div>`;
    document.getElementById('activityForm').reset();
    
    // Close modal
    const modalEl = document.getElementById('activityModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    loadActivities();
  } else {
    alertContainer.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-triangle me-2"></i>${res.message || 'Failed to save activity.'}</div>`;
  }
}

async function deleteActivity(id) {
  if (!confirm(`Are you sure you want to delete Activity #ACT-${id}?`)) return;

  const res = await Auth.apiCall(`/conservation/${id}`, 'DELETE');
  if (res.success) {
    loadActivities();
  } else {
    alert(res.message || 'Failed to delete activity.');
  }
}
