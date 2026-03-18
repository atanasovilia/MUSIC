// ============================================================
//  CANVAS PARTICLE SYSTEM
// ============================================================
const canvas = document.getElementById('bgCanvas');
const ctx    = canvas.getContext('2d');

const PARTICLES = [];
const SYMBOLS = ['♩','♪','♫','♬','★','·','·','·','·'];

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

for (let i = 0; i < 80; i++) {
  PARTICLES.push({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 0.25,
    vy: -Math.random() * 0.4 - 0.1,
    alpha: Math.random() * 0.4 + 0.05,
    size: Math.random() * 11 + 7,
    symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    pulse: Math.random() * Math.PI * 2,
    pulseSpeed: 0.01 + Math.random() * 0.02,
    color: ['#7c5cbf','#4ecdc4','#f0b429','#e86aba','#a67fff'][Math.floor(Math.random()*5)],
  });
}

function animateCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  PARTICLES.forEach(p => {
    p.x  += p.vx;
    p.y  += p.vy;
    p.pulse += p.pulseSpeed;
    const a = p.alpha * (0.6 + 0.4 * Math.sin(p.pulse));
    if (p.y < -20) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
    if (p.x < -20) p.x = canvas.width + 10;
    if (p.x > canvas.width + 20) p.x = -10;
    ctx.globalAlpha = a;
    ctx.fillStyle   = p.color;
    ctx.font        = `${p.size}px serif`;
    ctx.fillText(p.symbol, p.x, p.y);
  });
  ctx.globalAlpha = 1;
  requestAnimationFrame(animateCanvas);
}
animateCanvas();

// ============================================================
//  APP STATE
// ============================================================
const STATE_KEY   = 'lofi_state_v2';
const CLIENT_KEY  = 'lofi_spotify_client';
const TOKEN_KEY   = 'lofi_access_token';
const EXPIRY_KEY  = 'lofi_token_expiry';
const REFRESH_KEY = 'lofi_refresh_token';
const VERIFIER_KEY= 'lofi_pkce_verifier';
const SESSION_KEY = 'lofi_session';
const DEMO_KEY    = 'lofi_demo_mode';
const PROD_SPOTIFY_REDIRECT_URI = 'https://musicdistro.vercel.app';

// Cross-tab sync
let bc;
try { bc = new BroadcastChannel('lofi_together'); } catch(e) {}

function getSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) { id = Math.random().toString(36).slice(2,10); sessionStorage.setItem(SESSION_KEY, id); }
  return id;
}

function getState() {
  try { return JSON.parse(localStorage.getItem(STATE_KEY)) || { queue:[], nowPlaying:null }; }
  catch { return { queue:[], nowPlaying:null }; }
}

function saveState(state) {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
  if (bc) bc.postMessage({ type:'state', state });
  renderAll();
}

// ============================================================
//  PKCE UTILS
// ============================================================
function genVerifier(len=96) {
  const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const buf=new Uint8Array(len); crypto.getRandomValues(buf);
  return Array.from(buf).map(b=>chars[b%chars.length]).join('');
}

async function genChallenge(v) {
  const data=new TextEncoder().encode(v);
  const hash=await crypto.subtle.digest('SHA-256',data);
  return btoa(String.fromCharCode(...new Uint8Array(hash))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
}

// ============================================================
//  AUTH FLOW
// ============================================================
function getRedirectUri() {
  // On Vercel, force one canonical callback to avoid preview/alias mismatches.
  if (window.location.hostname.endsWith('.vercel.app')) {
    return PROD_SPOTIFY_REDIRECT_URI;
  }
  return window.location.origin.replace(/\/$/, '');
}

async function initiateAuth() {
  const clientId = localStorage.getItem(CLIENT_KEY);
  if (!clientId) { showSetup(); return; }
  const v = genVerifier();
  const c = await genChallenge(v);
  localStorage.setItem(VERIFIER_KEY, v);
  const p = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: 'user-read-private user-read-email',
    redirect_uri: getRedirectUri(),
    code_challenge_method: 'S256',
    code_challenge: c,
  });
  window.location = 'https://accounts.spotify.com/authorize?' + p.toString();
}

