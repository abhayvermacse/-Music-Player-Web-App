// =============================
// API BASE URL & ENDPOINTS
// =============================
const BASE_URL = "yaha api id dale";

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const songs = document.getElementById("songs");
const audio = document.getElementById("audio");

// Players UI
const miniPlayer = document.getElementById("miniPlayer");
const fullPlayer = document.getElementById("fullPlayer");
const bgBlur = document.getElementById("bgBlur");

const cover = document.getElementById("cover");
const title = document.getElementById("title");
const artist = document.getElementById("artist");

const fullCover = document.getElementById("fullCover");
const fullTitle = document.getElementById("fullTitle");
const fullArtist = document.getElementById("fullArtist");

// Controls
const playBtn = document.getElementById("play");
const fullPlay = document.getElementById("fullPlay");

const progress = document.getElementById("progress");
const fullProgress = document.getElementById("fullProgress");

const current = document.getElementById("current");
const fullCurrent = document.getElementById("fullCurrent");
const duration = document.getElementById("duration");
const fullDuration = document.getElementById("fullDuration");

const volume = document.getElementById("volume");
const favBtn = document.getElementById("favBtn");

const lyricsPanel = document.getElementById("lyricsPanel");
const lyricsText = document.getElementById("lyricsText");
const recommendedList = document.getElementById("recommendedList");
const favoritesList = document.getElementById("favoritesList");
const loader = document.getElementById("loader");

let playlist = [];
let favorites = [];
let currentIndex = -1;

// =============================
// 1. CATEGORY & MULTI-LANGUAGE LOADER
// =============================
function loadCategory(query, element) {
    if (element) {
        document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
        element.classList.add("active");
    }
    searchSongs(query);
}

// =============================
// 2. SEARCH SONGS
// =============================
searchBtn.onclick = () => searchSongs(searchInput.value);

searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") searchSongs(searchInput.value);
});

async function searchSongs(query) {
    if (!query.trim()) return;

    loader.style.display = "flex";

    try {
        const res = await fetch(`${BASE_URL}/api/search/songs?query=${encodeURIComponent(query)}&limit=100`);
        const json = await res.json();
        
        playlist = json.data?.results || json.data || [];
        displaySongs();
    } catch (err) {
        console.error("Search Error:", err);
        alert("Songs loading failed. Please check internet connection.");
    } finally {
        loader.style.display = "none";
    }
}

function displaySongs() {
    songs.innerHTML = "";

    if (!playlist || playlist.length === 0) {
        songs.innerHTML = "<p style='grid-column: 1/-1; text-align:center;'>No songs found.</p>";
        return;
    }

    playlist.forEach((song, index) => {
        const image = song.image?.[song.image.length - 1]?.url || "https://via.placeholder.com/150";
        const singer = song.artists?.primary?.map(a => a.name).join(", ") || "Unknown Artist";

        songs.innerHTML += `
        <div class="song" onclick="selectAndPlay(${index})">
            <img src="${image}" alt="${song.name}">
            <div class="song-info">
                <h3>${song.name}</h3>
                <p>${singer}</p>
            </div>
        </div>`;
    });
}

// =============================
// SELECT & PLAY SONG
// =============================
async function selectAndPlay(index, isCustomObj = false, songObj = null) {
    if (!isCustomObj) {
        currentIndex = index;
    } else if (songObj) {
        const existingIdx = playlist.findIndex(s => s.id === songObj.id);
        if (existingIdx !== -1) {
            currentIndex = existingIdx;
        } else {
            playlist.push(songObj);
            currentIndex = playlist.length - 1;
        }
    }

    const song = playlist[currentIndex];
    if (!song) return;

    const image = song.image?.[song.image.length - 1]?.url || "https://via.placeholder.com/250";
    const singer = song.artists?.primary?.map(a => a.name).join(", ") || "Unknown Artist";

    cover.src = image;
    title.innerHTML = song.name;
    artist.innerHTML = singer;

    fullCover.src = image;
    fullTitle.innerHTML = song.name;
    fullArtist.innerHTML = singer;

    bgBlur.style.backgroundImage = `url('${image}')`;

    let url = song.downloadUrl?.[song.downloadUrl.length - 1]?.url || "";
    audio.src = url.replace(/\u0004/g, "");
    audio.play();

    updatePlayIcons(true);
    updateFavButtonState();

    miniPlayer.classList.remove("hidden");

    lyricsText.innerHTML = "Click 'Lyrics' button to load.";
    
    // Fetch Recommendations
    fetchSuggestions(song.id);
}

