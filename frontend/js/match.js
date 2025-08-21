document.addEventListener('DOMContentLoaded', () => {
  const matchesContainer = document.getElementById('matches-container');
  const leagueTitle = document.getElementById('league-name');
  const toTopButton = document.getElementById('to-top-button');
  const themeToggle = document.getElementById('toggle-theme');
  const html = document.documentElement;
  const API_BASE = "https://inmatch-backend-0csv.onrender.com"; // your Render backend URL
  const leagueId = new URLSearchParams(window.location.search).get('leagueId');
  const API_MATCHES = `${API_BASE}/api/matches/league/${leagueId}`;
  const API_LEAGUE = `${API_BASE}/api/leagues/${leagueId}`;

  // Fetch and set league name
  async function fetchLeagueName() {
    try {
      const res = await fetch(API_LEAGUE);
      const league = await res.json();
      leagueTitle.textContent = league.name || 'Match Fixtures';
    } catch (err) {
      console.error('Error loading league:', err);
      leagueTitle.textContent = 'League';
    }
  }

  // Fetch and display matches
  async function fetchMatches() {
    try {
      const res = await fetch(API_MATCHES);
      const matches = await res.json();

      if (!matches || matches.length === 0) {
        matchesContainer.innerHTML = '<p class="text-red-500 text-center">No matches available right now.</p>';
        return;
      }

      matches.forEach(match => {
        const card = document.createElement('div');
        card.className = 'match-card flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer';

        // Add click event to open match details
        card.addEventListener('click', () => {
          window.location.href = `matchdetails.html?matchId=${match._id}`;
        });

        // Determine match status and display type
        let statusHTML = '';
        if (match.status === 'ongoing') {
          statusHTML = `<span class="live-button"><i class="fas fa-tv mr-2"></i>Live</span>`;
        } else if (match.status === 'completed') {
          statusHTML = `<span class="completed-button"><i class="fas fa-flag-checkered mr-2"></i>FT</span>`;
        } else {
          statusHTML = `<span class="upcoming-button"><i class="fas fa-clock mr-2"></i>Upcoming</span>`;
        }

        card.innerHTML = `
          <div class="flex items-center space-x-4">
            <span class="text-gray-600 dark:text-gray-300 flex items-center">
              <i class="fas fa-clock mr-2"></i>
              ${new Date(match.time).toLocaleString()}
            </span>
          </div>

          <div class="flex flex-col items-center text-center space-y-4">
            <div class="flex items-center space-x-2">
              <img src="${match.team1.logo}" alt="${match.team1.name} Logo" class="w-8 h-8">
              <p class="font-semibold text-gray-700 dark:text-gray-300">${match.team1.name}</p>
            </div>
            <div class="flex space-x-2 items-center">
              <div class="text-xl font-bold text-gray-900 dark:text-white">${match.scoreTeam1}</div>
              <span class="text-gray-500">-</span>
              <div class="text-xl font-bold text-gray-900 dark:text-white">${match.scoreTeam2}</div>
            </div>
            <div class="flex items-center space-x-2">
              <img src="${match.team2.logo}" alt="${match.team2.name} Logo" class="w-8 h-8">
              <p class="font-semibold text-gray-700 dark:text-gray-300">${match.team2.name}</p>
            </div>
          </div>

          ${statusHTML}
        `;

        matchesContainer.appendChild(card);
      });

    } catch (err) {
      console.error('Error fetching matches:', err);
      matchesContainer.innerHTML = '<p class="text-red-600 text-center">Failed to fetch match information.</p>';
    }
  }

  // Scroll to top
  window.onscroll = () => {
    toTopButton.classList.toggle("hidden", document.documentElement.scrollTop <= 200);
  };

  window.goToTop = function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Toggle dark mode
  themeToggle.addEventListener('click', () => {
    html.classList.toggle('dark');
    const icon = themeToggle.querySelector('i');
    icon.classList.toggle('fa-moon');
    icon.classList.toggle('fa-sun');
  });

  fetchLeagueName();
  fetchMatches();
});
