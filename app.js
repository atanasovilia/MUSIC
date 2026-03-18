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
const THEME_KEY   = 'lofi_scene_theme_v1';
const SUGGESTIONS_KEY = 'lofi_shared_suggestions_v1';
const AMBIENT_PREFS_KEY = 'lofi_ambient_prefs_v1';
const MASTER_VOLUME_KEY = 'lofi_master_volume_v1';
const MASTER_MUTED_KEY = 'lofi_master_muted_v1';
const SPOTIFY_VOLUME_KEY = 'lofi_spotify_volume_v1';
const AUTO_AUTH_KEY = 'lofi_auto_auth_once_v1';
const PROD_SPOTIFY_REDIRECT_URI = 'https://musicdistro.vercel.app';
const DEFAULT_TRACK_MS = 180000;
const MAX_QUEUE = 5;
const DJ_STATE_KEY = 'lofi_dj_state_v1';
const REPEAT_TRACK_KEY = 'lofi_repeat_track_v1';

const SCENE_THEMES = [
  { id: 'space', emoji: '🌌', label: 'Space' },
  { id: 'city',  emoji: '🌃', label: 'City' },
  { id: 'beach', emoji: '🌊', label: 'Beach' },
  { id: 'rain',  emoji: '🌧️', label: 'Rain' },
  { id: 'cafe',  emoji: '☕', label: 'Cafe' },
  { id: 'night', emoji: '🌙', label: 'Night' },
];

const AMBIENT_SCENES = {
  space: [
    { id: 'drift',    icon: '🪐', label: 'Orbital Drift', type: 'spacePad', on: true,  vol: 0.24 },
    { id: 'stardust', icon: '✨', label: 'Star Dust',     type: 'stardust', on: true,  vol: 0.16 },
    { id: 'signal',   icon: '📡', label: 'Radio Bloom',   type: 'signal',   on: false, vol: 0.10 },
  ],
  city: [
    { id: 'traffic',  icon: '🚗', label: 'City Traffic',  type: 'traffic',  on: true,  vol: 0.28 },
    { id: 'rain',     icon: '🌧️', label: 'Neon Rain',     type: 'rain',     on: false, vol: 0.22 },
    { id: 'wind',     icon: '💨', label: 'City Wind',     type: 'wind',     on: false, vol: 0.16 },
  ],
  beach: [
    { id: 'waves',    icon: '🌊', label: 'Ocean Waves',   type: 'waves',    on: true,  vol: 0.30 },
    { id: 'wind',     icon: '💨', label: 'Sea Breeze',    type: 'wind',     on: true,  vol: 0.14 },
    { id: 'seagulls', icon: '🕊️', label: 'Seagulls',      type: 'seagulls', on: false, vol: 0.12 },
  ],
  rain: [
    { id: 'rain',     icon: '🌧️', label: 'Heavy Rain',    type: 'rain',     on: true,  vol: 0.30 },
    { id: 'thunder',  icon: '⛈️', label: 'Thunder',       type: 'thunder',  on: false, vol: 0.20 },
    { id: 'roomtone', icon: '🏠', label: 'Indoor Tone',   type: 'roomtone', on: true,  vol: 0.14 },
  ],
  cafe: [
    { id: 'cafe',     icon: '☕', label: 'Cafe Murmur',   type: 'cafe',     on: true,  vol: 0.22 },
    { id: 'cups',     icon: '🫖', label: 'Cups & Saucers',type: 'cups',     on: true,  vol: 0.14 },
    { id: 'rain',     icon: '🌧️', label: 'Rain on Glass', type: 'rain',     on: false, vol: 0.16 },
  ],
  night: [
    { id: 'crickets', icon: '🦗', label: 'Crickets',      type: 'crickets', on: true,  vol: 0.22 },
    { id: 'wind',     icon: '🌬️', label: 'Night Wind',    type: 'wind',     on: true,  vol: 0.12 },
    { id: 'fire',     icon: '🔥', label: 'Campfire',      type: 'fire',     on: false, vol: 0.18 },
  ],
};

const ambientEngine = {
  ctx: null,
  master: null,
  channels: {},
  ready: false,
  reverb: null,
  tone: null,
  air: null,
  compressor: null,
};

let autoAdvanceLock = false;
let autoPlayTimeoutId = null;
let applyingRemoteSync = false;
let jamPeer = null;
let jamConnections = [];
let jamRoomCode = '';
let jamLastTs = 0;
const jamSeenMessageIds = new Set();
let playlistMixCache = [];
let masterVolume = 0.28;
let masterMuted = false;
let spotifyVolume = 0.78;
let spotifyIframeApi = null;
let spotifyController = null;
let repeatTrackEnabled = false;

let djState = {
  enabled: false,
  vibe: 'lofi',
};

const DJ_LIBRARY = {
  lofi: [
    { id:'4iV5W9uYEdYUVa79Axb7Rh', name:'Clair de Lune', artist:'Debussy' },
    { id:'3HfB5hBU0dmBt8T0iCmH42', name:'Lo-Fi Bloom', artist:'Sleep Dealer' },
    { id:'2Foc5Q5nqNiosCNqttzHof', name:'Weightless', artist:'Marconi Union' },
    { id:'0WWkfzLIBxnb5SFf6Zftzv', name:'Birdsong', artist:'Lo-Fi Beats' },
    { id:'4VqPOruhp5EdPBeR92t6lQ', name:'Numb', artist:'Men I Trust' },
    { id:'2M9ro2krNb7nr7HSprkEgo', name:'Sunset Lover', artist:'Petit Biscuit' },
  ],
  chill: [
    { id:'1dGr1c8CrMLDpV6mPbImSI', name:'Coffee & Rain', artist:'Fkj' },
    { id:'7ouMYWpwJ422jRcDASZB7P', name:'Midnight City', artist:'M83' },
    { id:'3bn9A4JH0dUUNJQPnUViMC', name:'Retrograde', artist:'James Blake' },
    { id:'6habFhsOp2NvshLv26DqMb', name:'Vibin Out', artist:'FKJ' },
    { id:'2takcwOaAZWiXQijPHIx7B', name:'Electric Feel', artist:'MGMT' },
    { id:'5ChkMS8OtdzJeqyybCc9R5', name:'Do I Wanna Know?', artist:'Arctic Monkeys' },
  ],
  focus: [
    { id:'2Foc5Q5nqNiosCNqttzHof', name:'Weightless', artist:'Marconi Union' },
    { id:'0VjIjW4GlUZAMYd2vXMi3b', name:'Blinding Lights', artist:'The Weeknd' },
    { id:'5CMjjywI0eZMixPeqNd75R', name:'Afterglow', artist:'Phaeleh' },
    { id:'6K4t31amVTZDgR3sKmwUJJ', name:'Breathe', artist:'Telepopmusik' },
    { id:'4wCmqSrbyCgxEXROQE6vtV', name:'Everything in Its Right Place', artist:'Radiohead' },
    { id:'2xLMifQCjDGFmkHkpNLD9h', name:'Sparks', artist:'Coldplay' },
  ],
  night: [
    { id:'7ouMYWpwJ422jRcDASZB7P', name:'Midnight City', artist:'M83' },
    { id:'0eGsygTp906u18L0Oimnem', name:'Lose Yourself to Dance', artist:'Daft Punk' },
    { id:'3AJwUDP919kvQ9QcozQPxg', name:'Time', artist:'Pink Floyd' },
    { id:'2m6Ko3CY1qXNNja8AlugNc', name:'Nights', artist:'Frank Ocean' },
    { id:'1AhDOtG9vPSOmsWgNW0BEY', name:'Take Care', artist:'Drake' },
    { id:'5W3cjX2J3tjhG8zb6u0qHn', name:'Can I Call You Tonight?', artist:'Dayglow' },
  ],
  rainy: [
    { id:'2Foc5Q5nqNiosCNqttzHof', name:'Weightless', artist:'Marconi Union' },
    { id:'6I9VzXrHxO9rA9A5euc8Ak', name:'Viva La Vida', artist:'Coldplay' },
    { id:'4S4QJfBGGrC8jRIjJHf1Ka', name:'Riverside', artist:'Agnes Obel' },
    { id:'2gMXnyrvIjhVBUZwvLZDMP', name:'Space Song', artist:'Beach House' },
    { id:'3MytWN8L7shNYzGl4tAKRp', name:'Tadow', artist:'Masego' },
    { id:'1BxfuPKGuaTgP7aM0Bbdwr', name:'Dandelions', artist:'Ruth B.' },
  ],
};

// Cross-tab sync
let bc;
try { bc = new BroadcastChannel('lofi_together'); } catch(e) {}

window.onSpotifyIframeApiReady = (IFrameAPI) => {
  spotifyIframeApi = IFrameAPI;
  renderAll();
};

function getSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) { id = Math.random().toString(36).slice(2,10); sessionStorage.setItem(SESSION_KEY, id); }
  return id;
}

function getState() {
  try { return JSON.parse(localStorage.getItem(STATE_KEY)) || { queue:[], nowPlaying:null }; }
  catch { return { queue:[], nowPlaying:null }; }
}

function loadDjState() {
  try {
    const saved = JSON.parse(localStorage.getItem(DJ_STATE_KEY) || '{}');
    djState.enabled = !!saved.enabled;
    djState.vibe = saved.vibe || 'lofi';
  } catch {
    djState.enabled = false;
    djState.vibe = 'lofi';
  }
}

function saveDjState() {
  localStorage.setItem(DJ_STATE_KEY, JSON.stringify(djState));
  if (!applyingRemoteSync) broadcastJamSync();
}

function updateDjControls() {
  const sel = document.getElementById('djVibeSelect');
  const btn = document.getElementById('djToggleBtn');
  if (sel) sel.value = djState.vibe;
  if (btn) btn.textContent = djState.enabled ? 'DJ On' : 'DJ Off';
}

function setDjVibe(vibe) {
  djState.vibe = DJ_LIBRARY[vibe] ? vibe : 'lofi';
  saveDjState();
  updateDjControls();
  showToast(`Vibe set: ${djState.vibe}`);
}

function toggleDjMode() {
  djState.enabled = !djState.enabled;
  saveDjState();
  updateDjControls();
  showToast(djState.enabled ? 'DJ mode enabled 🎛' : 'DJ mode paused');
}

