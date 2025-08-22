document.addEventListener('DOMContentLoaded', () => {
  const leaguesList = document.getElementById('leagues-list');
  const leagueForm = document.getElementById('league-form');
  const formTitle = document.getElementById('form-title');
  const formSubmitBtn = document.getElementById('formSubmitBtn');
  const leagueNameInput = document.getElementById('leagueName');
  const leagueLogoInput = document.getElementById('leagueLogo');

  let isEditing = false;
  let editingLeagueId = null;
  const API_BASE = "https://inmatch-backend-0csv.onrender.com";
  const API_URL = `${API_BASE}/api/leagues`;

  // ✅ Normalize logo path before saving and displaying
  function normalizeLogoPath(value) {
    if (value.startsWith('http')) return value; 
    if (value.startsWith('/images/')) return value;
    return `/images/${value}`; 
  }

  // Fetch and display leagues
  async function fetchLeagues() {
    try {
      const response = await fetch(API_URL);
      const leagues = await response.json();

      leaguesList.innerHTML = leagues.map(league => `
        <div class="league-card">
          <a href="manage-matches.html?leagueId=${league._id}">
            <img src="${normalizeLogoPath(league.logo)}" alt="${league.name}" class="league-logo">
          </a>
          <a href="manage-matches.html?leagueId=${league._id}">
            <h3>${league.name}</h3>
          </a>
          <button class="edit-btn" data-id="${league._id}">Edit</button>
          <button class="delete-btn" data-id="${league._id}">Delete</button>
        </div>
      `).join('');
    } catch (error) {
      console.error('Error fetching leagues:', error);
    }
  }

  // Handle form submission
  leagueForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = leagueNameInput.value.trim();
    let logo = leagueLogoInput.value.trim();

    if (!name || !logo) {
      alert('All fields are required!');
      return;
    }

    logo = normalizeLogoPath(logo); // Normalize before sending to backend

    try {
      if (isEditing) {
        await fetch(`${API_URL}/${editingLeagueId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, logo }),
        });
        alert('League updated successfully!');
      } else {
        await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, logo }),
        });
        alert('League added successfully!');
      }

      leagueForm.reset();
      isEditing = false;
      editingLeagueId = null;
      formTitle.textContent = 'Add New League';
      formSubmitBtn.textContent = 'Add League';
      fetchLeagues();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  });

  // Edit league
  leaguesList.addEventListener('click', (event) => {
    if (event.target.classList.contains('edit-btn')) {
      const leagueId = event.target.dataset.id;

      const leagueCard = event.target.parentElement;
      const leagueName = leagueCard.querySelector('h3').textContent;
      const leagueLogo = leagueCard.querySelector('img').src;

      leagueNameInput.value = leagueName;
      leagueLogoInput.value = leagueLogo;

      isEditing = true;
      editingLeagueId = leagueId;

      formTitle.textContent = 'Edit League';
      formSubmitBtn.textContent = 'Update League';
    }
  });

  // Delete league
  leaguesList.addEventListener('click', async (event) => {
    if (event.target.classList.contains('delete-btn')) {
      const leagueId = event.target.dataset.id;

      if (confirm('Are you sure you want to delete this league?')) {
        try {
          await fetch(`${API_URL}/${leagueId}`, { method: 'DELETE' });
          alert('League deleted successfully!');
          fetchLeagues();
        } catch (error) {
          console.error('Error deleting league:', error);
        }
      }
    }
  });

  // Logout
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('authToken');
    window.location.href = 'admin-login.html';
  });

  fetchLeagues();
});