async function exchangeToken(code) {
  const clientId = localStorage.getItem(CLIENT_KEY);
  const verifier = localStorage.getItem(VERIFIER_KEY);
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: getRedirectUri(),
      client_id: clientId,
      code_verifier: verifier,
    }),
  });
  const data = await res.json();
  if (data.access_token) {
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(EXPIRY_KEY, Date.now() + data.expires_in * 1000);
    if (data.refresh_token) localStorage.setItem(REFRESH_KEY, data.refresh_token);
    return data.access_token;
  }
  return null;
}

async function refreshToken() {
  const rt = localStorage.getItem(REFRESH_KEY);
  const clientId = localStorage.getItem(CLIENT_KEY);
  if (!rt || !clientId) return null;
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: rt,
      client_id: clientId,
    }),
  });
  const data = await res.json();
  if (data.access_token) {
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(EXPIRY_KEY, Date.now() + data.expires_in * 1000);
    return data.access_token;
  }
  return null;
}

async function getToken() {
  const expiry = parseInt(localStorage.getItem(EXPIRY_KEY) || '0');
  let token = localStorage.getItem(TOKEN_KEY);
  if (token && Date.now() < expiry - 60000) return token;
  return await refreshToken();
}

// ============================================================
//  SPOTIFY API
// ============================================================
async function searchTracks(query) {
  const token = await getToken();
  if (!token) return null;
  const r = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=6`, {
    headers: { Authorization: 'Bearer ' + token }
  });
  if (!r.ok) return null;
  const d = await r.json();
  return d.tracks?.items || [];
}

// ============================================================
//  QUEUE MANAGEMENT
// ============================================================
function addTrack(track) {
  const state = getState();
  if (state.queue.length >= 3) { showToast('Queue is full! Wait for a song to play 🎵'); return false; }
  if (state.queue.find(t => t.id === track.id)) { showToast('That song is already in the queue!'); return false; }
  const sid = getSessionId();
  state.queue.push({
    id: track.id,
    name: track.name,
    artist: track.artists[0].name,
    image: track.album?.images?.[1]?.url || track.album?.images?.[0]?.url || '',
    votes: 0,
    voters: [],
    addedBy: sid,
    addedAt: Date.now(),
  });
  saveState(state);
  showToast('Song added to queue! 🎶');
  return true;
}

function vote(trackId) {
  const state = getState();
  const track = state.queue.find(t => t.id === trackId);
  if (!track) return;
  const sid = getSessionId();
  if (track.voters.includes(sid)) {
    track.votes--;
    track.voters = track.voters.filter(v => v !== sid);
    showToast('Vote removed');
  } else {
    track.votes++;
    track.voters.push(sid);
    showToast('Voted! 🗳');
  }
  saveState(state);
}

function playTopSong() {
  const state = getState();
  if (!state.queue.length) return;
  state.queue.sort((a, b) => b.votes - a.votes);
  const top = state.queue[0];
  state.nowPlaying = top;
  state.queue = state.queue.filter(t => t.id !== top.id);
  saveState(state);
  showToast('Now playing: ' + top.name + ' ✨');
}

// ============================================================
//  RENDER
// ============================================================
function renderAll() {
  renderNowPlaying();
  renderQueue();
}

function renderNowPlaying() {
  const state = getState();
  const wrap = document.getElementById('nowPlayingWrap');
  const np = state.nowPlaying;
  if (!np) {
    wrap.innerHTML = `<div class="no-playing">
      <div class="no-playing-icon">🎵</div>
      <p>Nothing playing yet.<br><strong>Vote for a song</strong> or add one to the queue!</p>
    </div>`;
  } else {
    // Use Spotify iframe embed (works without auth, auto-plays preview or full for premium)
    wrap.innerHTML = `<iframe
      src="https://open.spotify.com/embed/track/${np.id}?utm_source=generator&theme=0"
      width="100%" height="152"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy">
    </iframe>`;
  }
}

function renderQueue() {
  const state = getState();
  const list  = document.getElementById('songList');
  const countEl = document.getElementById('queueCount');
  const playBtn  = document.getElementById('playTopBtn');
  const suggestBtn = document.getElementById('suggestBtn');
  const sid = getSessionId();

  countEl.textContent = `${state.queue.length} / 3 songs`;
  playBtn.disabled = state.queue.length === 0;
  suggestBtn.disabled = state.queue.length >= 3;

  if (!state.queue.length) {
    list.innerHTML = `<div class="empty-queue">
      <div class="icon">🎧</div>
      <p>No songs in the queue yet.<br>Suggest one to get the vibes going!</p>
    </div>`;
    return;
  }

  const sorted = [...state.queue].sort((a,b) => b.votes - a.votes);
  const maxVotes = sorted[0]?.votes || 0;

  list.innerHTML = sorted.map((track, i) => {
    const hasVoted = track.voters.includes(sid);
    const barWidth = maxVotes > 0 ? (track.votes / maxVotes * 100) : 0;
    const isTop = i === 0 && track.votes > 0;
    const img = track.image
      ? `<img class="song-art" src="${track.image}" alt="${track.name}" onerror="this.style.display='none';this.nextSibling.style.display='flex'">
         <div class="song-art-placeholder" style="display:none">🎵</div>`
      : `<div class="song-art-placeholder">🎵</div>`;

    return `<div class="song-card ${isTop ? 'top-voted' : ''}" id="card-${track.id}">
      <div class="song-rank">${i === 0 ? '👑' : '#' + (i+1)}</div>
      ${img}
      <div class="song-info">
        <div class="song-name">${esc(track.name)}</div>
        <div class="song-artist">${esc(track.artist)}</div>
        <div class="song-suggested">${track.votes} vote${track.votes !== 1 ? 's' : ''}</div>
      </div>
      <button class="vote-btn ${hasVoted ? 'voted' : ''}" onclick="vote('${track.id}')">
        <div class="vote-icon">${hasVoted ? '💜' : '🤍'}</div>
        <div class="vote-count">${track.votes}</div>
      </button>
      <div class="vote-bar" style="width:${barWidth}%"></div>
    </div>`;
  }).join('');
}

// ============================================================
//  SEARCH
// ============================================================
async function doSearch() {
  const q = document.getElementById('searchInput').value.trim();
  if (!q) return;
  const resultsEl = document.getElementById('searchResults');
  const demoMode = localStorage.getItem(DEMO_KEY) === '1';

  if (demoMode) {
    renderDemoResults(q);
    return;
  }

  resultsEl.innerHTML = '<div class="search-status"><div class="spinner"></div></div>';
  const tracks = await searchTracks(q);

  if (!tracks) {
    resultsEl.innerHTML = '<div class="search-status">⚠️ Search failed — check your Spotify connection</div>';
    return;
  }

  if (!tracks.length) {
    resultsEl.innerHTML = '<div class="search-status">No results found. Try a different search.</div>';
    return;
  }

  renderSearchResults(tracks);
}

function renderSearchResults(tracks) {
  const state = getState();
  const inQueue = state.queue.map(t => t.id);
  document.getElementById('searchResults').innerHTML = tracks.map(t => {
    const already = inQueue.includes(t.id);
    const img = t.album?.images?.[2]?.url || t.album?.images?.[0]?.url || '';
    return `<div class="search-result-item ${already ? 'already-added' : ''}"
              onclick="${already ? '' : `addFromSearch('${t.id}','${esc2(t.name)}','${esc2(t.artists[0].name)}','${img}')`}">
      <img class="result-art" src="${img}" onerror="this.src=''" />
      <div class="result-info">
        <div class="result-name">${esc(t.name)}</div>
        <div class="result-artist">${esc(t.artists[0].name)}</div>
      </div>
      <div class="result-add">${already ? 'Added' : '+ Add'}</div>
    </div>`;
  }).join('');
}

// Cache for search results (needed because we stringify for onclick)
let _searchCache = {};

async function doSearchAndCache() {
  const q = document.getElementById('searchInput').value.trim();
  if (!q) return;
  const resultsEl = document.getElementById('searchResults');
  resultsEl.innerHTML = '<div class="search-status"><div class="spinner"></div></div>';
  const tracks = await searchTracks(q);
  if (!tracks) { resultsEl.innerHTML = '<div class="search-status">⚠️ Search failed</div>'; return; }
  if (!tracks.length) { resultsEl.innerHTML = '<div class="search-status">No results found.</div>'; return; }
  _searchCache = {};
  tracks.forEach(t => { _searchCache[t.id] = t; });
  const state = getState();
  const inQueue = state.queue.map(t => t.id);
  resultsEl.innerHTML = tracks.map(t => {
    const already = inQueue.includes(t.id);
    const img = t.album?.images?.[2]?.url || t.album?.images?.[0]?.url || '';
    return `<div class="search-result-item ${already ? 'already-added' : ''}"
              onclick="${already ? 'void(0)' : `addFromCached('${t.id}')`}">
      <img class="result-art" src="${img}" onerror="this.style.display='none'"/>
      <div class="result-info">
        <div class="result-name">${esc(t.name)}</div>
        <div class="result-artist">${esc(t.artists[0].name)}</div>
      </div>
      <div class="result-add" style="${already?'color:var(--text-dim)':''}">${already ? '✓ Added' : '+ Add'}</div>
    </div>`;
  }).join('');
}

// Override doSearch to use cache version
const _doSearch = doSearch;

window.doSearch = function() {
  const demoMode = localStorage.getItem(DEMO_KEY) === '1';
  if (demoMode) { renderDemoResults(document.getElementById('searchInput').value.trim()); return; }
  doSearchAndCache();
};

function addFromCached(id) {
  const track = _searchCache[id];
  if (!track) return;
  const ok = addTrack(track);
  if (ok) closeSearch();
}

// Demo mode (no Spotify)
const DEMO_TRACKS = [
  { id:'4iV5W9uYEdYUVa79Axb7Rh', name:'Clair de Lune', artist:'Debussy',     image:'' },
  { id:'1dGr1c8CrMLDpV6mPbImSI', name:'Coffee & Rain', artist:'Fkj',          image:'' },
  { id:'2Foc5Q5nqNiosCNqttzHof', name:'Weightless',    artist:'Marconi Union', image:'' },
  { id:'0WWkfzLIBxnb5SFf6Zftzv', name:'Birdsong',      artist:'Lo-Fi Beats',  image:'' },
  { id:'7ouMYWpwJ422jRcDASZB7P', name:'Midnight City', artist:'M83',           image:'' },
  { id:'3bn9A4JH0dUUNJQPnUViMC', name:'Retrograde',    artist:'James Blake',   image:'' },
];

function renderDemoResults(q) {
  const resultsEl = document.getElementById('searchResults');
  const filtered = q ? DEMO_TRACKS.filter(t =>
    t.name.toLowerCase().includes(q.toLowerCase()) ||
    t.artist.toLowerCase().includes(q.toLowerCase())
  ) : DEMO_TRACKS;
  const state = getState();
  const inQueue = state.queue.map(t => t.id);
  _searchCache = {};
  filtered.forEach(t => { _searchCache[t.id] = { id:t.id, name:t.name, artists:[{name:t.artist}], album:{images:[]} }; });
  if (!filtered.length) {
    resultsEl.innerHTML = '<div class="search-status">No demo tracks match your search</div>';
    return;
  }
  resultsEl.innerHTML = filtered.map(t => {
    const already = inQueue.includes(t.id);
    return `<div class="search-result-item ${already ? 'already-added' : ''}"
              onclick="${already ? 'void(0)' : `addFromCached('${t.id}')`}">
      <div class="result-art" style="background:linear-gradient(135deg,#7c5cbf33,#4ecdc433);display:flex;align-items:center;justify-content:center;font-size:18px">🎵</div>
      <div class="result-info">
        <div class="result-name">${esc(t.name)}</div>
        <div class="result-artist">${esc(t.artist)}</div>
      </div>
      <div class="result-add" style="${already?'color:var(--text-dim)':''}">${already ? '✓ Added' : '+ Add'}</div>
    </div>`;
  }).join('');
}

// ============================================================
//  SETUP & MODALS
// ============================================================
function showSetup() {
  document.getElementById('thisUrl').textContent = getRedirectUri();
  document.getElementById('setupOverlay').classList.remove('hidden');
}

function hideSetup() {
  document.getElementById('setupOverlay').classList.add('hidden');
}

function saveSetup() {
  const clientId = document.getElementById('clientIdInput').value.trim();
  if (!clientId || clientId.length < 20) { showToast('Please enter a valid Client ID'); return; }
  localStorage.setItem(CLIENT_KEY, clientId);
  localStorage.removeItem(DEMO_KEY);
  hideSetup();
  initiateAuth();
}

function useDemoMode() {
  localStorage.setItem(DEMO_KEY, '1');
  localStorage.removeItem(TOKEN_KEY);
  hideSetup();
  updateSpotifyBadge(false, true);
  renderAll();
  showToast('Demo mode active — limited song data 🎵');
}

function openSearch() {
  const demoMode = localStorage.getItem(DEMO_KEY) === '1';
  const token = localStorage.getItem(TOKEN_KEY);
  if (!demoMode && !token) {
    showToast('Connect Spotify to search songs!');
    showSetup();
    return;
  }
  document.getElementById('searchInput').value = '';
  document.getElementById('searchResults').innerHTML = '<div class="search-status">Type a song or artist name and search</div>';
  document.getElementById('searchOverlay').classList.remove('hidden');
  setTimeout(() => document.getElementById('searchInput').focus(), 100);
}

function closeSearch() {
  document.getElementById('searchOverlay').classList.add('hidden');
}

function handleSpotifyBadgeClick() {
  const token = localStorage.getItem(TOKEN_KEY);
  const demo  = localStorage.getItem(DEMO_KEY) === '1';
  if (!token && !demo) { showSetup(); }
  else if (demo) { showToast('In demo mode. Reload to connect Spotify.'); }
  else {
    if (confirm('Disconnect Spotify?')) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(EXPIRY_KEY);
      updateSpotifyBadge(false, false);
      showToast('Disconnected from Spotify');
    }
  }
}

function updateSpotifyBadge(connected, demo) {
  const badge = document.getElementById('spotifyBadge');
  const text  = document.getElementById('spotifyBadgeText');
  if (connected) {
    badge.classList.remove('disconnected');
    text.textContent = 'Spotify Connected';
  } else if (demo) {
    badge.classList.remove('disconnected');
    badge.style.color = '#94a3b8';
    badge.style.background = 'rgba(148,163,184,0.08)';
    badge.style.borderColor = 'rgba(148,163,184,0.2)';
    text.textContent = 'Demo Mode';
  } else {
    badge.classList.add('disconnected');
    text.textContent = 'Connect Spotify';
  }
}

// ============================================================
//  TOAST
// ============================================================
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

// ============================================================
//  ESCAPE HELPERS
// ============================================================
function esc(s)  { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function esc2(s) { return String(s).replace(/'/g,"\\'").replace(/"/g,'\\"').replace(/\n/g,' '); }

// ============================================================
//  INIT
// ============================================================
(async function init() {
  const params = new URLSearchParams(window.location.search);
  const code   = params.get('code');
  const error  = params.get('error');

  // Handle OAuth callback
  if (code) {
    history.replaceState({}, '', '/');
    const token = await exchangeToken(code);
    if (token) {
      hideSetup();
      updateSpotifyBadge(true, false);
      showToast('Spotify connected! 🎵');
    } else {
      showToast('Auth failed — try again');
      showSetup();
    }
  } else if (error) {
    history.replaceState({}, '', '/');
    showToast('Spotify auth cancelled');
    showSetup();
  } else {
    const token   = localStorage.getItem(TOKEN_KEY);
    const demo    = localStorage.getItem(DEMO_KEY) === '1';
    const clientId= localStorage.getItem(CLIENT_KEY);

    if (token) {
      // Silently refresh if expired
      const expiry = parseInt(localStorage.getItem(EXPIRY_KEY) || '0');
      if (Date.now() > expiry - 60000) { await refreshToken(); }
      hideSetup();
      updateSpotifyBadge(true, false);
    } else if (demo) {
      hideSetup();
      updateSpotifyBadge(false, true);
    } else if (clientId) {
      // Has client ID but no token — re-auth
      updateSpotifyBadge(false, false);
    } else {
      // First visit
      showSetup();
    }
  }

  renderAll();

  // Cross-tab sync
  if (bc) {
    bc.onmessage = (e) => {
      if (e.data?.type === 'state') renderAll();
    };
  }

  // Poll for updates every 5s (fallback)
  setInterval(renderAll, 5000);
})();