// =============================
// 3. RECOMMENDATIONS (FIXED & WORKING)
// =============================
async function fetchSuggestions(songId) {
    recommendedList.innerHTML = "<p class='empty-msg'><i class='fa-solid fa-spinner fa-spin'></i> Loading recommendations...</p>";
    
    try {
        const res = await fetch(`${BASE_URL}/api/songs/${songId}/suggestions`);
        const json = await res.json();
        
        const suggestions = json.data || [];

        recommendedList.innerHTML = "";
        if (!suggestions || suggestions.length === 0) {
            recommendedList.innerHTML = "<p class='empty-msg'>No recommendations found.</p>";
            return;
        }

        suggestions.forEach(item => {
            const img = item.image?.[item.image.length - 1]?.url || "";
            const singer = item.artists?.primary?.map(a => a.name).join(", ") || "Artist";

            const div = document.createElement("div");
            div.className = "recommended-item";
            
            // Play recommendation song on click
            div.onclick = () => selectAndPlay(-1, true, item);
            
            div.innerHTML = `
                <img src="${img}" alt="${item.name}">
                <div class="rec-info">
                    <h4>${item.name}</h4>
                    <p>${singer}</p>
                </div>
                <button class="rec-play-btn"><i class="fa-solid fa-play"></i></button>
            `;
            recommendedList.appendChild(div);
        });
    } catch (err) {
        console.error("Suggestions Error:", err);
        recommendedList.innerHTML = "<p class='empty-msg'>Could not load suggestions.</p>";
    }
}

// =============================
// 4. FAVORITES MANAGEMENT
// =============================
favBtn.onclick = () => {
    if (currentIndex < 0) return;
    const song = playlist[currentIndex];
    
    const favIndex = favorites.findIndex(f => f.id === song.id);
    if (favIndex > -1) {
        favorites.splice(favIndex, 1);
    } else {
        favorites.push(song);
    }

    updateFavButtonState();
    renderFavorites();
};

function updateFavButtonState() {
    if (currentIndex < 0) return;
    const song = playlist[currentIndex];
    const isFav = favorites.some(f => f.id === song.id);

    favBtn.classList.toggle("active", isFav);
    favBtn.innerHTML = isFav ? '<i class="fa-solid fa-heart"></i>' : '<i class="fa-regular fa-heart"></i>';
}

function renderFavorites() {
    favoritesList.innerHTML = "";
    if (favorites.length === 0) {
        favoritesList.innerHTML = "<p class='empty-msg'>No favorite songs added yet!</p>";
        return;
    }

    favorites.forEach((song) => {
        const img = song.image?.[song.image.length - 1]?.url || "";
        const singer = song.artists?.primary?.map(a => a.name).join(", ") || "Artist";

        const div = document.createElement("div");
        div.className = "recommended-item";
        div.onclick = () => {
            selectAndPlay(-1, true, song);
            document.getElementById("favoritesModal").style.display = "none";
        };
        div.innerHTML = `
            <img src="${img}" alt="${song.name}">
            <div class="rec-info">
                <h4>${song.name}</h4>
                <p>${singer}</p>
            </div>
        `;
        favoritesList.appendChild(div);
    });
}

document.getElementById("openFavModalBtn").onclick = () => {
    renderFavorites();
    document.getElementById("favoritesModal").style.display = "flex";
};

document.getElementById("closeFavModalBtn").onclick = () => {
    document.getElementById("favoritesModal").style.display = "none";
};