function toTrackShape(seed) {
  return {
    id: seed.id,
    name: seed.name,
    artists: [{ name: seed.artist }],
    album: { images: [] },
    duration_ms: DEFAULT_TRACK_MS,
  };
}

function uniqueRandom(items, count) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

function addRandomSongsToQueue(count = 5) {
  const vibe = djState.vibe || 'lofi';
  const pool = DJ_LIBRARY[vibe] || DJ_LIBRARY.lofi;
  const picked = uniqueRandom(pool, count);
  let added = 0;
  for (const seed of picked) {
    if (addTrack(toTrackShape(seed))) added++;
    if (getState().queue.length >= MAX_QUEUE) break;
  }
  if (added) showToast(`DJ loaded ${added} ${vibe} tracks`);
}

function runDjTick() {
  if (!djState.enabled) return;
  const state = getState();
  if (state.queue.length >= Math.min(3, MAX_QUEUE)) return;
  addRandomSongsToQueue(Math.min(2, MAX_QUEUE - state.queue.length));
}

function saveState(state) {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
  if (bc) bc.postMessage({ type:'state', state });
  if (!applyingRemoteSync) broadcastJamSync();
  renderAll();
}

function getAmbientPrefs() {
  try { return JSON.parse(localStorage.getItem(AMBIENT_PREFS_KEY)) || {}; }
  catch { return {}; }
}

function saveAmbientPrefs(prefs) {
  localStorage.setItem(AMBIENT_PREFS_KEY, JSON.stringify(prefs));
  if (!applyingRemoteSync) broadcastJamSync();
}

function volumeOnIcon() {
  return '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8.72 1.84a.75.75 0 0 1 .28.58v11.16a.75.75 0 0 1-1.28.53L4.6 10.98H2.75A1.75 1.75 0 0 1 1 9.23V6.77c0-.97.78-1.75 1.75-1.75H4.6l3.12-3.13a.75.75 0 0 1 1-.05Zm3.72 2.86a.75.75 0 0 1 1.06 0A4.75 4.75 0 0 1 14.9 8a4.75 4.75 0 0 1-1.4 3.3.75.75 0 1 1-1.06-1.06A3.25 3.25 0 0 0 13.4 8c0-.9-.37-1.72-.96-2.3a.75.75 0 0 1 0-1.06Zm-1.94 1.94a.75.75 0 0 1 1.06 0A2 2 0 0 1 12.12 8a2 2 0 0 1-.56 1.36.75.75 0 1 1-1.06-1.06.5.5 0 0 0 .16-.36.5.5 0 0 0-.16-.36.75.75 0 0 1 0-1.06Z"/></svg>';
}

function volumeOffIcon() {
  return '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M9 2.42v11.16a.75.75 0 0 1-1.28.53L4.6 10.98H2.75A1.75 1.75 0 0 1 1 9.23V6.77c0-.97.78-1.75 1.75-1.75H4.6l3.12-3.13A.75.75 0 0 1 9 2.42Zm5.28 2.3a.75.75 0 0 1 0 1.06L12.06 8l2.22 2.22a.75.75 0 1 1-1.06 1.06L11 9.06l-2.22 2.22a.75.75 0 1 1-1.06-1.06L9.94 8 7.72 5.78a.75.75 0 0 1 1.06-1.06L11 6.94l2.22-2.22a.75.75 0 0 1 1.06 0Z"/></svg>';
}

function playIcon() {
  return '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 3.5a.75.75 0 0 1 1.18-.61l7 4.5a.75.75 0 0 1 0 1.22l-7 4.5A.75.75 0 0 1 4 12.5v-9Z"/></svg>';
}

function pauseIcon() {
  return '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4.75 2.5a.75.75 0 0 1 .75.75v9.5a.75.75 0 0 1-1.5 0v-9.5a.75.75 0 0 1 .75-.75Zm6.5 0a.75.75 0 0 1 .75.75v9.5a.75.75 0 0 1-1.5 0v-9.5a.75.75 0 0 1 .75-.75Z"/></svg>';
}

function loadRepeatState() {
  repeatTrackEnabled = localStorage.getItem(REPEAT_TRACK_KEY) === '1';
}

function saveRepeatState() {
  localStorage.setItem(REPEAT_TRACK_KEY, repeatTrackEnabled ? '1' : '0');
  if (!applyingRemoteSync) broadcastJamSync();
}

function updateTransportButtons() {
  const state = getState();
  const np = state.nowPlaying;
  const playPauseBtn = document.getElementById('jamPlayPauseBtn');
  const repeatBtn = document.getElementById('repeatBtn');

  if (playPauseBtn) {
    const isPlaying = !!np && !np.isPaused;
    playPauseBtn.innerHTML = isPlaying ? pauseIcon() : playIcon();
    playPauseBtn.setAttribute('aria-label', isPlaying ? 'Pause room soundtrack' : 'Play room soundtrack');
    playPauseBtn.setAttribute('title', isPlaying ? 'Pause room soundtrack' : 'Play room soundtrack');
  }

  if (repeatBtn) {
    repeatBtn.classList.toggle('active', repeatTrackEnabled);
    repeatBtn.setAttribute('aria-pressed', repeatTrackEnabled ? 'true' : 'false');
    repeatBtn.setAttribute('title', repeatTrackEnabled ? 'Repeat current track is on' : 'Repeat current track');
  }
}

function loadMasterAudioState() {
  const savedVol = parseFloat(localStorage.getItem(MASTER_VOLUME_KEY) || '0.28');
  masterVolume = Number.isFinite(savedVol) ? Math.max(0, Math.min(1, savedVol)) : 0.28;
  masterMuted = localStorage.getItem(MASTER_MUTED_KEY) === '1';
}

function saveMasterAudioState() {
  localStorage.setItem(MASTER_VOLUME_KEY, String(masterVolume));
  localStorage.setItem(MASTER_MUTED_KEY, masterMuted ? '1' : '0');
}

function updateMasterVolumeUI() {
  const range = document.getElementById('playerVolumeRange');
  const valEl  = document.getElementById('masterVolumeValue');
  const muteBtn = document.getElementById('masterMuteBtn');
  const pct = Math.round(masterVolume * 100);
  if (range) range.value = String(pct);
  if (valEl) valEl.textContent = pct + '%';
  if (muteBtn) {
    muteBtn.classList.toggle('active', masterMuted);
    muteBtn.setAttribute('aria-label', masterMuted ? 'Unmute master output' : 'Mute master output');
    muteBtn.setAttribute('title', masterMuted ? 'Unmute master output' : 'Mute master output');
    muteBtn.innerHTML = masterMuted ? volumeOffIcon() : volumeOnIcon();
  }
}

function applyMasterVolume(ramp = 0.2) {
  if (!ambientEngine.ready || !ambientEngine.master) return;
  const target = masterMuted ? 0 : masterVolume;
  ambientEngine.master.gain.cancelScheduledValues(ambientEngine.ctx.currentTime);
  ambientEngine.master.gain.setTargetAtTime(target, ambientEngine.ctx.currentTime, ramp);
}

function updatePlayerRangeTrack() {
  const pRange = document.getElementById('playerVolumeRange');
  if (!pRange) return;
  const pct = masterMuted ? 0 : Math.round(masterVolume * 100);
  pRange.style.setProperty('--vol-pct', pct + '%');
  pRange.style.background = `linear-gradient(to right, var(--accent-strong) 0%, var(--accent-strong) ${pct}%, rgba(255,255,255,0.1) ${pct}%)`;
}

function setMasterVolumeFromUI(value) {
  masterVolume = Math.max(0, Math.min(1, Number(value) / 100));
  if (masterMuted && masterVolume > 0) masterMuted = false;
  saveMasterAudioState();
  updateMasterVolumeUI();
  updatePlayerRangeTrack();
  resumeAmbient();
  applyMasterVolume(0.12);
  applySpotifyVolume(0); // instant response while dragging
}

function bindMasterVolumeControls() {
  const volumeRange = document.getElementById('playerVolumeRange');
  if (!volumeRange) return;

  volumeRange.addEventListener('input', (e) => {
    setMasterVolumeFromUI(e.target.value);
  });

  volumeRange.addEventListener('change', (e) => {
    setMasterVolumeFromUI(e.target.value);
  });
}

function nudgeMasterVolume(deltaPct) {
  const next = Math.max(0, Math.min(100, Math.round(masterVolume * 100) + deltaPct));
  setMasterVolumeFromUI(next);
}

function toggleAmbientMute() {
  masterMuted = !masterMuted;
  saveMasterAudioState();
  updateMasterVolumeUI();
  updatePlayerRangeTrack();
  resumeAmbient();
  applyMasterVolume(0.08);
  applySpotifyVolume(0); // instant mute/unmute
}

function loadSpotifyVolumeState() {
  const savedVol = parseFloat(localStorage.getItem(SPOTIFY_VOLUME_KEY) || '0.78');
  spotifyVolume = Number.isFinite(savedVol) ? Math.max(0, Math.min(1, savedVol)) : 0.78;
}

function saveSpotifyVolumeState() {
  localStorage.setItem(SPOTIFY_VOLUME_KEY, String(spotifyVolume));
}

function updateSpotifyVolumeUI() {
  const range = document.getElementById('musicVolumeRange');
  const valEl = document.getElementById('musicVolumeValue');
  const pct = Math.round(spotifyVolume * 100);
  if (range) range.value = String(pct);
  if (valEl) valEl.textContent = pct + '%';
  updateMusicRangeTrack();
}

function updateMusicRangeTrack() {
  const range = document.getElementById('musicVolumeRange');
  if (!range) return;
  const pct = Math.round(spotifyVolume * 100);
  range.style.setProperty('--vol-pct', pct + '%');
  range.style.background = `linear-gradient(to right, var(--accent-soft) 0%, var(--accent-soft) ${pct}%, rgba(255,255,255,0.1) ${pct}%)`;
}

function setSpotifyVolumeFromUI(value) {
  spotifyVolume = Math.max(0, Math.min(1, Number(value) / 100));
  saveSpotifyVolumeState();
  updateSpotifyVolumeUI();
  applySpotifyVolume(0);
}

