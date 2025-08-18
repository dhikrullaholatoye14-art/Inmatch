document.addEventListener("DOMContentLoaded", async () => {
    const matchContainer = document.getElementById("match-container");
    const videoList = document.getElementById("videoList");
    const statsContainer = document.getElementById("stats-container");

    function isMP4(url) {
        return /\.(mp4|webm|ogg)(\?|#|$)/i.test(url);
    }

    function isYouTube(url) {
        return /(?:youtube\.com\/watch\?v=|youtu\.be\/)/i.test(url);
    }

    function isTwitter(url) {
        return /(?:twitter\.com|x\.com)\//i.test(url);
    }

    function isImage(url) {
        return /\.(png|jpe?g|gif|webp)(\?|#|$)/i.test(url);
    }

    let matchId = new URLSearchParams(window.location.search).get("matchId");
    if (!matchId) {
        matchId = localStorage.getItem("currentMatchId");
    } else {
        localStorage.setItem("currentMatchId", matchId);
    }
    if (!matchId) {
        console.error("❌ matchId missing.");
        return;
    }

    const API_MATCH_URL = `http://localhost:3000/api/matches/${matchId}`;
    const API_MATCH_DETAILS_URL = `http://localhost:3000/api/match-details/${matchId}`;

    try {
        // Fetch match overview
        const matchRes = await fetch(API_MATCH_URL);
        const { match } = await matchRes.json();

        // Fetch match details
        const detailsRes = await fetch(API_MATCH_DETAILS_URL);
        const { details } = await detailsRes.json();

        // Score calculation
        const scoreTeam1 = match.scoreTeam1 ?? details.goalsDetails.team1.length;
        const scoreTeam2 = match.scoreTeam2 ?? details.goalsDetails.team2.length;

        // Build match info
        matchContainer.innerHTML = `
          <div class="match-header">
            <h2>${match.competition || 'Match Details'}</h2>
            <div class="date-time">
              <p>${match.time ? new Date(match.time).toLocaleString() : 'N/A'}</p>
              <p>${match.venue || ''}</p>
            </div>
          </div>
          <div class="team-score">
            <div class="team">
              <img src="${match.team1.logo}" alt="${match.team1.name}">
              <h3>${match.team1.name}</h3>
            </div>
            <div class="score">${scoreTeam1}</div>
            <div class="score divider">-</div>
            <div class="score">${scoreTeam2}</div>
            <div class="team">
              <img src="${match.team2.logo}" alt="${match.team2.name}">
              <h3>${match.team2.name}</h3>
            </div>
          </div>
          <div class="details">
            <h4>${match.status || 'Scheduled'}</h4>
            <div class="team-details">
              <div>${details.goalsDetails.team1.map(g => `<span>${g.player} ${g.time}'</span>`).join('')}</div>
              <div>${details.goalsDetails.team2.map(g => `<span>${g.player} ${g.time}'</span>`).join('')}</div>
            </div>
          </div>
        `;

        // Build video list
        videoList.innerHTML = details.videos.map(video => {
            let content = '';

            if (isMP4(video.videoUrl)) {
                content = `
                    <video controls style="width:100%; height:auto;" onended="returnToIcon(this)">
                        <source src="${video.videoUrl}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                `;
            }
            else if (isYouTube(video.videoUrl)) {
                const ytId = video.videoUrl.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)[1];
                content = `
                    <iframe width="100%" height="315" src="https://www.youtube.com/embed/${ytId}" frameborder="0" allowfullscreen></iframe>
                `;
            }
            else if (isTwitter(video.videoUrl)) {
                content = `
                    <blockquote class="twitter-tweet">
                        <a href="${video.videoUrl}"></a>
                    </blockquote>
                `;
                setTimeout(() => {
                    if (!window.twttr) {
                        const s = document.createElement('script');
                        s.src = "https://platform.twitter.com/widgets.js";
                        s.async = true;
                        document.head.appendChild(s);
                    } else {
                        window.twttr.widgets.load();
                    }
                }, 100);
            }
            else if (isImage(video.videoUrl)) {
                content = `<img src="${video.videoUrl}" alt="${video.title}" style="max-width:100%; height:auto;">`;
            }
            else {
                content = `
                    <video controls style="width:100%; height:auto;" onended="returnToIcon(this)">
                        <source src="${video.videoUrl}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                `;
            }

            return `
                <div class="video-container" onclick="showContent(this)">
                    <i class="fas fa-play-circle play-icon"></i>
                    <div class="video-title">${video.title}</div>
                </div>
                <div class="video-content" style="display:none;">
                    ${content}
                </div>
            `;
        }).join('');

        // Build stats
        statsContainer.innerHTML = `
          <div class="stat-item font-semibold text-center">
            ${match.team1.name} ${details.stats.possessionTeam1 || details.stats.possession} - ${details.stats.possessionTeam2 || ''} ${match.team2.name}
          </div>
          <div class="stat-item"><div>Possession</div><div>${details.stats.possession}</div></div>
          <div class="stat-item"><div>Shots</div><div>${details.stats.shots}</div></div>
          <div class="stat-item"><div>Fouls</div><div>${details.stats.fouls}</div></div>
          <div class="stat-item"><div>Corners</div><div>${details.stats.corners}</div></div>
        `;

    } catch (err) {
        console.error("Error loading match details:", err);
    }
});

// Video toggle functions
let currentlyPlaying = null;
function showContent(el) {
    const content = el.nextElementSibling;
    const icon = el.querySelector('.play-icon');

    if (currentlyPlaying && currentlyPlaying !== content) {
        currentlyPlaying.style.display = 'none';
        currentlyPlaying.previousElementSibling.querySelector('.play-icon').style.display = 'inline-block';
    }

    if (content.style.display === 'block') {
        content.style.display = 'none';
        icon.style.display = 'inline-block';
        currentlyPlaying = null;
    } else {
        content.style.display = 'block';
        icon.style.display = 'none';
        currentlyPlaying = content;
    }
}

function returnToIcon(video) {
    const content = video.parentElement;
    const icon = content.previousElementSibling.querySelector('.play-icon');
    content.style.display = 'none';
    icon.style.display = 'inline-block';
}
