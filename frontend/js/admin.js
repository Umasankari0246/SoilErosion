/**
 * Admin Panel Management Script
 */
let allUsers = [];
let allSoilRecords = [];

document.addEventListener('DOMContentLoaded', async () => {
  Auth.requireAdminAuth();

  const currentPage = window.location.pathname.split('/').pop();

  if (currentPage === 'admin-dashboard.html') {
    await loadAdminDashboard();
  } else if (currentPage === 'admin-users.html') {
    await loadAdminUsers();
  } else if (currentPage === 'admin-soil.html') {
    await loadAdminSoil();
  }
});

async function loadAdminDashboard() {
  const statsRes = await Auth.apiCall('/admin/stats');
  if (statsRes.success) {
    const s = statsRes.stats;
    document.getElementById('admin-stat-users').innerText = s.total_users || 0;
    document.getElementById('admin-stat-samples').innerText = s.total_samples || 0;
    document.getElementById('admin-stat-healthy').innerText = s.healthy_samples || 0;
    document.getElementById('admin-stat-degraded').innerText = s.degraded_samples || 0;
    document.getElementById('admin-stat-activities').innerText = s.total_activities || 0;
  }

  // Load trends for Admin Charts
  const trendsRes = await Auth.apiCall('/dashboard/trends');
  if (trendsRes.success) {
    const distData = trendsRes.district_degradation || [];
    const canvas = document.getElementById('chart-admin-district');
    if (canvas) {
      new Chart(canvas, {
        type: 'bar',
        data: {
          labels: distData.map(d => d.district),
          datasets: [{
            label: 'Avg Soil Degradation Index',
            data: distData.map(d => d.avg_score),
            backgroundColor: '#2c6e49'
          }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true, max: 100 } } }
      });
    }

    const condData = trendsRes.condition_distribution || [];
    const canvasCond = document.getElementById('chart-admin-condition');
    if (canvasCond) {
      new Chart(canvasCond, {
        type: 'pie',
        data: {
          labels: condData.map(c => c.condition),
          datasets: [{
            data: condData.map(c => c.count),
            backgroundColor: ['#2e7d32', '#8bc34a', '#fbc02d', '#f57c00', '#d32f2f']
          }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
      });
    }
  }
}

/* User Management Functions */
async function loadAdminUsers() {
  const res = await Auth.apiCall('/admin/users');
  if (!res.success) return;

  allUsers = res.users || [];
  renderUsersTable(allUsers);

  document.getElementById('userSearchInput').addEventListener('input', filterUsers);
  document.getElementById('filterRole').addEventListener('change', filterUsers);
  document.getElementById('filterStatus').addEventListener('change', filterUsers);
  document.getElementById('addUserForm').addEventListener('submit', createUser);
}

function filterUsers() {
  const search = document.getElementById('userSearchInput').value.toLowerCase().trim();
  const role = document.getElementById('filterRole').value;
  const status = document.getElementById('filterStatus').value;

  const filtered = allUsers.filter(u => {
    const matchSearch = !search || u.full_name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search) || u.phone.includes(search);
    const matchRole = !role || u.role === role;
    const matchStatus = !status || u.status === status;
    return matchSearch && matchRole && matchStatus;
  });

  renderUsersTable(filtered);
}

