document.addEventListener("DOMContentLoaded", async () => {
    const matchContainer = document.getElementById("match-container");
    const videoList = document.getElementById("videoList");
    const statsContainer = document.getElementById("stats-container");

    // Fetch match details
    async function fetchMatchDetails() {
        try {
            const response = await fetch("/api/matches");
            const matches = await response.json();

            matchContainer.innerHTML = "";
            matches.forEach((match) => {
                const matchDiv = document.createElement("div");
                matchDiv.classList.add("match-item");

                matchDiv.innerHTML = `
                    <h3>${match.homeTeam} vs ${match.awayTeam}</h3>
                    <p>Date: ${new Date(match.date).toLocaleString()}</p>
                    <p>Score: ${match.score || "Not updated yet"}</p>
                `;

                matchContainer.appendChild(matchDiv);
            });
        } catch (error) {
            console.error("Error fetching match details:", error);
        }
    }

    // Fetch videos
    async function fetchVideos() {
        try {
            const response = await fetch("/api/videos");
            const videos = await response.json();

            videoList.innerHTML = "";
            videos.forEach((video) => {
                const videoDiv = document.createElement("div");
                videoDiv.classList.add("video-item");

                // ✅ Corrected path to match "public/uploads/videos/"
                videoDiv.innerHTML = `
                    <h4>${video.title}</h4>
                    <video controls width="320">
                        <source src="/uploads/videos/${video.filename}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                `;

                videoList.appendChild(videoDiv);
            });
        } catch (error) {
            console.error("Error fetching videos:", error);
        }
    }

    // Fetch stats
    async function fetchStats() {
        try {
            const response = await fetch("/api/stats");
            const stats = await response.json();

            statsContainer.innerHTML = "";
            stats.forEach((stat) => {
                const statDiv = document.createElement("div");
                statDiv.classList.add("stat-item");

                statDiv.innerHTML = `
                    <p><strong>${stat.player}</strong> - ${stat.action}</p>
                `;

                statsContainer.appendChild(statDiv);
            });
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    }

    // Initial fetch
    fetchMatchDetails();
    fetchVideos();
    fetchStats();
});
