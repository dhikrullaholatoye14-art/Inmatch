document.addEventListener("DOMContentLoaded", async () => {
  const matchContainer = document.getElementById("match-container");
  const videoList = document.getElementById("videoList");
  const statsContainer = document.getElementById("stats-container");

  // 🔹 Extract matchId from query string (?id=123)
  const urlParams = new URLSearchParams(window.location.search);
  const matchId = urlParams.get("id");

  if (!matchId) {
    matchContainer.innerHTML = "<p>No match ID provided in URL</p>";
    return;
  }

  // 🔹 Fetch Match Details
  async function fetchMatchDetails() {
    try {
      const res = await fetch(`/api/matchDetails/${matchId}`);
      if (!res.ok) throw new Error(`Failed to fetch match details: ${res.status}`);
      const match = await res.json();

      matchContainer.innerHTML = `
        <h2>${match.homeTeam} vs ${match.awayTeam}</h2>
        <p>Date: ${new Date(match.date).toLocaleString()}</p>
        <p>Score: ${match.homeScore} - ${match.awayScore}</p>
      `;
    } catch (err) {
      console.error("Error fetching match details:", err);
      matchContainer.innerHTML = `<p>Error loading match details</p>`;
    }
  }

  // 🔹 Fetch Videos
  async function fetchVideos() {
    try {
      const res = await fetch(`/api/matchDetails/${matchId}/videos`);
      if (!res.ok) throw new Error(`Failed to fetch videos: ${res.status}`);
      const videos = await res.json();

      videoList.innerHTML = "";
      if (videos.length === 0) {
        videoList.innerHTML = "<p>No videos available</p>";
        return;
      }

      videos.forEach((video) => {
        const li = document.createElement("li");
        li.innerHTML = `<a href="${video.url}" target="_blank">${video.title}</a>`;
        videoList.appendChild(li);
      });
    } catch (err) {
      console.error("Error fetching videos:", err);
      videoList.innerHTML = `<p>Error loading videos</p>`;
    }
  }

  // 🔹 Fetch Stats
  async function fetchStats() {
    try {
      const res = await fetch(`/api/matchDetails/${matchId}/stats`);
      if (!res.ok) throw new Error(`Failed to fetch stats: ${res.status}`);
      const stats = await res.json();

      statsContainer.innerHTML = "";
      if (!stats || Object.keys(stats).length === 0) {
        statsContainer.innerHTML = "<p>No stats available</p>";
        return;
      }

      for (const key in stats) {
        const p = document.createElement("p");
        p.textContent = `${key}: ${stats[key]}`;
        statsContainer.appendChild(p);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
      statsContainer.innerHTML = `<p>Error loading stats</p>`;
    }
  }

  // 🔹 Initial fetch calls
  await fetchMatchDetails();
  await fetchVideos();
  await fetchStats();
});
