document.addEventListener('DOMContentLoaded', async () => {
    const matchInfoContainer = document.getElementById('match-info');
    const matchStatsContainer = document.getElementById('match-stats');
    const matchDetailsForm = document.getElementById('match-details-form');
    const goalDetailsContainer = document.getElementById('goal-details');
    const videoDetailsContainer = document.getElementById('video-details');

    const ballPossessionInput = document.getElementById('ballPossession');
    const shotsOnTargetInput = document.getElementById('shotsOnTarget');
    const cornersInput = document.getElementById('corners');
    const foulsInput = document.getElementById('fouls');

    const addGoalTeam1Btn = document.getElementById('addGoalTeam1');
    const addGoalTeam2Btn = document.getElementById('addGoalTeam2');
    const addVideoBtn = document.getElementById('addVideo');
    const logoutBtn = document.getElementById('logoutBtn');

    const API_BASE = "https://inmatch-backend-0csv.onrender.com";

    addGoalTeam1Btn.addEventListener('click', () => addGoalInput('team1'));
    addGoalTeam2Btn.addEventListener('click', () => addGoalInput('team2'));
    addVideoBtn.addEventListener('click', () => addVideoInput());
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('authToken');
        window.location.href = 'admin-login.html';
    });

    function normalizeVideoPath(value) {
        if (!value) return value;
        const trimmed = value.trim();
        if (/^https?:\/\//i.test(trimmed)) return trimmed;
        if (trimmed.startsWith('/uploads/')) return API_BASE + trimmed;
        return `${API_BASE}/uploads/videos/${trimmed}`;
    }

    function isDirectVideoFile(src) {
        return /\.(mp4|webm|ogg)(\?.*)?$/i.test(src);
    }

    let matchId = new URLSearchParams(window.location.search).get('matchId')
        || localStorage.getItem('currentMatchId')
        || sessionStorage.getItem('currentMatchId');

    if (!matchId) {
        const entered = window.prompt('No match ID provided. Enter a Match ID:');
        if (entered && entered.trim()) {
            matchId = entered.trim();
            localStorage.setItem('currentMatchId', matchId);
            sessionStorage.setItem('currentMatchId', matchId);
            const url = new URL(window.location.href);
            url.searchParams.set('matchId', matchId);
            history.replaceState(null, '', url);
        }
    }

    const API_MATCH_URL = matchId ? `${API_BASE}/api/matches/${matchId}` : null;
    const API_MATCH_DETAILS_URL = matchId ? `${API_BASE}/api/match-details/${matchId}` : null;

    let matchDetailsExist = false;

    // Fetch match overview
    async function fetchMatchOverview() {
        if (!API_MATCH_URL) return;
        try {
            const res = await fetch(API_MATCH_URL);
            if (!res.ok) throw new Error("Failed to fetch match overview");
            const { match } = await res.json();
            matchInfoContainer.innerHTML = 
                `<div>
                    <img src="${match.team1.logo}" alt="${match.team1.name}" width="50">
                    <strong>${match.team1.name}</strong> vs 
                    <strong>${match.team2.name}</strong>
                    <img src="${match.team2.logo}" alt="${match.team2.name}" width="50">
                    <p>Time: ${match.time ? new Date(match.time).toLocaleString() : 'N/A'}</p>
                    <p>Status: ${match.status || 'N/A'}</p>
                    <p>Score: ${match.scoreTeam1 ?? '0'} - ${match.scoreTeam2 ?? '0'}</p>
                </div>`;
        } catch (err) {
            console.error(err);
        }
    }

    // Fetch match details
    async function fetchMatchDetails() {
        if (!API_MATCH_DETAILS_URL) return;
        try {
            const res = await fetch(API_MATCH_DETAILS_URL);
            if (!res.ok) { matchDetailsExist = false; return; }
            const { details } = await res.json();
            matchDetailsExist = true;

            // Stats
            matchStatsContainer.innerHTML = 
                `<h3>Match Statistics</h3>
                <p><strong>Ball Possession:</strong> ${details.stats?.possession || "0 - 0"}</p>
                <p><strong>Shots on Target:</strong> ${details.stats?.shots || "0 - 0"}</p>
                <p><strong>Corners:</strong> ${details.stats?.corners || "0 - 0"}</p>
                <p><strong>Fouls:</strong> ${details.stats?.fouls || "0 - 0"}</p>`;

            // Goals
            const goalsTeam1 = details.goalsDetails?.team1 || [];
            const goalsTeam2 = details.goalsDetails?.team2 || [];
            if (goalsTeam1.length || goalsTeam2.length) {
                matchStatsContainer.innerHTML += `<h3>Goals</h3>`;
                if (goalsTeam1.length) matchStatsContainer.innerHTML += `<p><strong>Team 1:</strong> ${goalsTeam1.map(g => `${g.player} (${g.time})`).join(', ')}</p>`;
                if (goalsTeam2.length) matchStatsContainer.innerHTML += `<p><strong>Team 2:</strong> ${goalsTeam2.map(g => `${g.player} (${g.time})`).join(', ')}</p>`;
            }

            // Videos
            const videos = details.videos || [];
            if (videos.length) {
                matchStatsContainer.innerHTML += `<h3>Match Videos</h3><div id="videos-render"></div>`;
                const videosRender = document.getElementById('videos-render');
                videos.forEach(video => {
                    const src = normalizeVideoPath(video.videoUrl);
                    if (isDirectVideoFile(src)) {
                        videosRender.innerHTML += 
                            `<div>
                                <strong>${video.title || 'Video'}</strong><br>
                                <video src="${src}" width="320" controls></video>
                            </div>`;
                    } else {
                        videosRender.innerHTML += `<div><a href="${src}" target="_blank">${video.title || src}</a></div>`;
                    }
                });
            }

            // Populate form inputs
            ballPossessionInput.value = details.stats?.possession || "";
            shotsOnTargetInput.value = details.stats?.shots || "";
            cornersInput.value = details.stats?.corners || "";
            foulsInput.value = details.stats?.fouls || "";

            goalDetailsContainer.innerHTML = '';
            goalsTeam1.forEach(g => addGoalInput('team1', g.player, g.time));
            goalsTeam2.forEach(g => addGoalInput('team2', g.player, g.time));

            videoDetailsContainer.innerHTML = '';
            videos.forEach(v => addVideoInput(v.title, v.videoUrl));
        } catch (err) {
            console.error(err);
        }
    }

    // Form submit
    matchDetailsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!API_MATCH_DETAILS_URL) { alert("Provide valid Match ID"); return; }

        const updatedStats = {
            possession: ballPossessionInput.value,
            shots: shotsOnTargetInput.value,
            corners: cornersInput.value,
            fouls: foulsInput.value
        };

        const updatedGoalsTeam1 = Array.from(goalDetailsContainer.querySelectorAll('.goal-input.goal-team1'))
            .map(g => ({
                player: g.querySelector('input[placeholder="Player Name"]').value.trim(),
                time: g.querySelector('input[placeholder="Goal Time"]').value.trim()
            })).filter(g => g.player && g.time);

        const updatedGoalsTeam2 = Array.from(goalDetailsContainer.querySelectorAll('.goal-input.goal-team2'))
            .map(g => ({
                player: g.querySelector('input[placeholder="Player Name"]').value.trim(),
                time: g.querySelector('input[placeholder="Goal Time"]').value.trim()
            })).filter(g => g.player && g.time);

        const updatedVideos = [];
        const videoInputs = Array.from(videoDetailsContainer.querySelectorAll('.video-input'));
        for (let vi of videoInputs) {
            const title = vi.querySelector('input[placeholder="Video Title"]').value.trim();
            const urlInput = vi.querySelector('input[placeholder="Video URL"]');
            const fileInput = vi.querySelector('input[type="file"]');
            let videoUrl = urlInput.value.trim();

            if (fileInput && fileInput.files.length) {
                const formData = new FormData();
                formData.append("videoFile", fileInput.files[0]);
                formData.append("matchId", matchId);

                try {
                    const res = await fetch(`${API_BASE}/api/videos/upload`, { 
                        method: "POST", 
                        body: formData 
                    });
                    const data = await res.json();
                    if (data.url) videoUrl = data.url;
                } catch (err) { 
                    console.error("Video upload failed:", err); 
                }
            }

            if (title && videoUrl) updatedVideos.push({ title, videoUrl });
        }

        const payload = {
            stats: updatedStats,
            goalsDetails: { team1: updatedGoalsTeam1, team2: updatedGoalsTeam2 },
            videos: updatedVideos
        };

        try {
            const res = await fetch(API_MATCH_DETAILS_URL, {
                method: matchDetailsExist ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error("Failed to save match details");
            await fetchMatchDetails();
        } catch (err) { console.error(err); }
    });

    // Add goal input
    function addGoalInput(team, player = '', time = '') {
        const div = document.createElement('div');
        div.className = `goal-input goal-${team}`;
        div.innerHTML = 
            `<input type="text" placeholder="Player Name" value="${player}">
            <input type="text" placeholder="Goal Time" value="${time}">
            <button type="button" class="removeGoal">❌</button>`;
        div.querySelector('.removeGoal').addEventListener('click', () => div.remove());
        goalDetailsContainer.appendChild(div);
    }

    // Add video input (with permanent delete)
    function addVideoInput(title = '', url = '') {
        const div = document.createElement('div');
        div.className = "video-input";
        div.innerHTML = 
            `<input type="text" placeholder="Video Title" value="${title}">
            <input type="text" placeholder="Video URL" value="${url}">
            <input type="file" accept="video/*">
            <button type="button" class="removeVideo">❌</button>
            <button type="button" class="deleteVideoFromDB">🗑️ Delete from server</button>`;

        div.querySelector('.removeVideo').addEventListener('click', () => div.remove());

        div.querySelector('.deleteVideoFromDB').addEventListener('click', async () => {
            if (!confirm('Are you sure you want to permanently delete this video?')) return;

            try {
                const res = await fetch(`${API_BASE}/api/videos/delete`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ videoUrl: url, matchId })
                });
                const data = await res.json();
                if (res.ok) {
                    alert('Video deleted permanently!');
                    div.remove();
                    await fetchMatchDetails(); // refresh list from backend
                } else {
                    alert('Delete failed: ' + data.error);
                }
            } catch (err) {
                console.error(err);
                alert('Error deleting video');
            }
        });

        videoDetailsContainer.appendChild(div);
    }

    if (matchId) {
        await fetchMatchOverview();
        await fetchMatchDetails();
    }
});
