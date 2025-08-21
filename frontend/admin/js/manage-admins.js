const token = localStorage.getItem('authToken');
if (!token) {
  alert('Unauthorized access! Please login.');
  window.location.href = 'admin-login.html';
}
const API_BASE = "https://inmatch-backend-0csv.onrender.com";
const API_BASE_URL = `${API_BASE}/api/admins`;

const addAdminForm = document.getElementById('addAdminForm');
const adminList = document.getElementById('adminList');
const logoutBtn = document.getElementById('logoutBtn');

async function fetchAdmins() {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error('Failed to fetch admins.');

    const admins = await response.json();
    renderAdminList(admins);
  } catch (error) {
    console.error(error.message);
  }
}

function renderAdminList(admins) {
  adminList.innerHTML = '';
  admins.forEach(admin => {
    const adminItem = document.createElement('div');
    adminItem.classList.add('admin-item');
    adminItem.innerHTML = `
      <span>${admin.name} (${admin.email})</span>
      <button data-id="${admin._id}" class="remove-btn">Remove</button>
    `;
    adminList.appendChild(adminItem);
  });

  document.querySelectorAll('.remove-btn').forEach(button => {
    button.addEventListener('click', handleRemoveAdmin);
  });
}

addAdminForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value; // Get the selected role

  try {
    const response = await fetch(API_BASE_URL + '/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ name, email, password, role }),  // Include role in the body
    });

    if (!response.ok) throw new Error('Failed to add admin.');

    alert('Admin added successfully.');
    addAdminForm.reset();
    fetchAdmins();
  } catch (error) {
    console.error(error.message);
    alert(error.message);
  }
});

async function handleRemoveAdmin(e) {
  const adminId = e.target.getAttribute('data-id');

  try {
    const response = await fetch(`${API_BASE_URL}/${adminId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error('Failed to remove admin.');

    alert('Admin removed successfully.');
    fetchAdmins();
  } catch (error) {
    console.error(error.message);
    alert(error.message);
  }
}

// Logout functionality
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('authToken');
  window.location.href = 'admin-login.html';
});

fetchAdmins();