// =============================
// 5. LYRICS
// =============================
document.getElementById("lyricsBtn").onclick = async () => {
    if (currentIndex < 0) return;
    const song = playlist[currentIndex];

    lyricsPanel.classList.add("active");
    lyricsText.innerText = "Fetching lyrics...";

    try {
        const res = await fetch(`${BASE_URL}/api/songs/${song.id}`);
        const json = await res.json();
        const songData = json.data?.[0];

        if (songData && songData.hasLyrics === "true" && songData.lyrics) {
            let cleaned = songData.lyrics.replace(/<br\s*\/?>/gi, '\n');
            lyricsText.innerText = cleaned;
        } else if (song.lyrics) {
            lyricsText.innerText = song.lyrics.replace(/<br\s*\/?>/gi, '\n');
        } else {
            lyricsText.innerText = "Lyrics Not Available for this track.";
        }
    } catch (err) {
        console.error("Lyrics Error:", err);
        lyricsText.innerText = "Failed to load lyrics.";
    }
};

document.getElementById("closeLyrics").onclick = () => lyricsPanel.classList.remove("active");

// =============================
// 6. DOWNLOAD (FIXED SAME-TAB BACKGROUND DOWNLOAD)
// =============================
document.querySelectorAll(".download-trigger").forEach(btn => {
    btn.onclick = () => {
        if (currentIndex < 0) return;
        document.getElementById("qualityModal").style.display = "flex";
    };
});

function closeQuality() {
    document.getElementById("qualityModal").style.display = "none";
}

async function downloadSong(quality) {
    const song = playlist[currentIndex];
    if (!song || !song.downloadUrl) return;

    const match = song.downloadUrl.find(item =>
        item.quality.toLowerCase().replace(/\s/g, '') === quality.toLowerCase().replace(/\s/g, '')
    );

    let url = match ? match.url : song.downloadUrl[song.downloadUrl.length - 1].url;
    url = url.replace(/\u0004/g, '');

    closeQuality();
    loader.style.display = "flex";

    try {
        // Direct Blob Download - No target tab or new tab popup
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const cleanName = song.name.replace(/[^a-zA-Z0-9\s]/g, "");
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `${cleanName} - ${quality}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.warn("Direct blob download failed, fallback execution:", error);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${song.name}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } finally {
        loader.style.display = "none";
    }
}

function togglePlay() {
    if (!audio.src) return;

    if (audio.paused) {
        audio.play();
        updatePlayIcons(true);
    } else {
        audio.pause();
        updatePlayIcons(false);
    }
}

function updatePlayIcons(isPlaying) {
    const iconClass = isPlaying ? "fa-solid fa-pause" : "fa-solid fa-play";
    playBtn.innerHTML = `<i class="${iconClass}"></i>`;
    fullPlay.innerHTML = `<i class="${iconClass}"></i>`;
}

playBtn.onclick = togglePlay;
fullPlay.onclick = togglePlay;

document.getElementById("next").onclick = () => playNext();
document.getElementById("fullNext").onclick = () => playNext();

document.getElementById("prev").onclick = () => playPrev();
document.getElementById("fullPrev").onclick = () => playPrev();

function playNext() {
    if (currentIndex + 1 < playlist.length) selectAndPlay(currentIndex + 1);
}

function playPrev() {
    if (currentIndex > 0) selectAndPlay(currentIndex - 1);
}

audio.onended = () => playNext();

// Progress Sync
audio.ontimeupdate = () => {
    if (isNaN(audio.duration)) return;

    progress.max = audio.duration;
    progress.value = audio.currentTime;

    fullProgress.max = audio.duration;
    fullProgress.value = audio.currentTime;

    current.innerHTML = formatTime(audio.currentTime);
    fullCurrent.innerHTML = formatTime(audio.currentTime);

    duration.innerHTML = formatTime(audio.duration);
    fullDuration.innerHTML = formatTime(audio.duration);
};

progress.oninput = () => audio.currentTime = progress.value;
fullProgress.oninput = () => audio.currentTime = fullProgress.value;
volume.oninput = () => audio.volume = volume.value / 100;

function formatTime(sec) {
    if (isNaN(sec)) return "0:00";
    let m = Math.floor(sec / 60);
    let s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// View Toggles
document.getElementById("miniPlayerLeft").onclick = () => fullPlayer.classList.add("active");
document.getElementById("openFullPlayer").onclick = () => fullPlayer.classList.add("active");
document.getElementById("backBtn").onclick = () => fullPlayer.classList.remove("active");


searchSongs("Hindi Hits");