function bindSpotifyVolumeControls() {
  const volumeRange = document.getElementById('musicVolumeRange');
  if (!volumeRange) return;

  volumeRange.addEventListener('input', (e) => {
    setSpotifyVolumeFromUI(e.target.value);
  });

  volumeRange.addEventListener('change', (e) => {
    setSpotifyVolumeFromUI(e.target.value);
  });
}

function applySpotifyVolume(delayMs = 0) {
  const doSet = () => {
    if (!spotifyController) return;
    const vol = masterMuted ? 0 : Math.max(0, Math.min(1, masterVolume * spotifyVolume));
    try {
      if (typeof spotifyController.setVolume === 'function') spotifyController.setVolume(vol);
    } catch {}
  };
  if (delayMs > 0) setTimeout(doSet, delayMs);
  else doSet();
}

function onSpotifyPlaybackUpdate(event) {
  // Playback tracking removed - using simple timer fallback instead.
  return;
}

function destroySpotifyController(removeHost = true) {
  if (spotifyController) {
    try {
      if (typeof spotifyController.destroy === 'function') spotifyController.destroy();
    } catch {}
    spotifyController = null;
  }
  if (removeHost) {
    // Also remove any lingering embed host element
    const host = document.getElementById('spotifyEmbedHost');
    if (host) host.remove();
  }
}

function mountSpotifyTrackEmbed(trackId, startSeconds = 0) {
  const wrap = document.getElementById('nowPlayingWrap');
  if (!wrap) return false;

  // Tear down prior controller first, but keep the container we are about to create.
  destroySpotifyController(false);

  const host = document.createElement('div');
  host.id = 'spotifyEmbedHost';
  wrap.replaceChildren(host);

  if (!spotifyIframeApi || typeof spotifyIframeApi.createController !== 'function') {
    return false;
  }

  spotifyIframeApi.createController(host, {
    uri: `spotify:track:${trackId}`,
    width: '100%',
    height: 152,
    theme: 'black',
  }, (controller) => {
    spotifyController = controller;

    const tryPlay = () => {
      try { if (typeof controller.play === 'function') controller.play(); } catch {}
      // Apply volume right after play so the first note is at the correct level
      applySpotifyVolume(80);
    };

    if (typeof controller.addListener === 'function') {
      controller.addListener('ready', tryPlay);
    }
    // Belt-and-suspenders delay fallback
    setTimeout(tryPlay, 500);
  });

  return true;
}

function getCurrentTheme() {
  const cl = Array.from(document.body.classList).find(c => c.startsWith('scene-'));
  return cl ? cl.replace('scene-', '') : 'space';
}

function initAmbientEngine() {
  if (ambientEngine.ready) return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  ambientEngine.ctx = ctx;

  // Master gain (starts silent, ramped up by applyMasterVolume)
  ambientEngine.master = ctx.createGain();
  ambientEngine.master.gain.value = 0;

  // Room reverb impulse — longer, more natural
  const revLen = ctx.sampleRate * 3.5;
  const impulse = ctx.createBuffer(2, revLen, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = impulse.getChannelData(c);
    for (let i = 0; i < revLen; i++) {
      const t = i / revLen;
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.4) * (1 - t * 0.3);
    }
  }
  const reverb = ctx.createConvolver();
  reverb.buffer = impulse;
  ambientEngine.reverb = reverb;

  const wet = ctx.createGain();
  wet.gain.value = 0.17;
  reverb.connect(wet);
  wet.connect(ambientEngine.master);

  // Warm the ambience so it feels closer to a Discord-style chill room.
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowshelf';
  tone.frequency.value = 220;
  tone.gain.value = 1.8;
  ambientEngine.tone = tone;

  const air = ctx.createBiquadFilter();
  air.type = 'highshelf';
  air.frequency.value = 4200;
  air.gain.value = -2.8;
  ambientEngine.air = air;

  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -24;
  compressor.knee.value = 18;
  compressor.ratio.value = 2.4;
  compressor.attack.value = 0.02;
  compressor.release.value = 0.26;
  ambientEngine.compressor = compressor;

  ambientEngine.master.connect(tone);
  tone.connect(air);
  air.connect(compressor);
  compressor.connect(ctx.destination);
  ambientEngine.ready = true;
  applyMasterVolume(1.4);
}

function resumeAmbient() {
  initAmbientEngine();
  if (ambientEngine.ctx && ambientEngine.ctx.state === 'suspended') ambientEngine.ctx.resume();
  applyMasterVolume(0.2);
}

// ── Noise generators ────────────────────────────────────────────────────────
function makePinkNoise(ctx, seconds) {
  const n = ctx.sampleRate * seconds;
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99886*b0 + w*0.0555179; b1 = 0.99332*b1 + w*0.0750759;
    b2 = 0.96900*b2 + w*0.1538520; b3 = 0.86650*b3 + w*0.3104856;
    b4 = 0.55000*b4 + w*0.5329522; b5 = -0.7616*b5 - w*0.0168980;
    d[i] = (b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11; b6 = w*0.115926;
  }
  return buf;
}

function makeBrownNoise(ctx, seconds) {
  const n = ctx.sampleRate * seconds;
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.02 * w) / 1.02;
    d[i] = last * 3.5;
  }
  return buf;
}

