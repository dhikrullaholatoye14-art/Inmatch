document.addEventListener("DOMContentLoaded", async () => {
  const matchContainer = document.getElementById("match-container");
  const statsContainer = document.getElementById("stats-container");
  const videoList = document.getElementById("videoList");

  // Add Match
  const addMatchForm = document.getElementById("addMatchForm");
  addMatchForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const homeTeam = document.getElementById("homeTeam").value;
    const awayTeam = document.getElementById("awayTeam").value;
    const matchDate = document.getElementById("matchDate").value; // auto-formatted by <input type="date">
    const venue = document.getElementById("venue").value;

    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeTeam, awayTeam, date: matchDate, venue }),
      });
      if (!res.ok) throw new Error("Failed to add match");
      alert("✅ Match added successfully!");
      addMatchForm.reset();
      loadMatches();
    } catch (err) {
      console.error(err);
      alert("❌ Error adding match");
    }
  });

  // Load Matches
  async function loadMatches() {
    matchContainer.innerHTML = "<p>Loading matches...</p>";
    try {
      const res = await fetch("/api/matches");
      const matches = await res.json();

      matchContainer.innerHTML = matches
        .map(
          (m) => `
          <div class="match-card">
            <p><strong>${m.homeTeam}</strong> vs <strong>${m.awayTeam}</strong></p>
            <p>Date: ${new Date(m.date).toLocaleDateString()}</p>
            <p>Venue: ${m.venue}</p>
          </div>
        `
        )
        .join("");
    } catch (err) {
      matchContainer.innerHTML = "<p>Error loading matches</p>";
    }
  }

  loadMatches();

  // Add Video (either URL or file upload)
  const addVideoForm = document.getElementById("addVideoForm");
  addVideoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("videoTitle").value;
    const url = document.getElementById("videoURL").value;
    const file = document.getElementById("videoFile").files[0];

    if (!url && !file) {
      alert("❌ Please provide a URL or select a file");
      return;
    }

    // If URL provided
    if (url) {
      renderVideo({ title, url });
    }

    // If file provided
    if (file) {
      const fileURL = URL.createObjectURL(file); // temporary path
      renderVideo({ title, url: fileURL });
    }

    addVideoForm.reset();
  });

  function renderVideo(video) {
    const videoElement = `
      <div class="video-card">
        <p>${video.title}</p>
        <video controls width="320">
          <source src="${video.url}" type="video/mp4">
          Your browser does not support video playback.
        </video>
      </div>
    `;
    videoList.innerHTML += videoElement;
  }
});
