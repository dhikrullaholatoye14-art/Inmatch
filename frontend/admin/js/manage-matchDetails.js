document.addEventListener("DOMContentLoaded", async () => {
    const matchContainer = document.getElementById("match-container");
    const videoList = document.getElementById("videoList");
    const statsContainer = document.getElementById("stats-container");

    // Fetch match details
    async function fetchMatchDetails() {
        try {
            const response = await fetch("/api/matchDetails");
            const data = await response.json();

            if (data.success) {
                renderMatchDetails(data.matchDetails);
                renderVideos(data.matchDetails.videos || []);
                renderStats(data.matchDetails.stats || []);
            } else {
                console.error("Error fetching match details:", data.message);
            }
        } catch (error) {
            console.error("Error fetching match details:", error);
        }
    }

    // Render match details
    function renderMatchDetails(details) {
        matchContainer.innerHTML = `
            <h2>${details.teamA} vs ${details.teamB}</h2>
            <p>Date: ${new Date(details.date).toLocaleString()}</p>
            <p>Score: ${details.scoreA} - ${details.scoreB}</p>
        `;
    }

    // Render videos
    function renderVideos(videos) {
        videoList.innerHTML = "";
        videos.forEach((video, index) => {
            const li = document.createElement("li");

            if (video.type === "url") {
                li.innerHTML = `
                    <a href="${video.link}" target="_blank">${video.link}</a>
                    <button data-index="${index}" class="delete-video">Delete</button>
                `;
            } else if (video.type === "file") {
                li.innerHTML = `
                    <video width="320" height="240" controls>
                        <source src="${video.link}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                    <button data-index="${index}" class="delete-video">Delete</button>
                `;
            }

            videoList.appendChild(li);
        });

        // Add delete functionality
        document.querySelectorAll(".delete-video").forEach((btn) => {
            btn.addEventListener("click", async (e) => {
                const index = e.target.dataset.index;
                await deleteVideo(index);
            });
        });
    }

    // Render stats
    function renderStats(stats) {
        statsContainer.innerHTML = "";
        stats.forEach((stat) => {
            const p = document.createElement("p");
            p.textContent = `${stat.player}: ${stat.detail}`;
            statsContainer.appendChild(p);
        });
    }

    // Add video handler
    document.getElementById("addVideoForm").addEventListener("submit", async (e) => {
        e.preventDefault();

        const videoFile = document.getElementById("videoFile").files[0];
        const videoUrl = document.getElementById("videoUrl").value.trim();

        if (!videoFile && !videoUrl) {
            alert("Please select a file or enter a URL");
            return;
        }

        const formData = new FormData();

        if (videoFile) {
            formData.append("videoFile", videoFile);
            formData.append("type", "file");
        } else if (videoUrl) {
            formData.append("videoUrl", videoUrl);
            formData.append("type", "url");
        }

        try {
            const response = await fetch("/api/matchDetails/videos", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            if (data.success) {
                renderVideos(data.videos);
                document.getElementById("addVideoForm").reset();
            } else {
                alert("Error adding video: " + data.message);
            }
        } catch (error) {
            console.error("Error uploading video:", error);
        }
    });

    // Delete video
    async function deleteVideo(index) {
        try {
            const response = await fetch(`/api/matchDetails/videos/${index}`, {
                method: "DELETE",
            });
            const data = await response.json();

            if (data.success) {
                renderVideos(data.videos);
            } else {
                alert("Error deleting video: " + data.message);
            }
        } catch (error) {
            console.error("Error deleting video:", error);
        }
    }

    // Initialize
    fetchMatchDetails();
});