function makeWhiteNoise(ctx, seconds) {
  const n = ctx.sampleRate * seconds;
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

// ── Per-sound synthesis ──────────────────────────────────────────────────────
function buildSoundNode(type) {
  const ctx = ambientEngine.ctx;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  const nodes = [gain]; // track all nodes for cleanup

  const connect = (src) => {
    src.connect(ambientEngine.master);
    if (ambientEngine.reverb) src.connect(ambientEngine.reverb);
  };

  switch (type) {

    // ── TRAFFIC: layered low rumble + distant horn doppler ──────────────
    case 'traffic': {
      // Low rumble base (brown noise through aggressive LP)
      const rumble = ctx.createBufferSource();
      rumble.buffer = makeBrownNoise(ctx, 6);
      rumble.loop = true;
      const rumbleLP = ctx.createBiquadFilter();
      rumbleLP.type = 'lowpass'; rumbleLP.frequency.value = 280; rumbleLP.Q.value = 1.2;
      const rumbleHP = ctx.createBiquadFilter();
      rumbleHP.type = 'highpass'; rumbleHP.frequency.value = 30;
      rumble.connect(rumbleHP); rumbleHP.connect(rumbleLP); rumbleLP.connect(gain);

      // Mid traffic swish (pink noise band 400-1200 Hz with slow LFO)
      const swish = ctx.createBufferSource();
      swish.buffer = makePinkNoise(ctx, 4);
      swish.loop = true;
      const swishHP = ctx.createBiquadFilter();
      swishHP.type = 'highpass'; swishHP.frequency.value = 400;
      const swishLP = ctx.createBiquadFilter();
      swishLP.type = 'lowpass'; swishLP.frequency.value = 1200;
      const swishLFO = ctx.createOscillator();
      const swishLFOGain = ctx.createGain();
      swishLFO.type = 'sine'; swishLFO.frequency.value = 0.07;
      swishLFOGain.gain.value = 180;
      swishLFO.connect(swishLFOGain); swishLFOGain.connect(swishLP.frequency);
      const swishGain = ctx.createGain(); swishGain.gain.value = 0.55;
      swish.connect(swishHP); swishHP.connect(swishLP); swishLP.connect(swishGain); swishGain.connect(gain);

      gain.connect(ambientEngine.master);
      if (ambientEngine.reverb) gain.connect(ambientEngine.reverb);
      rumble.start(); swish.start(); swishLFO.start();
      nodes.push(rumble, swish, swishLFO);
      break;
    }

    // ── RAIN: multi-layer — heavy drops + fine mist + roof surface ───────
    case 'rain': {
      // Heavy drops: filtered white noise with rhythmic LFO tremolo
      const drops = ctx.createBufferSource();
      drops.buffer = makeWhiteNoise(ctx, 3);
      drops.loop = true;
      const dropsHP = ctx.createBiquadFilter();
      dropsHP.type = 'highpass'; dropsHP.frequency.value = 800;
      const dropsLP = ctx.createBiquadFilter();
      dropsLP.type = 'lowpass'; dropsLP.frequency.value = 5000;
      const dropsTremolo = ctx.createGain(); dropsTremolo.gain.value = 0.6;
      const dropsLFO = ctx.createOscillator();
      const dropsLFOG = ctx.createGain();
      dropsLFO.type = 'sine'; dropsLFO.frequency.value = 2.3;
      dropsLFOG.gain.value = 0.25;
      dropsLFO.connect(dropsLFOG); dropsLFOG.connect(dropsTremolo.gain);
      drops.connect(dropsHP); dropsHP.connect(dropsLP);
      dropsLP.connect(dropsTremolo); dropsTremolo.connect(gain);

      // Mist layer: very high-freq pink noise
      const mist = ctx.createBufferSource();
      mist.buffer = makePinkNoise(ctx, 2);
      mist.loop = true;
      const mistHP = ctx.createBiquadFilter();
      mistHP.type = 'highpass'; mistHP.frequency.value = 3000;
      const mistGain = ctx.createGain(); mistGain.gain.value = 0.3;
      mist.connect(mistHP); mistHP.connect(mistGain); mistGain.connect(gain);

      // Surface rumble: very low brown noise 
      const surface = ctx.createBufferSource();
      surface.buffer = makeBrownNoise(ctx, 4);
      surface.loop = true;
      const surfLP = ctx.createBiquadFilter();
      surfLP.type = 'lowpass'; surfLP.frequency.value = 400;
      const surfGain = ctx.createGain(); surfGain.gain.value = 0.25;
      surface.connect(surfLP); surfLP.connect(surfGain); surfGain.connect(gain);

      gain.connect(ambientEngine.master);
      if (ambientEngine.reverb) gain.connect(ambientEngine.reverb);
      drops.start(); mist.start(); surface.start(); dropsLFO.start();
      nodes.push(drops, mist, surface, dropsLFO);
      break;
    }

    // ── WAVES: ocean swell — slow amplitude modulation + foam hiss ───────
    case 'waves': {
      const base = ctx.createBufferSource();
      base.buffer = makeBrownNoise(ctx, 8);
      base.loop = true;
      const baseLP = ctx.createBiquadFilter();
      baseLP.type = 'lowpass'; baseLP.frequency.value = 600;
      const baseHP = ctx.createBiquadFilter();
      baseHP.type = 'highpass'; baseHP.frequency.value = 40;

      // Slow swell LFO (0.08 Hz ≈ 12-second waves)
      const swell = ctx.createGain(); swell.gain.value = 0.5;
      const swellLFO = ctx.createOscillator();
      const swellLFOG = ctx.createGain();
      swellLFO.type = 'sine'; swellLFO.frequency.value = 0.08;
      swellLFOG.gain.value = 0.45;
      swellLFO.connect(swellLFOG); swellLFOG.connect(swell.gain);
      base.connect(baseHP); baseHP.connect(baseLP); baseLP.connect(swell); swell.connect(gain);

      // Foam hiss (high-freq white noise, faster LFO)
      const foam = ctx.createBufferSource();
      foam.buffer = makeWhiteNoise(ctx, 2);
      foam.loop = true;
      const foamHP = ctx.createBiquadFilter();
      foamHP.type = 'highpass'; foamHP.frequency.value = 2500;
      const foamSwell = ctx.createGain(); foamSwell.gain.value = 0.3;
      const foamLFO = ctx.createOscillator();
      const foamLFOG = ctx.createGain();
      foamLFO.type = 'sine'; foamLFO.frequency.value = 0.12;
      foamLFOG.gain.value = 0.25;
      foamLFO.connect(foamLFOG); foamLFOG.connect(foamSwell.gain);
      foam.connect(foamHP); foamHP.connect(foamSwell); foamSwell.connect(gain);

      gain.connect(ambientEngine.master);
      if (ambientEngine.reverb) gain.connect(ambientEngine.reverb);
      base.start(); foam.start(); swellLFO.start(); foamLFO.start();
      nodes.push(base, foam, swellLFO, foamLFO);
      break;
    }

    // ── WIND: layered gusts — howl through peaks + low moan ─────────────
    case 'wind': {
      const base = ctx.createBufferSource();
      base.buffer = makePinkNoise(ctx, 4);
      base.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 320; bp.Q.value = 0.8;
      const gustLFO = ctx.createOscillator();
      const gustLFOG = ctx.createGain();
      gustLFO.type = 'sine'; gustLFO.frequency.value = 0.15;
      gustLFOG.gain.value = 160;
      gustLFO.connect(gustLFOG); gustLFOG.connect(bp.frequency);

      const howl = ctx.createBufferSource();
      howl.buffer = makePinkNoise(ctx, 3);
      howl.loop = true;
      const howlBP = ctx.createBiquadFilter();
      howlBP.type = 'bandpass'; howlBP.frequency.value = 700; howlBP.Q.value = 2.5;
      const howlGain = ctx.createGain(); howlGain.gain.value = 0.35;
      const howlLFO = ctx.createOscillator();
      const howlLFOG = ctx.createGain();
      howlLFO.type = 'sine'; howlLFO.frequency.value = 0.22;
      howlLFOG.gain.value = 0.28;
      howlLFO.connect(howlLFOG); howlLFOG.connect(howlGain.gain);
      howl.connect(howlBP); howlBP.connect(howlGain); howlGain.connect(gain);

      base.connect(bp); bp.connect(gain);
      gain.connect(ambientEngine.master);
      if (ambientEngine.reverb) gain.connect(ambientEngine.reverb);
      base.start(); howl.start(); gustLFO.start(); howlLFO.start();
      nodes.push(base, howl, gustLFO, howlLFO);
      break;
    }

    // ── THUNDER: rumble + random crackle ────────────────────────────────
    case 'thunder': {
      const rumble = ctx.createBufferSource();
      rumble.buffer = makeBrownNoise(ctx, 6);
      rumble.loop = true;
      const rLP = ctx.createBiquadFilter();
      rLP.type = 'lowpass'; rLP.frequency.value = 180;
      const rGain = ctx.createGain(); rGain.gain.value = 0.7;
      const rLFO = ctx.createOscillator();
      const rLFOG = ctx.createGain();
      rLFO.type = 'sine'; rLFO.frequency.value = 0.04;
      rLFOG.gain.value = 0.55;
      rLFO.connect(rLFOG); rLFOG.connect(rGain.gain);
      rumble.connect(rLP); rLP.connect(rGain); rGain.connect(gain);
      gain.connect(ambientEngine.master);
      if (ambientEngine.reverb) gain.connect(ambientEngine.reverb);
      rumble.start(); rLFO.start();
      nodes.push(rumble, rLFO);
      break;
    }

    // ── ROOM TONE: gentle HVAC hum + very low presence ──────────────────
    case 'roomtone': {
      const hum = ctx.createOscillator();
      hum.type = 'sawtooth'; hum.frequency.value = 60;
      const humLP = ctx.createBiquadFilter();
      humLP.type = 'lowpass'; humLP.frequency.value = 90;
      const humGain = ctx.createGain(); humGain.gain.value = 0.06;
      hum.connect(humLP); humLP.connect(humGain); humGain.connect(gain);

      const presence = ctx.createBufferSource();
      presence.buffer = makePinkNoise(ctx, 3);
      presence.loop = true;
      const presLP = ctx.createBiquadFilter();
      presLP.type = 'lowpass'; presLP.frequency.value = 300;
      const presGain = ctx.createGain(); presGain.gain.value = 0.25;
      presence.connect(presLP); presLP.connect(presGain); presGain.connect(gain);

      gain.connect(ambientEngine.master);
      if (ambientEngine.reverb) gain.connect(ambientEngine.reverb);
      hum.start(); presence.start();
      nodes.push(hum, presence);
      break;
    }

    // ── CAFE: multi-voice murmur simulation ─────────────────────────────
    case 'cafe': {
      // Murmur: multiple bandpass filtered noise streams at different freqs
      const murmurFreqs = [240, 380, 520, 680, 820];
      murmurFreqs.forEach((freq, i) => {
        const src = ctx.createBufferSource();
        src.buffer = makePinkNoise(ctx, 2 + i);
        src.loop = true;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = 3.5;
        const g = ctx.createGain();
        g.gain.value = 0.18 + Math.random() * 0.12;
        // Individual LFO per voice for natural variation
        const lfo = ctx.createOscillator();
        const lfoG = ctx.createGain();
        lfo.type = 'sine'; lfo.frequency.value = 0.1 + i * 0.04 + Math.random() * 0.06;
        lfoG.gain.value = 0.12;
        lfo.connect(lfoG); lfoG.connect(g.gain);
        src.connect(bp); bp.connect(g); g.connect(gain);
        src.start(); lfo.start();
        nodes.push(src, lfo);
      });
      gain.connect(ambientEngine.master);
      if (ambientEngine.reverb) gain.connect(ambientEngine.reverb);
      break;
    }

    // ── CUPS: ceramic clink + espresso machine hiss ──────────────────────
    case 'cups': {
      // Espresso machine: high-freq band-pass white noise
      const machine = ctx.createBufferSource();
      machine.buffer = makeWhiteNoise(ctx, 2);
      machine.loop = true;
      const machHP = ctx.createBiquadFilter();
      machHP.type = 'highpass'; machHP.frequency.value = 1500;
      const machLP = ctx.createBiquadFilter();
      machLP.type = 'lowpass'; machLP.frequency.value = 4000;
      const machGain = ctx.createGain(); machGain.gain.value = 0.3;
      // Intermittent bursts via LFO
      const machLFO = ctx.createOscillator();
      const machLFOG = ctx.createGain();
      machLFO.type = 'square'; machLFO.frequency.value = 0.04;
      machLFOG.gain.value = 0.25;
      machLFO.connect(machLFOG); machLFOG.connect(machGain.gain);
      machine.connect(machHP); machHP.connect(machLP);
      machLP.connect(machGain); machGain.connect(gain);

      gain.connect(ambientEngine.master);
      if (ambientEngine.reverb) gain.connect(ambientEngine.reverb);
      machine.start(); machLFO.start();
      nodes.push(machine, machLFO);
      break;
    }

    // ── CRICKETS: chorus of synthesized cricket chirps ───────────────────
    case 'crickets': {
      // Cricket sound: amplitude-modulated high-freq oscillators
      const chirpFreqs = [3800, 4000, 4200, 3900, 4100];
      chirpFreqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine'; osc.frequency.value = freq + (Math.random() * 100 - 50);
        const ampMod = ctx.createGain(); ampMod.gain.value = 0;
        const lfo = ctx.createOscillator();
        const lfoG = ctx.createGain();
        lfo.type = 'sine'; lfo.frequency.value = 22 + i * 1.5; // chirp rate
        lfoG.gain.value = 0.06;
        lfo.connect(lfoG); lfoG.connect(ampMod.gain);
        osc.connect(ampMod); ampMod.connect(gain);
        osc.start(); lfo.start();
        nodes.push(osc, lfo);
      });
      // Background hiss
      const hiss = ctx.createBufferSource();
      hiss.buffer = makeWhiteNoise(ctx, 2);
      hiss.loop = true;
      const hissHP = ctx.createBiquadFilter();
      hissHP.type = 'highpass'; hissHP.frequency.value = 2000;
      const hissG = ctx.createGain(); hissG.gain.value = 0.08;
      hiss.connect(hissHP); hissHP.connect(hissG); hissG.connect(gain);
      gain.connect(ambientEngine.master);
      if (ambientEngine.reverb) gain.connect(ambientEngine.reverb);
      hiss.start();
      nodes.push(hiss);
      break;
    }

    // ── FIRE / CAMPFIRE: crackling warm noise ────────────────────────────
    case 'fire': {
      const crackle = ctx.createBufferSource();
      crackle.buffer = makePinkNoise(ctx, 3);
      crackle.loop = true;
      const crackleHP = ctx.createBiquadFilter();
      crackleHP.type = 'highpass'; crackleHP.frequency.value = 600;
      const crackleLP = ctx.createBiquadFilter();
      crackleLP.type = 'lowpass'; crackleLP.frequency.value = 3500;
      const crackleGain = ctx.createGain(); crackleGain.gain.value = 0.5;
      // Fast random modulation = crackling effect
      const crackLFO = ctx.createOscillator();
      const crackLFOG = ctx.createGain();
      crackLFO.type = 'sawtooth'; crackLFO.frequency.value = 8;
      crackLFOG.gain.value = 0.3;
      crackLFO.connect(crackLFOG); crackLFOG.connect(crackleGain.gain);
      crackle.connect(crackleHP); crackleHP.connect(crackleLP);
      crackleLP.connect(crackleGain); crackleGain.connect(gain);

      // Deep warm base
      const warmth = ctx.createBufferSource();
      warmth.buffer = makeBrownNoise(ctx, 4);
      warmth.loop = true;
      const warmLP = ctx.createBiquadFilter();
      warmLP.type = 'lowpass'; warmLP.frequency.value = 350;
      const warmGain = ctx.createGain(); warmGain.gain.value = 0.4;
      warmth.connect(warmLP); warmLP.connect(warmGain); warmGain.connect(gain);

      gain.connect(ambientEngine.master);
      if (ambientEngine.reverb) gain.connect(ambientEngine.reverb);
      crackle.start(); warmth.start(); crackLFO.start();
      nodes.push(crackle, warmth, crackLFO);
      break;
    }

    // ── SEAGULLS: synthesized calls using FM ────────────────────────────
    case 'seagulls': {
      // Base: distant wind (soft pink noise)
      const wind = ctx.createBufferSource();
      wind.buffer = makePinkNoise(ctx, 3);
      wind.loop = true;
      const windBP = ctx.createBiquadFilter();
      windBP.type = 'bandpass'; windBP.frequency.value = 800; windBP.Q.value = 1.5;
      const windG = ctx.createGain(); windG.gain.value = 0.35;
      wind.connect(windBP); windBP.connect(windG); windG.connect(gain);
      gain.connect(ambientEngine.master);
      if (ambientEngine.reverb) gain.connect(ambientEngine.reverb);
      wind.start();
      nodes.push(wind);
      break;
    }

    // ── Fallback: gentle pink noise ───────────────────────────────────────
    case 'spacePad': {
      const droneA = ctx.createOscillator();
      droneA.type = 'triangle'; droneA.frequency.value = 92;
      const droneB = ctx.createOscillator();
      droneB.type = 'sine'; droneB.frequency.value = 138;

      const padLP = ctx.createBiquadFilter();
      padLP.type = 'lowpass'; padLP.frequency.value = 780; padLP.Q.value = 0.7;
      const padMix = ctx.createGain(); padMix.gain.value = 0.25;

      const wobble = ctx.createOscillator();
      wobble.type = 'sine'; wobble.frequency.value = 0.06;
      const wobbleGain = ctx.createGain(); wobbleGain.gain.value = 120;
      wobble.connect(wobbleGain); wobbleGain.connect(padLP.frequency);

      droneA.connect(padMix);
      droneB.connect(padMix);
      padMix.connect(padLP); padLP.connect(gain);
      gain.connect(ambientEngine.master);
      if (ambientEngine.reverb) gain.connect(ambientEngine.reverb);

      droneA.start(); droneB.start(); wobble.start();
      nodes.push(droneA, droneB, wobble);
      break;
    }

    case 'stardust': {
      const sparkle = ctx.createBufferSource();
      sparkle.buffer = makeWhiteNoise(ctx, 2);
      sparkle.loop = true;
      const sparkleHP = ctx.createBiquadFilter();
      sparkleHP.type = 'highpass'; sparkleHP.frequency.value = 2200;
      const sparkleBP = ctx.createBiquadFilter();
      sparkleBP.type = 'bandpass'; sparkleBP.frequency.value = 3400; sparkleBP.Q.value = 0.8;
      const sparkleGain = ctx.createGain(); sparkleGain.gain.value = 0.18;

      const shimmer = ctx.createOscillator();
      shimmer.type = 'sine'; shimmer.frequency.value = 0.22;
      const shimmerGain = ctx.createGain(); shimmerGain.gain.value = 0.12;
      shimmer.connect(shimmerGain); shimmerGain.connect(sparkleGain.gain);

      sparkle.connect(sparkleHP); sparkleHP.connect(sparkleBP); sparkleBP.connect(sparkleGain); sparkleGain.connect(gain);
      gain.connect(ambientEngine.master);
      if (ambientEngine.reverb) gain.connect(ambientEngine.reverb);

      sparkle.start(); shimmer.start();
      nodes.push(sparkle, shimmer);
      break;
    }

    case 'signal': {
      const carrier = ctx.createOscillator();
      carrier.type = 'sine'; carrier.frequency.value = 420;
      const mod = ctx.createOscillator();
      mod.type = 'triangle'; mod.frequency.value = 5.6;
      const modGain = ctx.createGain(); modGain.gain.value = 24;
      mod.connect(modGain); modGain.connect(carrier.frequency);

      const pulse = ctx.createGain(); pulse.gain.value = 0.06;
      const pulseLfo = ctx.createOscillator();
      pulseLfo.type = 'sine'; pulseLfo.frequency.value = 0.14;
      const pulseDepth = ctx.createGain(); pulseDepth.gain.value = 0.05;
      pulseLfo.connect(pulseDepth); pulseDepth.connect(pulse.gain);

      carrier.connect(pulse); pulse.connect(gain);
      gain.connect(ambientEngine.master);
      if (ambientEngine.reverb) gain.connect(ambientEngine.reverb);

      carrier.start(); mod.start(); pulseLfo.start();
      nodes.push(carrier, mod, pulseLfo);
      break;
    }

    default: {
      const src = ctx.createBufferSource();
      src.buffer = makePinkNoise(ctx, 3);
      src.loop = true;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 900;
      src.connect(lp); lp.connect(gain);
      gain.connect(ambientEngine.master);
      if (ambientEngine.reverb) gain.connect(ambientEngine.reverb);
      src.start();
      nodes.push(src);
    }
  }

  return { gain, nodes };
}

