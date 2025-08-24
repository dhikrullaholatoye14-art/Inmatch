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
    let isUploading = false;

    function isDirectVideoFile(src) {
        return /\.(mp4|webm|ogg)(\?.*)?$/i.test(src);
    }

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
        } catch (err) { console.error(err); }
    }

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

            const goalsTeam1 = details.goalsDetails?.team1 || [];
            const goalsTeam2 = details.goalsDetails?.team2 || [];
            if (goalsTeam1.length || goalsTeam2.length) {
                matchStatsContainer.innerHTML += `<h3>Goals</h3>`;
                if (goalsTeam1.length) matchStatsContainer.innerHTML += `<p><strong>Team 1:</strong> ${goalsTeam1.map(g => `${g.player} (${g.time})`).join(', ')}</p>`;
                if (goalsTeam2.length) matchStatsContainer.innerHTML += `<p><strong>Team 2:</strong> ${goalsTeam2.map(g => `${g.player} (${g.time})`).join(', ')}</p>`;
            }

            const videos = details.videos || [];
            if (videos.length) {
                matchStatsContainer.innerHTML += `<h3>Match Videos</h3><div id="videos-render"></div>`;
                const videosRender = document.getElementById('videos-render');
                videos.forEach(video => {
                    const src = video.videoUrl;
                    if (!video.isURL) {
                        videosRender.innerHTML += `<div><strong>${video.title}</strong><br>
                            <video width="320" controls>
                                <source src="${API_BASE}/${src}" type="video/mp4">
                                Your browser does not support the video tag.
                            </video></div>`;
                    } else {
                        if (isDirectVideoFile(src)) {
                            videosRender.innerHTML += `<div><strong>${video.title}</strong><br>
                                <video width="320" controls>
                                    <source src="${src}" type="video/mp4">
                                    Your browser does not support the video tag.
                                </video></div>`;
                        } else {
                            videosRender.innerHTML += `<div><a href="${src}" target="_blank">${video.title || src}</a></div>`;
                        }
                    }
                });
            }

            // Populate inputs
            ballPossessionInput.value = details.stats?.possession || "";
            shotsOnTargetInput.value = details.stats?.shots || "";
            cornersInput.value = details.stats?.corners || "";
            foulsInput.value = details.stats?.fouls || "";

            // Goals
            goalDetailsContainer.innerHTML = '';
            goalsTeam1.forEach(g => addGoalInput('team1', g.player, g.time));
            goalsTeam2.forEach(g => addGoalInput('team2', g.player, g.time));

            // Videos
            videoDetailsContainer.innerHTML = '';
            videos.forEach(v => addVideoInput(v.title, v.videoUrl, v._id, v.isURL));
        } catch (err) { console.error(err); }
    }

    matchDetailsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!API_MATCH_DETAILS_URL) { alert("Provide valid Match ID"); return; }
        if (isUploading) { alert("Video uploads in progress, please wait."); return; }

        const updatedStats = {
            possession: ballPossessionInput.value,
            shots: shotsOnTargetInput.value,
            corners: cornersInput.value,
            fouls: foulsInput.value
        };

        const updatedGoalsTeam1 = Array.from(goalDetailsContainer.querySelectorAll('.goal-input.goal-team1'))
            .map(g => ({ player: g.querySelector('input[placeholder="Player Name"]').value.trim(), time: g.querySelector('input[placeholder="Goal Time"]').value.trim() }))
            .filter(g => g.player && g.time);

        const updatedGoalsTeam2 = Array.from(goalDetailsContainer.querySelectorAll('.goal-input.goal-team2'))
            .map(g => ({ player: g.querySelector('input[placeholder="Player Name"]').value.trim(), time: g.querySelector('input[placeholder="Goal Time"]').value.trim() }))
            .filter(g => g.player && g.time);

        const updatedVideos = [];
        const videoInputs = Array.from(videoDetailsContainer.querySelectorAll('.video-input'));

        for (let vi of videoInputs) {
            const title = vi.querySelector('input[placeholder="Video Title"]').value.trim();
            const urlInput = vi.querySelector('input[placeholder="Video URL"]');
            const fileInput = vi.querySelector('input[type="file"]');
            let videoUrl = urlInput.value.trim();
            let videoId = vi.dataset.videoId || '';
            let isURL = true;

            if (fileInput && fileInput.files.length) {
                const file = fileInput.files[0];
                const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
                if (!allowedTypes.includes(file.type)) { alert('Invalid video type.'); continue; }
                isURL = false;

                const formData = new FormData();
                formData.append("video", file);
                formData.append("title", title);
                formData.append("matchId", matchId);

                try {
                    isUploading = true;
                    const progressBar = document.createElement('progress');
                    progressBar.max = 100;
                    progressBar.value = 0;
                    vi.appendChild(progressBar);

                    const xhr = new XMLHttpRequest();
                    xhr.open('POST', `${API_BASE}/api/videos/upload`, true);
                    xhr.upload.onprogress = (e) => { if (e.lengthComputable) progressBar.value = (e.loaded / e.total) * 100; };

                    const uploadPromise = new Promise((resolve, reject) => {
                        xhr.onload = () => {
                            vi.removeChild(progressBar);
                            if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
                            else reject(xhr.responseText);
                        };
                        xhr.onerror = () => reject(xhr.responseText);
                    });

                    xhr.send(formData);
                    const data = await uploadPromise;

                    if (data.video && data.video.videoUrl) {
                        videoUrl = data.video.videoUrl;
                        videoId = data.video._id;
                        vi.dataset.videoId = videoId;
                        urlInput.value = videoUrl;
                    }
                } catch (err) { console.error("Video upload failed:", err); alert("Video upload failed. Check console."); continue; }
                finally { isUploading = false; }
            }

            if (title && videoUrl) updatedVideos.push({ title, videoUrl, ...(videoId && {_id: videoId}), isURL });
        }

        const payload = {
            stats: updatedStats,
            goalsDetails: { team1: updatedGoalsTeam1, team2: updatedGoalsTeam2 },
            videos: updatedVideos
        };

        try {
            console.log('Submitting payload:', payload);
            const res = await fetch(API_MATCH_DETAILS_URL, {
                method: matchDetailsExist ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error("Failed to save match details");
            await fetchMatchDetails();
            alert("Match details saved successfully!");
        } catch (err) {
            console.error(err);
            alert("Error saving match details. Check console.");
        }
    });

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

    function addVideoInput(title = '', url = '', videoId = '', isURL = true) {
        const div = document.createElement('div');
        div.className = "video-input";
        div.dataset.videoId = videoId;
        div.dataset.isURL = isURL;
        div.innerHTML = 
            `<input type="text" placeholder="Video Title" value="${title}">
             <input type="text" placeholder="Video URL" value="${url}">
             <input type="file" name="video" accept="video/mp4,video/webm,video/ogg">
             <button type="button" class="removeVideo">❌</button>
             <button type="button" class="deleteVideoFromDB">🗑️ Delete from interface</button>`;

        div.querySelector('.removeVideo').addEventListener('click', () => div.remove());

        // **Updated Delete Button to just remove from frontend**
        div.querySelector('.deleteVideoFromDB').addEventListener('click', () => {
            if (confirm('Remove this video from the interface?')) div.remove();
        });

        videoDetailsContainer.appendChild(div);
    }

    if (matchId) {
        await fetchMatchOverview();
        await fetchMatchDetails();
    }
});
