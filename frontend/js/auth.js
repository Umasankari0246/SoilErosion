/**
 * Common Authentication & API Helper Library
 */
const API_BASE = '/api';

const Auth = {
  getToken() {
    return localStorage.getItem('token');
  },

  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  isAdmin() {
    const user = this.getUser();
    return user && user.role === 'admin';
  },

  saveSession(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  async apiCall(endpoint, method = 'GET', body = null) {
    const headers = {
      'Content-Type': 'application/json'
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = { method, headers };
    if (body) {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        if (endpoint !== '/auth/login' && endpoint !== '/auth/register') {
          console.warn('Session expired or unauthorized. Clearing session.');
          this.clearSession();
          window.location.href = '/login.html';
        }
      }

      return data;
    } catch (err) {
      console.error('API Call Error:', err);
      return { success: false, message: 'Network or server connection failed.' };
    }
  },

  updateNavbar() {
    const navLinksContainer = document.getElementById('main-nav-links');
    if (!navLinksContainer) return;

    const user = this.getUser();
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    let html = '';

    if (!user) {
      // Guest Links
      html = `
        <li class="nav-item"><a class="nav-link ${currentPage === 'index.html' ? 'active' : ''}" href="index.html"><i class="fas fa-home me-1"></i>Home</a></li>
        <li class="nav-item"><a class="nav-link ${currentPage === 'soil-map.html' ? 'active' : ''}" href="soil-map.html"><i class="fas fa-map-marked-alt me-1"></i>Soil Map</a></li>
        <li class="nav-item"><a class="nav-link ${currentPage === 'recommendations.html' ? 'active' : ''}" href="recommendations.html"><i class="fas fa-seedling me-1"></i>Recommendations</a></li>
        <li class="nav-item ms-lg-2"><a class="btn btn-outline-light btn-sm me-2" href="login.html">Login</a></li>
        <li class="nav-item"><a class="btn btn-light text-success btn-sm fw-bold" href="register.html">Register</a></li>
      `;
    } else if (user.role === 'admin') {
      // Admin Links
      html = `
        <li class="nav-item"><a class="nav-link ${currentPage === 'admin-dashboard.html' ? 'active' : ''}" href="admin-dashboard.html"><i class="fas fa-tachometer-alt me-1"></i>Admin Dashboard</a></li>
        <li class="nav-item"><a class="nav-link ${currentPage === 'admin-users.html' ? 'active' : ''}" href="admin-users.html"><i class="fas fa-users-cog me-1"></i>Manage Users</a></li>
        <li class="nav-item"><a class="nav-link ${currentPage === 'admin-soil.html' ? 'active' : ''}" href="admin-soil.html"><i class="fas fa-database me-1"></i>Soil Records</a></li>
        <li class="nav-item"><a class="nav-link ${currentPage === 'soil-map.html' ? 'active' : ''}" href="soil-map.html"><i class="fas fa-map-marked-alt me-1"></i>Soil Map</a></li>
        <li class="nav-item"><a class="nav-link ${currentPage === 'reports.html' ? 'active' : ''}" href="reports.html"><i class="fas fa-file-pdf me-1"></i>Reports</a></li>
        <li class="nav-item ms-lg-3 dropdown">
          <a class="nav-link dropdown-toggle text-warning fw-bold" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown">
            <i class="fas fa-user-shield me-1"></i>${user.full_name} (Admin)
          </a>
          <ul class="dropdown-menu dropdown-menu-end">
            <li><a class="dropdown-item" href="dashboard.html"><i class="fas fa-chart-line me-2"></i>User View</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item text-danger" href="#" onclick="Auth.logout()"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
          </ul>
        </li>
      `;
    } else {
      // User Links
      html = `
        <li class="nav-item"><a class="nav-link ${currentPage === 'dashboard.html' ? 'active' : ''}" href="dashboard.html"><i class="fas fa-chart-line me-1"></i>Dashboard</a></li>
        <li class="nav-item"><a class="nav-link ${currentPage === 'soil-analysis.html' ? 'active' : ''}" href="soil-analysis.html"><i class="fas fa-vial me-1"></i>Soil Analysis</a></li>
        <li class="nav-item"><a class="nav-link ${currentPage === 'soil-history.html' ? 'active' : ''}" href="soil-history.html"><i class="fas fa-history me-1"></i>My Records</a></li>
        <li class="nav-item"><a class="nav-link ${currentPage === 'soil-map.html' ? 'active' : ''}" href="soil-map.html"><i class="fas fa-map-marked-alt me-1"></i>Soil Map</a></li>
        <li class="nav-item"><a class="nav-link ${currentPage === 'soil-comparison.html' ? 'active' : ''}" href="soil-comparison.html"><i class="fas fa-balance-scale me-1"></i>Comparison</a></li>
        <li class="nav-item"><a class="nav-link ${currentPage === 'recommendations.html' ? 'active' : ''}" href="recommendations.html"><i class="fas fa-seedling me-1"></i>Recommendations</a></li>
        <li class="nav-item"><a class="nav-link ${currentPage === 'conservation.html' ? 'active' : ''}" href="conservation.html"><i class="fas fa-tasks me-1"></i>Conservation</a></li>
        <li class="nav-item"><a class="nav-link ${currentPage === 'reports.html' ? 'active' : ''}" href="reports.html"><i class="fas fa-file-pdf me-1"></i>Reports</a></li>
        <li class="nav-item ms-lg-2 dropdown">
          <a class="nav-link dropdown-toggle text-white fw-bold" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown">
            <i class="fas fa-user-circle me-1"></i>${user.full_name}
          </a>
          <ul class="dropdown-menu dropdown-menu-end">
            <li><a class="dropdown-item text-danger" href="#" onclick="Auth.logout()"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
          </ul>
        </li>
      `;
    }

    navLinksContainer.innerHTML = html;
  },

  logout() {
    this.clearSession();
    window.location.href = 'login.html';
  },

  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = 'login.html';
    }
  },

  requireAdminAuth() {
    if (!this.isLoggedIn() || !this.isAdmin()) {
      window.location.href = 'login.html';
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Auth.updateNavbar();
});