function ensureAmbientChannel(key, type) {
  if (ambientEngine.channels[key]) return ambientEngine.channels[key];
  ambientEngine.channels[key] = buildSoundNode(type);
  return ambientEngine.channels[key];
}

function setAmbient(key, type, on, vol) {
  resumeAmbient();
  const ch = ensureAmbientChannel(key, type);
  const targetVol = on ? Math.max(0, Math.min(1, vol)) : 0;
  ch.gain.gain.setTargetAtTime(targetVol, ambientEngine.ctx.currentTime, 0.3);
}

function renderAmbientMixer() {
  const list = document.getElementById('ambientList');
  if (!list) return;
  const theme = getCurrentTheme();
  const channels = AMBIENT_SCENES[theme] || AMBIENT_SCENES.city;
  const prefs = getAmbientPrefs();

  list.innerHTML = channels.map(ch => {
    const key = `${theme}:${ch.id}`;
    const p = prefs[key] || {};
    const on = typeof p.on === 'boolean' ? p.on : ch.on;
    const vol = typeof p.vol === 'number' ? p.vol : ch.vol;
    return `<div class="ambient-channel">
      <div class="ambient-head">
        <span class="ambient-name"><span>${ch.icon}</span><span>${ch.label}</span></span>
        <input type="checkbox" ${on ? 'checked' : ''} onchange="toggleAmbient('${key}','${ch.type}',this.checked, Number(document.getElementById('vol-${key}').value) / 100)">
      </div>
      <input id="vol-${key}" type="range" min="0" max="100" value="${Math.round(vol * 100)}" oninput="changeAmbientVol('${key}','${ch.type}',this.value)">
    </div>`;
  }).join('');

  channels.forEach(ch => {
    const key = `${theme}:${ch.id}`;
    const p = prefs[key] || {};
    setAmbient(key, ch.type, typeof p.on === 'boolean' ? p.on : ch.on, typeof p.vol === 'number' ? p.vol : ch.vol);
  });
}

function toggleAmbient(key, type, on, vol) {
  const prefs = getAmbientPrefs();
  prefs[key] = { on, vol };
  saveAmbientPrefs(prefs);
  setAmbient(key, type, on, vol);
}

function changeAmbientVol(key, type, value) {
  const prefs = getAmbientPrefs();
  const vol = Number(value) / 100;
  const on = prefs[key] ? !!prefs[key].on : true;
  prefs[key] = { on, vol };
  saveAmbientPrefs(prefs);
  setAmbient(key, type, on, vol);
}

function ambientAllOn() {
  const theme = getCurrentTheme();
  const channels = AMBIENT_SCENES[theme] || [];
  const prefs = getAmbientPrefs();
  channels.forEach(ch => {
    const key = `${theme}:${ch.id}`;
    const volEl = document.getElementById(`vol-${key}`);
    const vol = volEl ? Number(volEl.value) / 100 : ch.vol;
    prefs[key] = { on: true, vol };
    setAmbient(key, ch.type, true, vol);
  });
  saveAmbientPrefs(prefs);
  renderAmbientMixer();
}

function ambientAllOff() {
  const theme = getCurrentTheme();
  const channels = AMBIENT_SCENES[theme] || [];
  const prefs = getAmbientPrefs();
  channels.forEach(ch => {
    const key = `${theme}:${ch.id}`;
    const vol = prefs[key]?.vol ?? ch.vol;
    prefs[key] = { on: false, vol };
    setAmbient(key, ch.type, false, vol);
  });
  saveAmbientPrefs(prefs);
  renderAmbientMixer();
}

function renderSceneStrip() {
  const strip = document.getElementById('sceneStrip');
  if (!strip) return;
  strip.innerHTML = SCENE_THEMES.map(theme => (
    `<button class="scene-chip" data-scene="${theme.id}" onclick="setSceneTheme('${theme.id}')">${theme.emoji} ${theme.label}</button>`
  )).join('');
}

function setSceneTheme(themeId, persist = true) {
  const valid = SCENE_THEMES.some(t => t.id === themeId);
  const chosen = valid ? themeId : 'space';

  document.body.classList.remove('scene-space', 'scene-city', 'scene-beach', 'scene-rain', 'scene-cafe', 'scene-night');
  document.body.classList.add(`scene-${chosen}`);

  document.querySelectorAll('.scene-chip').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.scene === chosen);
  });

  if (persist) localStorage.setItem(THEME_KEY, chosen);
  renderAmbientMixer();
  if (!applyingRemoteSync) broadcastJamSync();
}