function renderUsersTable(users) {
  const tbody = document.getElementById('users-table-body');
  document.getElementById('users-count-badge').innerText = `${users.length} Users`;

  if (users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No users found.</td></tr>`;
    return;
  }

  let html = '';
  users.forEach(u => {
    const roleBadge = u.role === 'admin' ? 'bg-warning text-dark' : 'bg-secondary';
    const statusBadge = u.status === 'active' ? 'bg-success' : 'bg-danger';

    html += `
      <tr>
        <td class="fw-bold">#USR-${u.id}</td>
        <td class="fw-bold">${u.full_name}</td>
        <td>${u.email}</td>
        <td>${u.phone}</td>
        <td><span class="badge ${roleBadge} px-2 py-1">${u.role.toUpperCase()}</span></td>
        <td><span class="badge ${statusBadge} px-2 py-1">${u.status.toUpperCase()}</span></td>
        <td class="small text-muted">${new Date(u.created_at).toLocaleDateString()}</td>
        <td>
          <button onclick="editUserModal(${u.id})" class="btn btn-sm btn-outline-primary me-1"><i class="fas fa-edit"></i> Edit</button>
          <button onclick="deleteUser(${u.id})" class="btn btn-sm btn-outline-danger"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

async function createUser(e) {
  e.preventDefault();
  const alertBox = document.getElementById('add-user-alert');
  alertBox.innerHTML = '';

  const payload = {
    full_name: document.getElementById('new_full_name').value.trim(),
    email: document.getElementById('new_email').value.trim(),
    phone: document.getElementById('new_phone').value.trim(),
    password: document.getElementById('new_password').value,
    role: document.getElementById('new_role').value,
    status: document.getElementById('new_status').value
  };

  const res = await Auth.apiCall('/admin/users', 'POST', payload);
  if (res.success) {
    alertBox.innerHTML = `<div class="alert alert-success"><i class="fas fa-check-circle me-2"></i>User created successfully!</div>`;
    document.getElementById('addUserForm').reset();
    setTimeout(() => {
      const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
      if (modal) modal.hide();
      loadAdminUsers();
    }, 600);
  } else {
    alertBox.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle me-2"></i>${res.message || 'Creation failed.'}</div>`;
  }
}

function editUserModal(id) {
  const user = allUsers.find(u => u.id === id);
  if (!user) return;

  document.getElementById('edit_user_id').value = user.id;
  document.getElementById('edit_full_name').value = user.full_name;
  document.getElementById('edit_email').value = user.email;
  document.getElementById('edit_phone').value = user.phone;
  document.getElementById('edit_role').value = user.role;
  document.getElementById('edit_status').value = user.status;

  const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
  modal.show();
}

async function saveEditUser() {
  const id = document.getElementById('edit_user_id').value;
  const payload = {
    full_name: document.getElementById('edit_full_name').value.trim(),
    email: document.getElementById('edit_email').value.trim(),
    phone: document.getElementById('edit_phone').value.trim(),
    role: document.getElementById('edit_role').value,
    status: document.getElementById('edit_status').value,
    password: document.getElementById('edit_password').value
  };

  const res = await Auth.apiCall(`/admin/users/${id}`, 'PUT', payload);
  if (res.success) {
    const modal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
    if (modal) modal.hide();
    loadAdminUsers();
  } else {
    alert(res.message || 'Failed to update user.');
  }
}

async function deleteUser(id) {
  if (!confirm(`Are you sure you want to delete User #USR-${id}?`)) return;

  const res = await Auth.apiCall(`/admin/users/${id}`, 'DELETE');
  if (res.success) {
    loadAdminUsers();
  } else {
    alert(res.message || 'Failed to delete user.');
  }
}

/* Admin Soil Management Functions */
async function loadAdminSoil() {
  const res = await Auth.apiCall('/admin/soil');
  if (!res.success) return;

  allSoilRecords = res.samples || [];
  renderAdminSoilTable(allSoilRecords);

  document.getElementById('adminSoilSearch').addEventListener('input', filterAdminSoil);
  document.getElementById('adminSoilFilterCond').addEventListener('change', filterAdminSoil);
}

function filterAdminSoil() {
  const search = document.getElementById('adminSoilSearch').value.toLowerCase().trim();
  const cond = document.getElementById('adminSoilFilterCond').value;

  const filtered = allSoilRecords.filter(s => {
    const matchSearch = !search || s.district.toLowerCase().includes(search) || s.village.toLowerCase().includes(search) || (s.farmer_name && s.farmer_name.toLowerCase().includes(search));
    const matchCond = !cond || s.condition.includes(cond);
    return matchSearch && matchCond;
  });

  renderAdminSoilTable(filtered);
}

function renderAdminSoilTable(samples) {
  const tbody = document.getElementById('admin-soil-tbody');
  document.getElementById('admin-soil-count').innerText = `${samples.length} Record(s)`;

  if (samples.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="text-center py-4 text-muted">No soil records found.</td></tr>`;
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
        <td>${s.farmer_name || 'N/A'}</td>
        <td>${s.village}, ${s.district}</td>
        <td>${s.soil_type}</td>
        <td>${s.ph}</td>
        <td>${s.organic_carbon}%</td>
        <td class="fw-bold">${s.degradation_score}</td>
        <td><span class="badge ${badgeClass} px-2 py-1">${s.condition}</span></td>
        <td class="small text-muted">${new Date(s.analysis_date).toLocaleDateString()}</td>
        <td>
          <a href="analysis-result.html?id=${s.id}" class="btn btn-sm btn-outline-success me-1"><i class="fas fa-eye"></i> View</a>
          <button onclick="deleteSoilRecordAdmin(${s.id})" class="btn btn-sm btn-outline-danger"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

async function deleteSoilRecordAdmin(id) {
  if (!confirm(`Are you sure you want to delete Soil Sample #SMP-${id}?`)) return;

  const res = await Auth.apiCall(`/soil/${id}`, 'DELETE');
  if (res.success) {
    loadAdminSoil();
  } else {
    alert(res.message || 'Failed to delete soil record.');
  }
}
