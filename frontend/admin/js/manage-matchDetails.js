document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 DOM Loaded. Initializing Match Details Page...");

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
    let matchId = new URLSearchParams(window.location.search).get('matchId');

    if (!matchId) {
        matchId = localStorage.getItem('currentMatchId');
    } else {
        localStorage.setItem('currentMatchId', matchId);
    }

    if (!matchId) {
        console.error("❌ matchId is missing. Cannot proceed.");
        return;
    }

    console.log(`ℹ️ Match ID detected: ${matchId}`);

    const API_MATCH_URL = `${API_BASE}/api/matches/${matchId}`;
    const API_MATCH_DETAILS_URL = `${API_BASE}/api/match-details/${matchId}`;

    let matchDetailsExist = false;

    addGoalTeam1Btn.addEventListener('click', () => addGoalInput('team1'));
    addGoalTeam2Btn.addEventListener('click', () => addGoalInput('team2'));
    addVideoBtn.addEventListener('click', () => addVideoInput());

    // ✅ Normalize local video paths (allow URL, absolute path, relative filename -> /videos/filename)
    function normalizeVideoPath(value) {
        if (!value) return value;
        const trimmed = value.trim();
        if (/^https?:\/\//i.test(trimmed)) return trimmed;      // Full URL
        if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) return trimmed; // Path already
        return `/videos/${trimmed}`; // Treat bare filename as /videos/<file>
    }

    // ✅ Helper to decide if we can inline-play with <video>
    function isDirectVideoFile(src) {
        return /\.(mp4|webm|ogg)(\?.*)?$/i.test(src);
    }

    async function fetchMatchOverview() {
        try {
            const response = await fetch(API_MATCH_URL);
            if (!response.ok) throw new Error('Failed to fetch match overview');

            const { match } = await response.json();
            matchInfoContainer.innerHTML = `
                <div>
                    <img src="${match.team1.logo}" alt="${match.team1.name} Logo" width="50">
                    <strong>${match.team1.name}</strong> vs 
                    <strong>${match.team2.name}</strong>
                    <img src="${match.team2.logo}" alt="${match.team2.name} Logo" width="50">
                    <p>Time: ${match.time ? new Date(match.time).toLocaleString() : 'N/A'}</p>
                    <p>Status: ${match.status || 'N/A'}</p>
                    <p>Score: ${match.scoreTeam1 ?? '0'} - ${match.scoreTeam2 ?? '0'}</p>
                </div>
            `;
        } catch (error) {
            console.error('Error fetching match overview:', error);
        }
    }

    async function fetchMatchDetails() {
        try {
            const response = await fetch(API_MATCH_DETAILS_URL);
            if (!response.ok) {
                matchDetailsExist = false;
                return;
            }

            const { details } = await response.json();
            matchDetailsExist = true;

            matchStatsContainer.innerHTML = `
                <h3>Match Statistics</h3>
                <p><strong>Ball Possession:</strong> ${details.stats?.possession || "0 - 0"}</p>
                <p><strong>Shots on Target:</strong> ${details.stats?.shots || "0 - 0"}</p>
                <p><strong>Corners:</strong> ${details.stats?.corners || "0 - 0"}</p>
                <p><strong>Fouls:</strong> ${details.stats?.fouls || "0 - 0"}</p>
            `;

            // Goals
            const goalsTeam1 = details.goalsDetails?.team1 || [];
            const goalsTeam2 = details.goalsDetails?.team2 || [];
            if (goalsTeam1.length || goalsTeam2.length) {
                matchStatsContainer.innerHTML += `<h3>Goals</h3>`;
                if (goalsTeam1.length) {
                    matchStatsContainer.innerHTML += `<p><strong>Team 1:</strong> ${goalsTeam1.map(goal => `${goal.player} (${goal.time})`).join(', ')}</p>`;
                }
                if (goalsTeam2.length) {
                    matchStatsContainer.innerHTML += `<p><strong>Team 2:</strong> ${goalsTeam2.map(goal => `${goal.player} (${goal.time})`).join(', ')}</p>`;
                }
            }

            // ✅ Videos
            const videos = details.videos || [];
            if (videos.length) {
                matchStatsContainer.innerHTML += `<h3>Match Videos</h3><div id="videos-render"></div>`;
                const videosRender = document.getElementById('videos-render');
                videos.forEach(video => {
                    const src = video.videoUrl || '';
                    if (isDirectVideoFile(src)) {
                        videosRender.innerHTML += `
                            <div>
                                <strong>${video.title || 'Video'}</strong><br>
                                <video src="${src}" width="320" controls></video>
                            </div>
                        `;
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
            goalsTeam1.forEach(goal => addGoalInput('team1', goal.player, goal.time));
            goalsTeam2.forEach(goal => addGoalInput('team2', goal.player, goal.time));

            videoDetailsContainer.innerHTML = '';
            videos.forEach(video => addVideoInput(video.title, video.videoUrl));
        } catch (error) {
            console.error('Error fetching match details:', error);
        }
    }

    matchDetailsForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const updatedStats = {
            possession: ballPossessionInput.value,
            shots: shotsOnTargetInput.value,
            corners: cornersInput.value,
            fouls: foulsInput.value
        };

        // ✅ Normalize video URLs/paths before sending
        const updatedVideos = Array.from(videoDetailsContainer.querySelectorAll('.video-input'))
            .map(video => {
                const title = video.querySelector('input[placeholder="Video Title"]').value.trim();
                const rawUrl = video.querySelector('input[placeholder="Video URL"]').value.trim();
                const videoUrl = normalizeVideoPath(rawUrl);
                return { title, videoUrl };
            })
            .filter(video => video.title && video.videoUrl);

        const updatedGoalsTeam1 = Array.from(goalDetailsContainer.querySelectorAll('.goal-input.goal-team1'))
            .map(goal => ({
                player: goal.querySelector('input[placeholder="Player Name"]').value.trim(),
                time: goal.querySelector('input[placeholder="Goal Time"]').value.trim()
            }))
            .filter(goal => goal.player && goal.time);

        const updatedGoalsTeam2 = Array.from(goalDetailsContainer.querySelectorAll('.goal-input.goal-team2'))
            .map(goal => ({
                player: goal.querySelector('input[placeholder="Player Name"]').value.trim(),
                time: goal.querySelector('input[placeholder="Goal Time"]').value.trim()
            }))
            .filter(goal => goal.player && goal.time);

        const payload = {
            stats: updatedStats,
            videos: updatedVideos,
            goalsDetails: {
                team1: updatedGoalsTeam1,
                team2: updatedGoalsTeam2
            }
        };

        try {
            const response = await fetch(API_MATCH_DETAILS_URL, {
                method: matchDetailsExist ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("Failed to update match details");

            await fetchMatchDetails();
        } catch (error) {
            console.error("❌ Error updating match details:", error);
        }
    });

    function addGoalInput(team, player = '', time = '') {
        const goalInput = document.createElement('div');
        goalInput.className = `goal-input goal-${team}`;
        goalInput.innerHTML = `
            <input type="text" placeholder="Player Name" value="${player}">
            <input type="text" placeholder="Goal Time" value="${time}">
            <button type="button" class="removeGoal">❌</button>
        `;
        goalInput.querySelector('.removeGoal').addEventListener('click', () => goalInput.remove());
        goalDetailsContainer.appendChild(goalInput);
    }

    function addVideoInput(title = '', url = '') {
        const videoInput = document.createElement('div');
        videoInput.className = "video-input";
        videoInput.innerHTML = `
            <input type="text" placeholder="Video Title" value="${title}">
            <input type="text" placeholder="Video URL" value="${url}">
            <button type="button" class="removeVideo">❌</button>
        `;
        videoInput.querySelector('.removeVideo').addEventListener('click', () => videoInput.remove());
        videoDetailsContainer.appendChild(videoInput);
    }

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('authToken');
        window.location.href = 'admin-login.html';
    });

    await fetchMatchOverview();
    await fetchMatchDetails();
});