function updateNowMini(track) {
  const mini = document.getElementById('nowMini');
  const text = document.getElementById('nowMiniText');
  if (!mini || !text) return;

  if (!track) {
    mini.classList.remove('visible');
    text.textContent = 'Nothing playing';
    return;
  }

  mini.classList.add('visible');
  text.textContent = `${track.name} • ${track.artist}`;
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
  if (!clientId) { 
    return; // Don't call showSetup here - let caller handle it
  }
  const v = genVerifier();
  const c = await genChallenge(v);
  localStorage.setItem(VERIFIER_KEY, v);
  const p = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: 'user-read-private user-read-email playlist-read-private playlist-read-collaborative',
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

async function fetchMyMixes() {
  const token = await getToken();
  if (!token) return [];
  const r = await fetch('https://api.spotify.com/v1/me/playlists?limit=30', {
    headers: { Authorization: 'Bearer ' + token }
  });
  if (!r.ok) return [];
  const d = await r.json();
  return d.items || [];
}

async function fetchPlaylistTracks(playlistId, limit = 5) {
  const token = await getToken();
  if (!token) return [];
  const r = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${limit}&fields=items(track(id,name,duration_ms,artists(name),album(images)))`, {
    headers: { Authorization: 'Bearer ' + token }
  });
  if (!r.ok) return [];
  const d = await r.json();
  return (d.items || []).map(i => i.track).filter(Boolean);
}

async function loadSpotifyMixes() {
  const results = document.getElementById('playlistResults');
  if (!results) return;

  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    renderPlaylistSearchResults([], 'Connect Spotify to load your playlists');
    return;
  }

  renderPlaylistSearchResults([], 'Your playlists are ready to browse');
  await doPlaylistSearch(true);
}

async function searchSpotifyPlaylists(query) {
  if (!query) return fetchMyMixes();
  const token = await getToken();
  if (!token) return [];
  const params = new URLSearchParams({
    q: query,
    type: 'playlist',
    limit: '8',
  });
  const r = await fetch(`https://api.spotify.com/v1/search?${params.toString()}`, {
    headers: { Authorization: 'Bearer ' + token }
  });
  if (!r.ok) return [];
  const d = await r.json();
  return d.playlists?.items || [];
}

function renderPlaylistSearchResults(playlists, message) {
  const results = document.getElementById('playlistResults');
  if (!results) return;

  const statusMarkup = `<div class="field-hint" id="mixesStatus">${esc(message || '')}</div>`;
  if (!playlists.length) {
    results.innerHTML = statusMarkup;
    return;
  }

  results.innerHTML = statusMarkup + playlists.map((playlist) => {
    const image = playlist.images?.[0]?.url || '';
    const owner = playlist.owner?.display_name || 'Spotify';
    const tracks = playlist.tracks?.total ?? '?';
    return `<div class="playlist-result-card">
      ${image ? `<img class="playlist-result-art" src="${image}" alt="${esc(playlist.name)}">` : '<div class="playlist-result-art playlist-result-art-fallback">♫</div>'}
      <div class="playlist-result-copy">
        <div class="playlist-result-name">${esc(playlist.name)}</div>
        <div class="playlist-result-meta">${esc(owner)} • ${tracks} tracks</div>
      </div>
      <button class="playlist-result-btn" type="button" onclick="importPlaylistTracks('${playlist.id}')">Queue 5</button>
    </div>`;
  }).join('');
}

async function doPlaylistSearch(skipInputRead = false) {
  const input = document.getElementById('playlistSearchInput');
  const query = skipInputRead ? '' : (input?.value || '').trim();
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    renderPlaylistSearchResults([], 'Connect Spotify to search playlists');
    return;
  }

  renderPlaylistSearchResults(playlistMixCache, query ? `Searching for "${query}"...` : 'Loading your playlists...');
  const playlists = await searchSpotifyPlaylists(query);
  playlistMixCache = playlists;

  if (!playlists.length) {
    renderPlaylistSearchResults([], query ? 'No playlists matched that search' : 'No playlists found in your Spotify account');
    return;
  }

  renderPlaylistSearchResults(playlists, query ? `${playlists.length} playlists found` : `${playlists.length} playlists loaded`);
}

async function importPlaylistTracks(playlistId) {
  if (!playlistId) {
    showToast('Pick a playlist first');
    return;
  }

  renderPlaylistSearchResults(playlistMixCache, 'Pulling tracks into the room queue...');
  const tracks = await fetchPlaylistTracks(playlistId, 12);
  if (!tracks.length) {
    showToast('Could not load tracks from that playlist');
    renderPlaylistSearchResults(playlistMixCache, 'Could not load tracks from that playlist');
    return;
  }

  let added = 0;
  for (const track of uniqueRandom(tracks, 5)) {
    if (addTrack(track)) added++;
    if (getState().queue.length >= MAX_QUEUE) break;
  }

  renderPlaylistSearchResults(playlistMixCache, `Queued ${added} tracks from that playlist`);
  showToast(added ? `Queued ${added} playlist tracks` : 'Room queue is already full');
}

// ============================================================
//  QUEUE MANAGEMENT
// ============================================================
function addTrack(track) {
  const state = getState();
  if (state.queue.length >= MAX_QUEUE) { showToast('Queue is full! Wait for a song to play 🎵'); return false; }
  if (state.queue.find(t => t.id === track.id)) { showToast('That song is already in the queue!'); return false; }
  const sid = getSessionId();
  state.queue.push({
    id: track.id,
    name: track.name,
    artist: track.artists[0].name,
    image: track.album?.images?.[1]?.url || track.album?.images?.[0]?.url || '',
    durationMs: track.duration_ms || track.durationMs || DEFAULT_TRACK_MS,
    votes: 0,
    voters: [],
    addedBy: sid,
    addedAt: Date.now(),
  });
  saveState(state);

  // Auto-start instantly when the first song is queued and nothing is playing.
  if (!state.nowPlaying && state.queue.length === 1) {
    playTopSong();
  }

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
  state.nowPlaying = {
    ...top,
    startedAt: Date.now(),
    durationMs: top.durationMs || DEFAULT_TRACK_MS,
    isPaused: false,
    pausedAt: null,
  };
  state.queue = state.queue.filter(t => t.id !== top.id);
  saveState(state);
  showToast('Now playing: ' + top.name + ' ✨');
}

// ============================================================
//  RENDER
// ============================================================
function renderAll() {
  renderNowPlaying();
  renderPlayerBar();
  updateTransportButtons();
  renderQueue();
  renderSuggestions();
}

