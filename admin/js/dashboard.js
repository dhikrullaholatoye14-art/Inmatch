// dashboard.js

document.addEventListener('DOMContentLoaded', async () => {
  const adminName = document.getElementById('adminName');
  const totalAdmins = document.getElementById('totalAdmins');
  const logoutBtn = document.getElementById('logoutBtn');
  const manageAdminsLink = document.getElementById('manageAdminsLink'); // We will add this link for manage-admin
  const superAdminStats = document.getElementById('superAdminStats'); // Stats section for superadmin


  // Get token from localStorage
  const token = localStorage.getItem('authToken');

  if (!token) {
    alert('Unauthorized access! Redirecting to login.');
    window.location.href = 'admin-login.html';
    return;
  }

  try {
    // Fetch logged-in admin details
    const response = await fetch('https://inmatch-backend.onrender.com/api/admins/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const adminDetails = await response.json();

    if (!response.ok) {
      throw new Error(adminDetails.message || 'Failed to fetch admin details');
    }

    // Display logged-in admin name
    adminName.textContent = adminDetails.name;

    // If superadmin, fetch additional stats
    if (adminDetails.role === 'superadmin') {
      superAdminStats.style.display = 'flex';
      const statsResponse = await fetch('https://inmatch-backend.onrender.com/api/admins/stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const statsData = await statsResponse.json();

      if (!statsResponse.ok) {
        throw new Error(statsData.message || 'Failed to fetch stats');
      }

      totalAdmins.textContent = statsData.totalAdmins;

      // Allow superadmin to manage admins
      manageAdminsLink.style.display = 'block'; // Show the "Manage Admins" link for superadmins
    } else {
      // Hide stats and manage link for regular admins
      document.querySelector('.stats-container').style.display = 'none';
      manageAdminsLink.style.display = 'none'; // Hide the "Manage Admins" link for regular admins
      
    }
  } catch (error) {
    console.error('Dashboard error:', error.message);
    alert(`An error occurred: ${error.message}. Redirecting to login.`);
    localStorage.removeItem('authToken');
    window.location.href = 'admin-login.html';
  }

  // Logout functionality
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('authToken');
    window.location.href = 'admin-login.html';
  });
});
