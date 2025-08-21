document.addEventListener('DOMContentLoaded', () => {
  const matchesList = document.getElementById('matches-list');
  const matchForm = document.getElementById('match-form');
  const formTitle = document.getElementById('form-title');
  const formSubmitBtn = document.getElementById('formSubmitBtn');
  const team1NameInput = document.getElementById('team1Name');
  const team1LogoInput = document.getElementById('team1Logo');
  const team2NameInput = document.getElementById('team2Name');
  const team2LogoInput = document.getElementById('team2Logo');
  const matchTimeInput = document.getElementById('matchTime');
  const scoreTeam1Input = document.getElementById('scoreTeam1');
  const scoreTeam2Input = document.getElementById('scoreTeam2');
  const matchStatusSelect = document.getElementById('matchStatus');

  const statuses = ['upcoming', 'ongoing', 'completed'];

  let isEditing = false;
  let editingMatchId = null;
  const API_BASE = "https://inmatch-backend-0csv.onrender.com";
  const leagueId = new URLSearchParams(window.location.search).get('leagueId');
  const API_URL = `${API_BASE}/api/matches`;

  // Populate the match status dropdown
  function populateMatchStatusDropdown() {
    matchStatusSelect.innerHTML = statuses
      .map((status) => `<option value="${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</option>`)
      .join('');
  }

  // Fetch and display matches for the league
  async function fetchMatches() {
    try {
      const response = await fetch(`${API_URL}/league/${leagueId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }

      const matches = await response.json();

      matchesList.innerHTML = matches
        .map(
          (match) => `
          <div class="match-card">
            <div class="team">
              <img src="${match.team1.logo}" alt="${match.team1.name}" class="team-logo clickable" data-match-id="${match._id}">
              <p class="clickable" data-match-id="${match._id}">${match.team1.name}</p>
            </div>
            <div class="vs">VS</div>
            <div class="team">
              <img src="${match.team2.logo}" alt="${match.team2.name}" class="team-logo clickable" data-match-id="${match._id}">
              <p class="clickable" data-match-id="${match._id}">${match.team2.name}</p>
            </div>
            <p class="match-time">Time: ${new Date(match.time).toLocaleString()}</p>
            <p class="match-status">Status: ${match.status}</p>
            <p class="match-score">Score: ${match.scoreTeam1} - ${match.scoreTeam2}</p>
            <button class="edit-btn" data-id="${match._id}">Edit</button>
            <button class="delete-btn" data-id="${match._id}">Delete</button>
          </div>
        `
        )
        .join('');

      addMatchDetailsLink();
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  }

  // Add functionality to navigate to match details page
  function addMatchDetailsLink() {
    const clickableElements = document.querySelectorAll('.clickable');
    clickableElements.forEach((element) => {
      element.addEventListener('click', (event) => {
        const matchId = event.target.dataset.matchId;
        window.location.href = `manage-matchDetails.html?matchId=${matchId}`;
      });
    });
  }

  // Handle form submission
  matchForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const team1 = { name: team1NameInput.value.trim(), logo: team1LogoInput.value.trim() };
    const team2 = { name: team2NameInput.value.trim(), logo: team2LogoInput.value.trim() };
    const time = matchTimeInput.value;
    const status = matchStatusSelect.value;
    const scoreTeam1 = parseInt(scoreTeam1Input.value, 10) || 0;
    const scoreTeam2 = parseInt(scoreTeam2Input.value, 10) || 0;

    if (!team1.name || !team1.logo || !team2.name || !team2.logo || !time || !status) {
      alert('All fields are required!');
      return;
    }

    const matchData = { league: leagueId, team1, team2, time, status, scoreTeam1, scoreTeam2 };

    try {
      if (isEditing) {
        await fetch(`${API_URL}/${editingMatchId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(matchData),
        });
        alert('Match updated successfully!');
      } else {
        await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(matchData),
        });
        alert('Match added successfully!');
      }

      matchForm.reset();
      isEditing = false;
      editingMatchId = null;
      formTitle.textContent = 'Add New Match';
      formSubmitBtn.textContent = 'Add Match';
      fetchMatches();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  });

  // Edit match
  matchesList.addEventListener('click', (event) => {
    if (event.target.classList.contains('edit-btn')) {
      const matchCard = event.target.closest('.match-card');

      const team1Name = matchCard.querySelector('.team:first-child p')?.textContent || '';
      const team1Logo = matchCard.querySelector('.team:first-child img')?.src || '';
      const team2Name = matchCard.querySelector('.team:nth-of-type(3) p')?.textContent || '';
      const team2Logo = matchCard.querySelector('.team:nth-of-type(3) img')?.src || '';

      const matchTime = new Date(matchCard.querySelector('.match-time').textContent.split(': ')[1])
        .toISOString()
        .slice(0, 16);
      const [scoreTeam1, scoreTeam2] = matchCard
        .querySelector('.match-score')
        .textContent.split(': ')[1]
        .split(' - ');

      team1NameInput.value = team1Name;
      team1LogoInput.value = team1Logo;
      team2NameInput.value = team2Name;
      team2LogoInput.value = team2Logo;
      matchTimeInput.value = matchTime;
      scoreTeam1Input.value = scoreTeam1;
      scoreTeam2Input.value = scoreTeam2;

      isEditing = true;
      editingMatchId = event.target.dataset.id;

      formTitle.textContent = 'Edit Match';
      formSubmitBtn.textContent = 'Update Match';
    }
  });

  // Delete match
  matchesList.addEventListener('click', async (event) => {
    if (event.target.classList.contains('delete-btn')) {
      const matchId = event.target.dataset.id;

      if (confirm('Are you sure you want to delete this match?')) {
        try {
          const response = await fetch(`${API_URL}/${matchId}`, { method: 'DELETE' });

          if (!response.ok) {
            alert('Error: Could not delete the match. Please try again.');
            return;
          }

          alert('Match deleted successfully!');
          fetchMatches();
        } catch (error) {
          console.error('Error deleting match:', error);
        }
      }
    }
  });

  // Logout functionality
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('authToken');
    window.location.href = 'admin-login.html';
  });

  populateMatchStatusDropdown();
  fetchMatches();
});