function renderNowPlaying() {
  const state = getState();
  const wrap = document.getElementById('nowPlayingWrap');
  if (!wrap) return;

  const np = state.nowPlaying;
  const currentRenderedId = wrap.dataset.trackId || '';
  const currentPaused = wrap.dataset.paused === '1';

  if (!np) {
    if (currentRenderedId === 'none') {
      updateNowMini(null);
      return;
    }

    // Clear autoplay timer when no track is playing
    if (autoPlayTimeoutId) clearTimeout(autoPlayTimeoutId);
    
    destroySpotifyController();
    wrap.dataset.trackId = 'none';
    wrap.dataset.paused = '0';
    updateNowMini(null);
    updateTransportButtons();
    wrap.innerHTML = `<div class="no-playing">
      <div class="no-playing-icon">🎵</div>
      <p>Nothing playing yet.<br><strong>Vote for a song</strong> or add one to the queue!</p>
    </div>`;
    return;
  }

  const isPaused = !!np.isPaused;
  const trackChanged = currentRenderedId !== np.id;
  const pausedChanged = currentPaused !== isPaused;

  // ── Nothing changed: just keep volume in sync and bail ──────────────
  if (!trackChanged && !pausedChanged) {
    updateNowMini(np);
    applySpotifyVolume();
    return;
  }

  // ── Pause/resume only — keep the embed alive, just call the controller ──
  if (!trackChanged && pausedChanged) {
    wrap.dataset.paused = isPaused ? '1' : '0';
    updateNowMini(np);
    updateTransportButtons();
    if (spotifyController) {
      try {
        if (isPaused) {
          if (typeof spotifyController.pause === 'function') spotifyController.pause();
        } else {
          if (typeof spotifyController.play  === 'function') spotifyController.play();
          applySpotifyVolume(80);
        }
      } catch {}
    }
    return;
  }

  // ── Track changed (or first mount) ──────────────────────────────────
  wrap.dataset.trackId = np.id;
  wrap.dataset.paused  = isPaused ? '1' : '0';
  updateNowMini(np);
  updateTransportButtons();

  if (isPaused) {
    // Mounted while paused — show placeholder, no autoplay
    if (autoPlayTimeoutId) clearTimeout(autoPlayTimeoutId);
    destroySpotifyController();
    wrap.innerHTML = `<div class="no-playing">
      <div class="no-playing-icon">⏸</div>
      <p><strong>${esc(np.name)}</strong><br>Paused — hit Resume to start</p>
    </div>`;
    return;
  }

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - (np.startedAt || Date.now())) / 1000));
  const mounted = mountSpotifyTrackEmbed(np.id, elapsedSeconds);

  if (!mounted) {
    // Fallback: plain iframe (Spotify IFrame API not ready yet)
    const startSuffix = elapsedSeconds > 0 ? `&t=${elapsedSeconds}` : '';
    wrap.innerHTML = `<iframe
      src="https://open.spotify.com/embed/track/${np.id}?utm_source=generator&theme=0${startSuffix}"
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

  countEl.textContent = `${state.queue.length} / ${MAX_QUEUE} songs`;
  playBtn.disabled = state.queue.length === 0;
  suggestBtn.disabled = state.queue.length >= MAX_QUEUE;

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

function formatMs(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function renderPlayerBar() {
  if (!document.getElementById('playerArt')) return;
  const state = getState();
  const np = state.nowPlaying;
  const artistName = np ? (np.artist || np.artists?.[0]?.name || 'Unknown artist') : '';
  const artEl = document.getElementById('playerArt');
  const nameEl = document.getElementById('playerTrackName');
  const artistEl = document.getElementById('playerTrackArtist');
  const curEl = document.getElementById('playerTimeCurrent');
  const totalEl = document.getElementById('playerTimeTotal');
  const fillEl = document.getElementById('playerProgressFill');

  if (!np) {
    artEl.innerHTML = '<span class="player-art-fallback">♪</span>';
    nameEl.textContent = 'No active track';
    artistEl.textContent = 'Vote and play to start the room soundtrack';
    curEl.textContent = '0:00';
    totalEl.textContent = '0:00';
    fillEl.style.width = '0%';
    updateTransportButtons();
    return;
  }

  artEl.innerHTML = np.image
    ? `<img src="${np.image}" alt="${esc(np.name)}">`
    : '<span class="player-art-fallback">🎵</span>';
  nameEl.textContent = np.name;
  artistEl.textContent = np.isPaused
    ? `${artistName} • paused in the lounge`
    : `${artistName} • synced room playback`;

  const startedAt = np.startedAt || Date.now();
  const duration = np.durationMs || DEFAULT_TRACK_MS;
  const elapsedBase = np.isPaused ? ((np.pausedAt || Date.now()) - startedAt) : (Date.now() - startedAt);
  const elapsed = Math.max(0, Math.min(duration, elapsedBase));
  const pct = duration ? (elapsed / duration * 100) : 0;

  curEl.textContent = formatMs(elapsed);
  totalEl.textContent = formatMs(duration);
  fillEl.style.width = `${pct}%`;
  updateTransportButtons();
}

function scrubPlayer(event) {
  if (!document.getElementById('playerProgress')) return;
  const state = getState();
  if (!state.nowPlaying) return;
  const bar = document.getElementById('playerProgress');
  const rect = bar.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  const duration = state.nowPlaying.durationMs || DEFAULT_TRACK_MS;
  const targetOffset = Math.floor(duration * ratio);
  if (state.nowPlaying.isPaused) {
    state.nowPlaying.startedAt = Date.now() - targetOffset;
    state.nowPlaying.pausedAt = Date.now();
  } else {
    state.nowPlaying.startedAt = Date.now() - targetOffset;
  }
  saveState(state);
}

function togglePlayerPlayback() {
  if (!document.getElementById('playerToggleBtn')) return;
  const state = getState();
  if (!state.nowPlaying) return;
  const np = state.nowPlaying;

  if (np.isPaused) {
    const pauseAt = np.pausedAt || Date.now();
    np.startedAt = (np.startedAt || Date.now()) + (Date.now() - pauseAt);
    np.isPaused = false;
    np.pausedAt = null;
    showToast('Resumed ▶');
  } else {
    np.isPaused = true;
    np.pausedAt = Date.now();
    showToast('Paused ❚❚');
  }

  saveState(state);
}

function restartPlayerTrack() {
  const state = getState();
  if (!state.nowPlaying) return;
  state.nowPlaying.startedAt = Date.now();
  state.nowPlaying.pausedAt = null;
  state.nowPlaying.isPaused = false;
  saveState(state);
  showToast('Restarted track ⏮');
}

function maybeAutoAdvanceJam() {
  if (autoAdvanceLock) return;

  const state = getState();
  const np = state.nowPlaying;
  if (!np) return;
  if (np.isPaused) return;

  const hasQueuedNext = state.queue.length > 0;
  if (!repeatTrackEnabled && !hasQueuedNext) return;

  // Fallback signal: local timer elapsed full track duration.
  const startedAt = np.startedAt || 0;
  const duration = np.durationMs || DEFAULT_TRACK_MS;
  const elapsed = Date.now() - startedAt;
  const endedByTimer = elapsed >= duration + 1200;

  if (!endedByTimer) return;

  autoAdvanceLock = true;
  if (repeatTrackEnabled) {
    jamRestartTrack();
    showToast('Repeating current track');
  } else {
    playTopSong();
    showToast('Jam keeps rolling ▶ next track');
  }
  setTimeout(() => { autoAdvanceLock = false; }, 800);
}

function maybeAutoStartFromQueue() {
  const state = getState();
  if (state.nowPlaying) return;
  if (!state.queue.length) return;
  playTopSong();
}

function jamTogglePlayPause() {
  const state = getState();
  if (!state.nowPlaying) return;
  const np = state.nowPlaying;

  if (np.isPaused) {
    // Resume: adjust startedAt so elapsed time accounts for the pause gap
    const pauseAt = np.pausedAt || Date.now();
    np.startedAt = (np.startedAt || Date.now()) + (Date.now() - pauseAt);
    np.isPaused  = false;
    np.pausedAt  = null;
    // Tell the Spotify player to resume immediately (render will also catch it)
    if (spotifyController) {
      try { if (typeof spotifyController.play === 'function') spotifyController.play(); } catch {}
      applySpotifyVolume(60);
    }
    showToast('Resumed ▶');
  } else {
    np.isPaused = true;
    np.pausedAt = Date.now();
    // Tell the Spotify player to pause immediately
    if (spotifyController) {
      try { if (typeof spotifyController.pause === 'function') spotifyController.pause(); } catch {}
    }
    showToast('Paused ⏸');
  }

  updateTransportButtons();

  saveState(state);
  if (!applyingRemoteSync) broadcastJamSync();
}

function jamRestartTrack() {
  const state = getState();
  if (!state.nowPlaying) return;
  state.nowPlaying.startedAt = Date.now();
  state.nowPlaying.pausedAt  = null;
  state.nowPlaying.isPaused  = false;
  saveState(state);
  // Seek the live player to 0 and resume — avoids a full embed remount
  if (spotifyController) {
    try {
      if (typeof spotifyController.seekTo === 'function') spotifyController.seekTo(0);
      if (typeof spotifyController.play   === 'function') spotifyController.play();
      applySpotifyVolume(80);
    } catch {}
  }
  if (!applyingRemoteSync) broadcastJamSync();
  showToast('Track restarted ⏮');
}

function jamNextTrack() {
  const state = getState();
  if (!state.queue.length) {
    showToast('Queue is empty');
    return;
  }
  playTopSong();
  if (!applyingRemoteSync) broadcastJamSync();
  showToast('Skipped to next track for everyone ⏭');
}

function shuffleQueue() {
  const state = getState();
  if (state.queue.length < 2) {
    showToast('Add a few songs first');
    return;
  }

  for (let i = state.queue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [state.queue[i], state.queue[j]] = [state.queue[j], state.queue[i]];
  }

  saveState(state);
  if (!applyingRemoteSync) broadcastJamSync();
  renderAll();
  showToast('Queue shuffled for the room');
}

function toggleRepeatTrack() {
  repeatTrackEnabled = !repeatTrackEnabled;
  saveRepeatState();
  updateTransportButtons();
  showToast(repeatTrackEnabled ? 'Repeat current track on' : 'Repeat current track off');
}

function getSuggestions() {
  try { return JSON.parse(localStorage.getItem(SUGGESTIONS_KEY)) || []; }
  catch { return []; }
}

function saveSuggestions(items) {
  localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(items));
  if (bc) bc.postMessage({ type: 'suggestions', suggestions: items });
  if (!applyingRemoteSync) broadcastJamSync();
}

function renderSuggestions() {
  const list = document.getElementById('suggestionsList');
  if (!list) return;

  const items = getSuggestions().sort((a, b) => {
    if (b.votes !== a.votes) return b.votes - a.votes;
    return b.createdAt - a.createdAt;
  }).slice(0, 18);

  if (!items.length) {
    list.innerHTML = '<div class="suggestion-empty">No suggestions yet. Add one ✨</div>';
    return;
  }

  const sid = getSessionId();
  list.innerHTML = items.map(item => {
    const voted = (item.voters || []).includes(sid);
    return `<div class="suggestion-item">
      <div class="suggestion-main">
        <div class="suggestion-text">${esc(item.text)}</div>
        <div class="suggestion-meta">${esc(item.by || 'Anonymous')}</div>
      </div>
      <button class="suggestion-vote" onclick="voteSuggestion('${item.id}')">${voted ? '💜' : '🤍'} ${item.votes || 0}</button>
    </div>`;
  }).join('');
}

function submitSuggestion(event) {
  event.preventDefault();
  const nameEl = document.getElementById('suggestName');
  const textEl = document.getElementById('suggestText');
  const text = textEl.value.trim();
  const by = nameEl.value.trim();
  if (!text) return;

  const items = getSuggestions();
  items.push({
    id: Math.random().toString(36).slice(2, 10),
    text,
    by,
    votes: 0,
    voters: [],
    createdAt: Date.now(),
  });
  saveSuggestions(items);
  textEl.value = '';
  showToast('Suggestion shared 💡');
  renderSuggestions();
}

function voteSuggestion(id) {
  const sid = getSessionId();
  const items = getSuggestions();
  const item = items.find(s => s.id === id);
  if (!item) return;

  item.voters = item.voters || [];
  if (item.voters.includes(sid)) {
    item.voters = item.voters.filter(v => v !== sid);
    item.votes = Math.max(0, (item.votes || 0) - 1);
  } else {
    item.voters.push(sid);
    item.votes = (item.votes || 0) + 1;
  }

  saveSuggestions(items);
  renderSuggestions();
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
  filtered.forEach(t => { _searchCache[t.id] = { id:t.id, name:t.name, artists:[{name:t.artist}], album:{images:[]}, duration_ms: DEFAULT_TRACK_MS }; });
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
  hideSetup();
  // Redirect to Spotify auth
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

function sanitizeRoomCode(raw) {
  return (raw || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32);
}

function roomShareUrl(code) {
  const url = new URL(window.location.href);
  url.searchParams.set('room', code);
  const clientId = localStorage.getItem(CLIENT_KEY);
  if (clientId) url.searchParams.set('cid', clientId);
  url.searchParams.delete('code');
  url.searchParams.delete('error');
  return url.toString();
}

function applySharedClientId(sharedClientId, notify = false) {
  const cid = (sharedClientId || '').trim();
  if (!cid) return false;

  const current = (localStorage.getItem(CLIENT_KEY) || '').trim();
  const changed = current !== cid;

  if (changed) {
    // Enforce host app credentials for this jam and drop tokens tied to other apps.
    localStorage.setItem(CLIENT_KEY, cid);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(EXPIRY_KEY);
  }

  if (localStorage.getItem(DEMO_KEY) === '1') {
    localStorage.removeItem(DEMO_KEY);
    updateSpotifyBadge(false, false);
  }

  if (changed) {
    sessionStorage.removeItem(AUTO_AUTH_KEY);
    updateSpotifyBadge(false, false);
    if (notify) showToast('Using host Spotify app for this jam');
  }

  return changed;
}

function getJamParticipantCount() {
  const openConns = jamConnections.filter(c => c && c.open).length;
  return openConns + 1; // +1 for self (host)
}

function updateJamOverlayFields() {
  const code = jamRoomCode || sanitizeRoomCode(new URLSearchParams(window.location.search).get('room')) || '';
  const codeInput = document.getElementById('jamCodeInput');
  const linkInput = document.getElementById('jamLinkInput');
  const status = document.getElementById('jamStatusText');
  const presence = document.getElementById('jamPresence');
  if (codeInput) codeInput.value = code;
  if (linkInput) linkInput.value = code ? roomShareUrl(code) : '';

  const participants = code ? getJamParticipantCount() : 1;
  if (presence) {
    presence.textContent = participants === 1 ? '1 here' : `${participants} here`;
    presence.classList.toggle('active', participants > 1);
  }

  if (status) {
    if (!code) {
      status.textContent = 'Not connected';
    } else {
      const peerOk = jamConnections.some(c => c && c.open);
      const connStatus = peerOk ? '🟢 Connected' : '🟡 Waiting';
      const participantText = participants === 1 ? 'you' : `${participants} people`;
      status.textContent = `${connStatus} in room ${code} • ${participantText}`;
    }
  }
}

function openJamOverlay() {
  updateJamOverlayFields();
  document.getElementById('jamOverlay').classList.remove('hidden');
}

function closeJamOverlay() {
  document.getElementById('jamOverlay').classList.add('hidden');
}

async function copyJamLink() {
  const linkInput = document.getElementById('jamLinkInput');
  if (!linkInput || !linkInput.value) {
    showToast('Start a room first');
    return;
  }

  try {
    await navigator.clipboard.writeText(linkInput.value);
    showToast('Jam link copied 🔗');
  } catch {
    linkInput.select();
    document.execCommand('copy');
    showToast('Jam link copied 🔗');
  }
}

function disconnectJamPeer() {
  jamConnections.forEach(conn => {
    try { conn.close(); } catch {}
  });
  jamConnections = [];
  if (jamPeer) {
    try { jamPeer.destroy(); } catch {}
    jamPeer = null;
  }
}

function jamPayload() {
  return {
    type: 'sync',
    id: `${getSessionId()}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    from: getSessionId(),
    ts: Date.now(),
    clientId: localStorage.getItem(CLIENT_KEY) || '',
    state: getState(),
    suggestions: getSuggestions(),
    theme: getCurrentTheme(),
    ambientPrefs: getAmbientPrefs(),
    djState,
    repeatTrackEnabled,
  };
}

