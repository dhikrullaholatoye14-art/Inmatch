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

  // ---- Single source of truth for videos shown in the form and preview
  let videosState = [];
  let matchDetailsExist = false;
  let isUploading = false;

  // ---- Helpers
  function isDirectVideoFile(src) {
    return /\.(mp4|webm|ogg)(\?.*)?$/i.test(src);
  }

  function renderVideosPreview() {
    const existingHeader = document.getElementById('videos-preview-header');
    if (existingHeader) existingHeader.remove();

    if (!videosState.length) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'videos-preview-header';
    wrapper.innerHTML = `<h3>Match Videos</h3><div id="videos-render"></div>`;
    matchStatsContainer.appendChild(wrapper);

    const videosRender = document.getElementById('videos-render');
    videosRender.innerHTML = '';

    videosState.forEach(video => {
      const src = video.videoUrl || '';
      if (!video.isURL) {
        // Local uploaded video file -> serve via API_BASE
        videosRender.innerHTML += `
          <div><strong>${video.title || ''}</strong><br>
            <video width="320" controls>
              <source src="${API_BASE}/${src}" type="video/mp4">
              Your browser does not support the video tag.
            </video>
          </div>`;
      } else {
        if (isDirectVideoFile(src)) {
          videosRender.innerHTML += `
            <div><strong>${video.title || ''}</strong><br>
              <video width="320" controls>
                <source src="${src}" type="video/mp4">
                Your browser does not support the video tag.
              </video>
            </div>`;
        } else {
          videosRender.innerHTML += `
            <div><a href="${src}" target="_blank">${video.title || src}</a></div>`;
        }
      }
    });
  }

  function renderVideoInputs() {
    // Clear and rebuild the form inputs based on videosState
    videoDetailsContainer.innerHTML = '';

    videosState.forEach((v, idx) => {
      const div = document.createElement('div');
      div.className = 'video-input';
      div.dataset.index = String(idx);

      div.innerHTML = `
        <input type="text" placeholder="Video Title" value="${v.title || ''}" />
        <input type="text" placeholder="Video URL" value="${v.isURL ? (v.videoUrl || '') : ''}" ${v.isURL ? '' : 'disabled'} />
        <input type="file" name="video" accept="video/mp4,video/webm,video/ogg" ${v.isURL ? '' : ''} />
        <button type="button" class="removeVideo">❌</button>
        <span class="hint" style="font-size:12px;opacity:.8;margin-left:6px;">
          ${v.isURL ? 'URL mode' : 'Uploaded file'}
        </span>
      `;

      // Title change
      const titleInput = div.querySelector('input[placeholder="Video Title"]');
      titleInput.addEventListener('input', (e) => {
        videosState[idx].title = e.target.value;
      });

      // URL change (only for isURL items)
      const urlInput = div.querySelector('input[placeholder="Video URL"]');
      if (v.isURL) {
        urlInput.addEventListener('input', (e) => {
          videosState[idx].videoUrl = e.target.value.trim();
        });
      }

      // File upload handler (if user picks a file, we upload immediately and convert item -> isURL:false)
      const fileInput = div.querySelector('input[type="file"]');
      fileInput.addEventListener('change', async (e) => {
        if (!e.target.files || !e.target.files.length) return;
        const file = e.target.files[0];
        const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
        if (!allowedTypes.includes(file.type)) {
          alert('Invalid video type.');
          e.target.value = '';
          return;
        }

        try {
          isUploading = true;
          const progressBar = document.createElement('progress');
          progressBar.max = 100;
          progressBar.value = 0;
          div.appendChild(progressBar);

          const formData = new FormData();
          formData.append('video', file);
          formData.append('title', videosState[idx].title || file.name);

          const xhr = new XMLHttpRequest();
          xhr.open('POST', `${API_BASE}/api/videos/upload`, true);
          xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) progressBar.value = (ev.loaded / ev.total) * 100;
          };

          const uploadPromise = new Promise((resolve, reject) => {
            xhr.onload = () => {
              div.removeChild(progressBar);
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  resolve(JSON.parse(xhr.responseText));
                } catch (parseErr) {
                  reject('Bad JSON from server');
                }
              } else {
                reject(xhr.responseText);
              }
            };
            xhr.onerror = () => {
              div.removeChild(progressBar);
              reject('Network error during upload');
            };
          });

          xhr.send(formData);
          const data = await uploadPromise;

          if (data && data.video && data.video.videoUrl) {
            // Convert this entry to uploaded-file mode
            videosState[idx] = {
              _id: data.video._id,
              title: data.video.title,
              videoUrl: data.video.videoUrl,
              isURL: false
            };
            // Re-render to reflect state (disables URL input, etc.)
            renderVideoInputs();
            renderVideosPreview();
          } else {
            alert('Upload response missing video data.');
          }
        } catch (err) {
          console.error('Video upload failed:', err);
          alert('Video upload failed. See console for details.');
        } finally {
          isUploading = false;
        }
      });

      // Remove (frontend-only) — immediate removal from state + re-render
      div.querySelector('.removeVideo').addEventListener('click', () => {
        videosState.splice(idx, 1);
        renderVideoInputs();
        renderVideosPreview();
      });

      videoDetailsContainer.appendChild(div);
    });
  }

  // Add new blank video row (defaults to URL mode)
  addVideoBtn.addEventListener('click', () => {
    videosState.push({ title: '', videoUrl: '', isURL: true });
    renderVideoInputs();
  });

  // Auth/logout (unchanged)
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('authToken');
    window.location.href = 'admin-login.html';
  });

  // ---- Match ID bootstrapping
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

      // Goals
      const goalsTeam1 = details.goalsDetails?.team1 || [];
      const goalsTeam2 = details.goalsDetails?.team2 || [];
      if (goalsTeam1.length || goalsTeam2.length) {
        matchStatsContainer.innerHTML += `<h3>Goals</h3>`;
        if (goalsTeam1.length) matchStatsContainer.innerHTML += `<p><strong>Team 1:</strong> ${goalsTeam1.map(g => `${g.player} (${g.time})`).join(', ')}</p>`;
        if (goalsTeam2.length) matchStatsContainer.innerHTML += `<p><strong>Team 2:</strong> ${goalsTeam2.map(g => `${g.player} (${g.time})`).join(', ')}</p>`;
      }

      // Populate inputs
      ballPossessionInput.value = details.stats?.possession || "";
      shotsOnTargetInput.value = details.stats?.shots || "";
      cornersInput.value = details.stats?.corners || "";
      foulsInput.value = details.stats?.fouls || "";

      // Goals form
      goalDetailsContainer.innerHTML = '';
      goalsTeam1.forEach(g => addGoalInput('team1', g.player, g.time));
      goalsTeam2.forEach(g => addGoalInput('team2', g.player, g.time));

      // ---- VIDEOS: hydrate state from server and render
      videosState = Array.isArray(details.videos) ? details.videos.map(v => ({
        _id: v._id, title: v.title, videoUrl: v.videoUrl, isURL: !!v.isURL
      })) : [];

      renderVideoInputs();
      renderVideosPreview();

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

    // Read goals back from form
    const updatedGoalsTeam1 = Array.from(goalDetailsContainer.querySelectorAll('.goal-input.goal-team1'))
      .map(g => ({ player: g.querySelector('input[placeholder="Player Name"]').value.trim(), time: g.querySelector('input[placeholder="Goal Time"]').value.trim() }))
      .filter(g => g.player && g.time);

    const updatedGoalsTeam2 = Array.from(goalDetailsContainer.querySelectorAll('.goal-input.goal-team2'))
      .map(g => ({ player: g.querySelector('input[placeholder="Player Name"]').value.trim(), time: g.querySelector('input[placeholder="Goal Time"]').value.trim() }))
      .filter(g => g.player && g.time);

    // ---- videos: send the authoritative state (no DOM scraping)
    const payload = {
      stats: updatedStats,
      goalsDetails: { team1: updatedGoalsTeam1, team2: updatedGoalsTeam2 },
      videos: videosState.filter(v => v.title && v.videoUrl) // basic guard
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

  // Goals UI
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

  // Initial fetches
  if (matchId) {
    await fetchMatchOverview();
    await fetchMatchDetails();
  }
});