function applyJamPayload(payload) {
  if (!payload || payload.type !== 'sync') return;
  if (payload.from === getSessionId()) return;

  if (payload.id) {
    if (jamSeenMessageIds.has(payload.id)) return;
    jamSeenMessageIds.add(payload.id);
    if (jamSeenMessageIds.size > 300) {
      const first = jamSeenMessageIds.values().next();
      if (!first.done) jamSeenMessageIds.delete(first.value);
    }
  }

  // Keep a local marker for diagnostics only; avoid clock-based filtering across devices.
  jamLastTs = payload.ts || Date.now();

  applyingRemoteSync = true;
  try {
    if (payload.state) localStorage.setItem(STATE_KEY, JSON.stringify(payload.state));
    if (payload.suggestions) localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(payload.suggestions));
    if (payload.clientId) applySharedClientId(payload.clientId, false);
    if (payload.theme) setSceneTheme(payload.theme, true);
    if (payload.ambientPrefs) localStorage.setItem(AMBIENT_PREFS_KEY, JSON.stringify(payload.ambientPrefs));
    if (payload.djState) {
      djState = {
        enabled: !!payload.djState.enabled,
        vibe: DJ_LIBRARY[payload.djState.vibe] ? payload.djState.vibe : 'lofi',
      };
      localStorage.setItem(DJ_STATE_KEY, JSON.stringify(djState));
    }
    if (typeof payload.repeatTrackEnabled === 'boolean') {
      repeatTrackEnabled = payload.repeatTrackEnabled;
      localStorage.setItem(REPEAT_TRACK_KEY, repeatTrackEnabled ? '1' : '0');
    }
  } finally {
    applyingRemoteSync = false;
  }

  renderAmbientMixer();
  updateMasterVolumeUI();
  updatePlayerRangeTrack();
  updateSpotifyVolumeUI();
  applyMasterVolume(0.08);
  applySpotifyVolume(0);
  updateDjControls();
  updateTransportButtons();
  renderAll();
}

function broadcastJamSync() {
  const payload = jamPayload();
  jamConnections = jamConnections.filter(c => c && c.open);
  jamConnections.forEach(conn => {
    try { conn.send(payload); } catch {}
  });
  updateJamOverlayFields();
}

function bindJamConnection(conn) {
  if (!conn) return;
  jamConnections.push(conn);

  conn.on('open', () => {
    updateJamOverlayFields();
    conn.send(jamPayload());
    showToast('Friend joined the jam 🤝');
  });

  conn.on('data', (data) => {
    applyJamPayload(data);
  });

  conn.on('close', () => {
    jamConnections = jamConnections.filter(c => c !== conn);
    updateJamOverlayFields();
  });
}

function startJamRoom() {
  const input = document.getElementById('jamCodeInput');
  const code = sanitizeRoomCode(input ? input.value : '');
  if (!code) {
    showToast('Enter a room code first');
    return;
  }

  if (typeof Peer === 'undefined') {
    showToast('Jam service unavailable right now');
    return;
  }

  jamRoomCode = code;
  const url = new URL(window.location.href);
  url.searchParams.set('room', code);
  history.replaceState({}, '', url.toString());
  updateJamOverlayFields();

  disconnectJamPeer();

  const hostId = `lofi-jam-${code}`;
  jamPeer = new Peer(hostId);

  jamPeer.on('open', () => {
    showToast(`Room ${code} live`);
    updateJamOverlayFields();
  });

  jamPeer.on('connection', (conn) => {
    bindJamConnection(conn);
  });

  jamPeer.on('error', (err) => {
    // If host ID exists, join as guest.
    if (String(err?.type || '').includes('unavailable-id')) {
      try { jamPeer.destroy(); } catch {}
      jamPeer = new Peer();
      jamPeer.on('open', () => {
        const conn = jamPeer.connect(hostId, { reliable: true });
        bindJamConnection(conn);
        updateJamOverlayFields();
      });
      return;
    }
    showToast('Jam connection issue');
  });
}

function initializeJamFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const room = sanitizeRoomCode(params.get('room'));
  const cid = (params.get('cid') || '').trim();

  applySharedClientId(cid, true);

  if (!room) {
    updateJamOverlayFields();
    return;
  }

  const codeInput = document.getElementById('jamCodeInput');
  if (codeInput) codeInput.value = room;
  jamRoomCode = room;
  startJamRoom();
}

function bindKeyboardShortcuts() {
  document.addEventListener('keydown', (event) => {
    const tag = (event.target && event.target.tagName) ? event.target.tagName.toLowerCase() : '';
    const inField = tag === 'input' || tag === 'textarea';

    if (event.key === 'Escape') {
      closeSearch();
      return;
    }

    if (inField) return;

    if (event.key === '/') {
      event.preventDefault();
      openSearch();
      return;
    }

    if (event.key.toLowerCase() === 'p') {
      playTopSong();
    }
  });
}

function handleSpotifyBadgeClick() {
  const token = localStorage.getItem(TOKEN_KEY);
  const demo  = localStorage.getItem(DEMO_KEY) === '1';
  if (!token && !demo) { showSetup(); }
  else if (demo) {
    localStorage.removeItem(DEMO_KEY);
    updateSpotifyBadge(false, false);
    showSetup();
    showToast('Demo mode off. Connect Spotify to unlock full access.');
  }
  else {
    if (confirm('Disconnect Spotify?')) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(EXPIRY_KEY);
      playlistMixCache = [];
      renderPlaylistSearchResults([], 'Connect Spotify to search playlists');
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
    loadSpotifyMixes();
  } else if (demo) {
    badge.classList.remove('disconnected');
    badge.style.color = '#94a3b8';
    badge.style.background = 'rgba(148,163,184,0.08)';
    badge.style.borderColor = 'rgba(148,163,184,0.2)';
    text.textContent = 'Demo Mode';
  } else {
    badge.classList.add('disconnected');
    text.textContent = 'Connect Spotify';
    renderPlaylistSearchResults([], 'Connect Spotify to search playlists');
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
  loadMasterAudioState();
  loadSpotifyVolumeState();
  loadRepeatState();
  updateMasterVolumeUI();
  updatePlayerRangeTrack();
  updateSpotifyVolumeUI();
  bindMasterVolumeControls();
  bindSpotifyVolumeControls();
  updateTransportButtons();

  loadDjState();
  updateDjControls();

  renderSceneStrip();
  setSceneTheme(localStorage.getItem(THEME_KEY) || 'space', false);
  bindKeyboardShortcuts();
  renderAmbientMixer();
  renderSuggestions();
  initializeJamFromUrl();

  const params = new URLSearchParams(window.location.search);
  const code   = params.get('code');
  const error  = params.get('error');
  const sharedCid = (params.get('cid') || '').trim();

  // Handle OAuth callback
  if (code) {
    history.replaceState({}, '', '/');
    const token = await exchangeToken(code);
    if (token) {
      sessionStorage.removeItem(AUTO_AUTH_KEY);
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
      sessionStorage.removeItem(AUTO_AUTH_KEY);
      hideSetup();
      updateSpotifyBadge(true, false);
    } else if (demo) {
      hideSetup();
      updateSpotifyBadge(false, true);
    } else if (clientId) {
      // Has client ID but no valid token — show setup to try again
      updateSpotifyBadge(false, false);
      showSetup();
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
      if (e.data?.type === 'suggestions') renderSuggestions();
    };
  }

  setInterval(() => {
    maybeAutoStartFromQueue();
    maybeAutoAdvanceJam();
    runDjTick();
    renderPlayerBar();
  }, 1000);
  // Poll for updates every 5s (fallback)
  setInterval(renderAll, 5000);
})
();
