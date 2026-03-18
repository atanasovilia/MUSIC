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

const SCENE_THEMES = [
  { id: 'city',  emoji: '🌃', label: 'City' },
  { id: 'beach', emoji: '🌊', label: 'Beach' },
  { id: 'rain',  emoji: '🌧️', label: 'Rain' },
  { id: 'cafe',  emoji: '☕', label: 'Cafe' },
  { id: 'night', emoji: '🌙', label: 'Night' },
];

const AMBIENT_SCENES = {
  city: [
    { id: 'traffic', icon: '🚗', label: 'Traffic', type: 'pink-low', on: true, vol: 0.22 },
    { id: 'rain', icon: '🌧️', label: 'Neon Rain', type: 'white-band', on: false, vol: 0.18 },
    { id: 'wind', icon: '💨', label: 'High Wind', type: 'pink-high', on: false, vol: 0.14 },
  ],
  beach: [
    { id: 'waves', icon: '🌊', label: 'Waves', type: 'pink-low', on: true, vol: 0.24 },
    { id: 'wind', icon: '💨', label: 'Sea Wind', type: 'pink-high', on: true, vol: 0.14 },
    { id: 'foam', icon: '🫧', label: 'Foam Hiss', type: 'white-band', on: false, vol: 0.14 },
  ],
  rain: [
    { id: 'rain', icon: '🌧️', label: 'Rain', type: 'white-band', on: true, vol: 0.24 },
    { id: 'distant', icon: '🌩️', label: 'Distant Thunder', type: 'pink-low', on: false, vol: 0.16 },
    { id: 'room', icon: '🏠', label: 'Room Tone', type: 'pink-high', on: true, vol: 0.12 },
  ],
  cafe: [
    { id: 'room', icon: '☕', label: 'Cafe Room', type: 'pink-high', on: true, vol: 0.15 },
    { id: 'steam', icon: '♨️', label: 'Steam', type: 'white-band', on: false, vol: 0.12 },
    { id: 'street', icon: '🚕', label: 'Street', type: 'pink-low', on: false, vol: 0.14 },
  ],
  night: [
    { id: 'nightwind', icon: '🌬️', label: 'Night Wind', type: 'pink-high', on: true, vol: 0.12 },
    { id: 'hush', icon: '🦗', label: 'Night Hush', type: 'white-band', on: true, vol: 0.1 },
    { id: 'fire', icon: '🔥', label: 'Campfire', type: 'pink-low', on: false, vol: 0.14 },
  ],
};

const ambientEngine = {
  ctx: null,
  master: null,
  channels: {},
  ready: false,
  reverb: null,
};

let autoAdvanceLock = false;
let applyingRemoteSync = false;
let jamPeer = null;
let jamConnections = [];
let jamRoomCode = '';
let jamLastTs = 0;
let playlistMixCache = [];
let masterVolume = 0.28;
let masterMuted = false;
let spotifyVolume = 0.7;
let spotifyIframeApi = null;
let autoPlayTimeoutId = null;
let spotifyController = null;

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
  const range = document.getElementById('masterVolumeRange');
  const muteBtn = document.getElementById('masterMuteBtn');
  if (range) range.value = String(Math.round(masterVolume * 100));
  if (muteBtn) {
    muteBtn.classList.toggle('active', masterMuted);
    muteBtn.textContent = masterMuted ? 'Unmute' : 'Mute';
  }
}

function applyMasterVolume(ramp = 0.2) {
  if (!ambientEngine.ready || !ambientEngine.master) return;
  const target = masterMuted ? 0 : masterVolume;
  ambientEngine.master.gain.cancelScheduledValues(ambientEngine.ctx.currentTime);
  ambientEngine.master.gain.setTargetAtTime(target, ambientEngine.ctx.currentTime, ramp);
}

function setMasterVolumeFromUI(value) {
  masterVolume = Math.max(0, Math.min(1, Number(value) / 100));
  if (masterMuted && masterVolume > 0) masterMuted = false;
  saveMasterAudioState();
  updateMasterVolumeUI();
  resumeAmbient();
  applyMasterVolume(0.12);
}

function nudgeMasterVolume(deltaPct) {
  const next = Math.max(0, Math.min(100, Math.round(masterVolume * 100) + deltaPct));
  setMasterVolumeFromUI(next);
}

function toggleAmbientMute() {
  masterMuted = !masterMuted;
  saveMasterAudioState();
  updateMasterVolumeUI();
  resumeAmbient();
  applyMasterVolume(0.08);
}

function loadSpotifyVolumeState() {
  // Volume is now unified with master volume.
  return;
}

function updateSpotifyVolumeUI() {
  // Volume display is unified in volume-panel.
  return;
}

function applySpotifyVolume() {
  // Spotify embed volume is now unified with master volume control.
  return;
}

function onSpotifyPlaybackUpdate(event) {
  // Playback tracking removed - using simple timer fallback instead.
  return;
}

function mountSpotifyTrackEmbed(trackId, startSeconds = 0) {
  const wrap = document.getElementById('nowPlayingWrap');
  if (!wrap) return false;

  const host = document.createElement('div');
  host.id = 'spotifyEmbedHost';
  wrap.replaceChildren(host);

  if (!spotifyIframeApi || typeof spotifyIframeApi.createController !== 'function') {
    return false;
  }

  destroySpotifyController();

  spotifyIframeApi.createController(host, {
    uri: `spotify:track:${trackId}`,
    width: '100%',
    height: 152,
    theme: 'black',
  }, (controller) => {
    spotifyController = controller;

    if (typeof controller.play === 'function') {
      try { controller.play(); } catch {}
    }
  });

  return true;
}

function getCurrentTheme() {
  const cl = Array.from(document.body.classList).find(c => c.startsWith('scene-'));
  return cl ? cl.replace('scene-', '') : 'city';
}

function initAmbientEngine() {
  if (ambientEngine.ready) return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  ambientEngine.ctx = new Ctx();
  ambientEngine.master = ambientEngine.ctx.createGain();
  ambientEngine.master.gain.value = 0;

  const reverb = ambientEngine.ctx.createConvolver();
  const length = ambientEngine.ctx.sampleRate * 2.8;
  const impulse = ambientEngine.ctx.createBuffer(2, length, ambientEngine.ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const data = impulse.getChannelData(c);
    for (let i = 0; i < length; i++) {
      const decay = Math.pow(1 - i / length, 2.6);
      data[i] = (Math.random() * 2 - 1) * decay * 0.2;
    }
  }
  reverb.buffer = impulse;
  ambientEngine.reverb = reverb;

  const wet = ambientEngine.ctx.createGain();
  wet.gain.value = 0.18;
  reverb.connect(wet);
  wet.connect(ambientEngine.master);

  ambientEngine.master.connect(ambientEngine.ctx.destination);
  ambientEngine.ready = true;
  applyMasterVolume(1.4);
}

function resumeAmbient() {
  initAmbientEngine();
  if (ambientEngine.ctx && ambientEngine.ctx.state === 'suspended') ambientEngine.ctx.resume();
  applyMasterVolume(0.2);
}

function noiseBuffer(seconds = 2, color = 'white') {
  const n = ambientEngine.ctx.sampleRate * seconds;
  const b = ambientEngine.ctx.createBuffer(1, n, ambientEngine.ctx.sampleRate);
  const d = b.getChannelData(0);

  if (color === 'brown') {
    let last = 0;
    for (let i = 0; i < n; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      d[i] = last * 3.5;
    }
    return b;
  }

  if (color === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < n; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return b;
  }

  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

function buildAmbientNode(type) {
  const color = type === 'pink-low' ? 'brown' : 'pink';
  const src = ambientEngine.ctx.createBufferSource();
  src.buffer = noiseBuffer(4, color);
  src.loop = true;

  const hp = ambientEngine.ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 70;

  const lp = ambientEngine.ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 980;
  lp.Q.value = 0.5;

  if (type === 'white-band') {
    hp.frequency.value = 520;
    lp.frequency.value = 2800;
    lp.Q.value = 0.8;
  }
  if (type === 'pink-high') {
    hp.frequency.value = 180;
    lp.frequency.value = 1400;
  }

  const pan = ambientEngine.ctx.createStereoPanner();
  pan.pan.value = (Math.random() * 0.34) - 0.17;

  const gain = ambientEngine.ctx.createGain();
  gain.gain.value = 0;

  const lfo = ambientEngine.ctx.createOscillator();
  const lfoGain = ambientEngine.ctx.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = 0.04 + Math.random() * 0.08;
  lfoGain.gain.value = type === 'white-band' ? 90 : 55;
  lfo.connect(lfoGain);
  lfoGain.connect(lp.frequency);

  src.connect(hp);
  hp.connect(lp);
  lp.connect(pan);
  pan.connect(gain);
  gain.connect(ambientEngine.master);
  if (ambientEngine.reverb) gain.connect(ambientEngine.reverb);

  src.start();
  lfo.start();
  return { src, gain, lfo, lfoGain, hp, lp, pan };
}

function ensureAmbientChannel(key, type) {
  if (ambientEngine.channels[key]) return ambientEngine.channels[key];
  ambientEngine.channels[key] = buildAmbientNode(type);
  return ambientEngine.channels[key];
}

function setAmbient(key, type, on, vol) {
  resumeAmbient();
  const ch = ensureAmbientChannel(key, type);
  ch.gain.gain.setTargetAtTime(on ? Math.max(0, Math.min(1, vol)) : 0, ambientEngine.ctx.currentTime, 0.2);
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
  const chosen = valid ? themeId : 'city';

  document.body.classList.remove('scene-city', 'scene-beach', 'scene-rain', 'scene-cafe', 'scene-night');
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
  if (!clientId) { showSetup(); return; }
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
  const select = document.getElementById('mixesSelect');
  const status = document.getElementById('mixesStatus');
  if (!select || !status) return;

  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    select.innerHTML = '';
    status.textContent = 'Connect Spotify to load your playlists';
    return;
  }

  status.textContent = 'Loading your mixes...';
  const mixes = await fetchMyMixes();
  playlistMixCache = mixes;

  if (!mixes.length) {
    select.innerHTML = '';
    status.textContent = 'No playlists found in your Spotify account';
    return;
  }

  select.innerHTML = mixes.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  status.textContent = `${mixes.length} playlists loaded`;
}

async function importSelectedMixTracks() {
  const select = document.getElementById('mixesSelect');
  const status = document.getElementById('mixesStatus');
  if (!select || !select.value) {
    showToast('Select a playlist first');
    return;
  }

  const tracks = await fetchPlaylistTracks(select.value, 12);
  if (!tracks.length) {
    showToast('Could not load tracks from that playlist');
    return;
  }

  let added = 0;
  for (const track of uniqueRandom(tracks, 5)) {
    if (addTrack(track)) added++;
    if (getState().queue.length >= MAX_QUEUE) break;
  }

  if (status) status.textContent = `Imported ${added} tracks from mix`;
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
  
  // Clear any existing autoplay timeout
  if (autoPlayTimeoutId) clearTimeout(autoPlayTimeoutId);
  
  // Set up timer-based autoplay for when this track finishes
  const duration = state.nowPlaying.durationMs || DEFAULT_TRACK_MS;
  autoPlayTimeoutId = setTimeout(() => {
    const updated = getState();
    if (updated.nowPlaying && updated.nowPlaying.id === top.id && !updated.nowPlaying.isPaused && updated.queue.length > 0) {
      playTopSong();
      showToast('▶ Next track playing');
    }
  }, duration);
  
  showToast('Now playing: ' + top.name + ' ✨');
}

// ============================================================
//  RENDER
// ============================================================
function renderAll() {
  renderNowPlaying();
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
    const btn = document.getElementById('jamPlayPauseBtn');
    if (btn) btn.textContent = '⏯ Pause';
    wrap.innerHTML = `<div class="no-playing">
      <div class="no-playing-icon">🎵</div>
      <p>Nothing playing yet.<br><strong>Vote for a song</strong> or add one to the queue!</p>
    </div>`;
    return;
  }

  const isPaused = !!np.isPaused;
  const trackChanged = currentRenderedId !== np.id;
  const pausedChanged = currentPaused !== isPaused;

  if (!trackChanged && !pausedChanged) {
    updateNowMini(np);
    applySpotifyVolume();
    return;
  }

  wrap.dataset.trackId = np.id;
  wrap.dataset.paused = isPaused ? '1' : '0';
  updateNowMini(np);
  const btn = document.getElementById('jamPlayPauseBtn');
  if (btn) btn.textContent = isPaused ? '⏯ Resume' : '⏯ Pause';

  if (isPaused) {
    // Clear autoplay timer when paused
    if (autoPlayTimeoutId) clearTimeout(autoPlayTimeoutId);
    
    destroySpotifyController();
    wrap.innerHTML = `<div class="no-playing">
      <div class="no-playing-icon">⏸</div>
      <p><strong>${esc(np.name)}</strong><br>Paused for everyone in the jam room</p>
    </div>`;
    return;
  }

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - (np.startedAt || Date.now())) / 1000));
  const mounted = mountSpotifyTrackEmbed(np.id, elapsedSeconds);

  if (!mounted) {
    // Fallback if iframe API is not ready yet.
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
  const artEl = document.getElementById('playerArt');
  const nameEl = document.getElementById('playerTrackName');
  const artistEl = document.getElementById('playerTrackArtist');
  const curEl = document.getElementById('playerTimeCurrent');
  const totalEl = document.getElementById('playerTimeTotal');
  const fillEl = document.getElementById('playerProgressFill');
  const toggleBtn = document.getElementById('playerToggleBtn');

  if (!np) {
    artEl.innerHTML = '♪';
    nameEl.textContent = 'No active track';
    artistEl.textContent = 'Vote and play to start the room soundtrack';
    curEl.textContent = '0:00';
    totalEl.textContent = '0:00';
    fillEl.style.width = '0%';
    if (toggleBtn) toggleBtn.textContent = 'Pause';
    return;
  }

  artEl.innerHTML = np.image ? `<img src="${np.image}" alt="${esc(np.name)}">` : '🎵';
  nameEl.textContent = np.name;
  artistEl.textContent = np.artist;

  const startedAt = np.startedAt || Date.now();
  const duration = np.durationMs || DEFAULT_TRACK_MS;
  const elapsedBase = np.isPaused ? ((np.pausedAt || Date.now()) - startedAt) : (Date.now() - startedAt);
  const elapsed = Math.max(0, Math.min(duration, elapsedBase));
  const pct = duration ? (elapsed / duration * 100) : 0;

  curEl.textContent = formatMs(elapsed);
  totalEl.textContent = formatMs(duration);
  fillEl.style.width = `${pct}%`;
  if (toggleBtn) toggleBtn.textContent = np.isPaused ? 'Resume' : 'Pause';
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
    
    // Restart autoplay timer when resuming
    if (autoPlayTimeoutId) clearTimeout(autoPlayTimeoutId);
    const duration = np.durationMs || DEFAULT_TRACK_MS;
    const elapsedSinceStart = Date.now() - np.startedAt;
    const remainingMs = Math.max(0, duration - elapsedSinceStart);
    autoPlayTimeoutId = setTimeout(() => {
      const updated = getState();
      if (updated.nowPlaying && updated.nowPlaying.id === np.id && !updated.nowPlaying.isPaused && updated.queue.length > 0) {
        playTopSong();
        showToast('▶ Next track playing');
      }
    }, remainingMs);
  } else {
    np.isPaused = true;
    np.pausedAt = Date.now();
    showToast('Paused ❚❚');
    
    // Clear autoplay timer when paused
    if (autoPlayTimeoutId) clearTimeout(autoPlayTimeoutId);
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
  
  // Configure autoplay timer for restarted track
  if (autoPlayTimeoutId) clearTimeout(autoPlayTimeoutId);
  const duration = state.nowPlaying.durationMs || DEFAULT_TRACK_MS;
  const trackId = state.nowPlaying.id;
  autoPlayTimeoutId = setTimeout(() => {
    const updated = getState();
    if (updated.nowPlaying && updated.nowPlaying.id === trackId && !updated.nowPlaying.isPaused && updated.queue.length > 0) {
      playTopSong();
      showToast('▶ Next track playing');
    }
  }, duration);
  
  showToast('Restarted track ⏮');
}

function maybeAutoAdvanceJam() {
  // This is a fallback safety check in case timer didn't trigger
  // (e.g., in jam sync scenarios or system lag)
  if (autoAdvanceLock) return;

  const state = getState();
  const np = state.nowPlaying;
  if (!np) return;
  if (np.isPaused) return;

  const hasQueuedNext = state.queue.length > 0;
  if (!hasQueuedNext) return;

  // Only advance if significantly past the track duration (safety margin)
  const startedAt = np.startedAt || 0;
  const duration = np.durationMs || DEFAULT_TRACK_MS;
  const elapsed = Date.now() - startedAt;
  // Use a very generous margin since timer should handle exact timing
  const shouldAdvance = elapsed >= duration + 3000;

  if (!shouldAdvance) return;

  autoAdvanceLock = true;
  if (autoPlayTimeoutId) clearTimeout(autoPlayTimeoutId);
  playTopSong();
  showToast('▶ Queue advancing (fallback)');
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
    const pauseAt = np.pausedAt || Date.now();
    np.startedAt = (np.startedAt || Date.now()) + (Date.now() - pauseAt);
    np.isPaused = false;
    np.pausedAt = null;
    showToast('Resumed for everyone ▶');
    
    // Restart autoplay timer when resuming
    if (autoPlayTimeoutId) clearTimeout(autoPlayTimeoutId);
    const duration = np.durationMs || DEFAULT_TRACK_MS;
    const elapsedSinceStart = Date.now() - np.startedAt;
    const remainingMs = Math.max(0, duration - elapsedSinceStart);
    autoPlayTimeoutId = setTimeout(() => {
      const updated = getState();
      if (updated.nowPlaying && updated.nowPlaying.id === np.id && !updated.nowPlaying.isPaused && updated.queue.length > 0) {
        playTopSong();
        showToast('▶ Next track playing');
      }
    }, remainingMs);
  } else {
    np.isPaused = true;
    np.pausedAt = Date.now();
    showToast('Paused for everyone ⏸');
    
    // Clear autoplay timer when paused
    if (autoPlayTimeoutId) clearTimeout(autoPlayTimeoutId);
  }
  saveState(state);
  if (!applyingRemoteSync) broadcastJamSync();
}

function jamRestartTrack() {
  const state = getState();
  if (!state.nowPlaying) return;
  state.nowPlaying.startedAt = Date.now();
  state.nowPlaying.pausedAt = null;
  state.nowPlaying.isPaused = false;
  saveState(state);
  
  // Configure autoplay timer for restarted track
  if (autoPlayTimeoutId) clearTimeout(autoPlayTimeoutId);
  const duration = state.nowPlaying.durationMs || DEFAULT_TRACK_MS;
  const trackId = state.nowPlaying.id;
  autoPlayTimeoutId = setTimeout(() => {
    const updated = getState();
    if (updated.nowPlaying && updated.nowPlaying.id === trackId && !updated.nowPlaying.isPaused && updated.queue.length > 0) {
      playTopSong();
      showToast('▶ Next track playing');
    }
  }, duration);
  
  if (!applyingRemoteSync) broadcastJamSync();
  showToast('Track restarted for everyone');
}

function jamNextTrack() {
  const state = getState();
  if (!state.queue.length) {
    showToast('Queue is empty');
    return;
  }
  // Clear the autoplay timer since we're manually skipping
  if (autoPlayTimeoutId) clearTimeout(autoPlayTimeoutId);
  playTopSong();
  if (!applyingRemoteSync) broadcastJamSync();
  showToast('Skipped to next track for everyone ⏭');
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
  if (codeInput) codeInput.value = code;
  if (linkInput) linkInput.value = code ? roomShareUrl(code) : '';
  if (status) {
    if (!code) {
      status.textContent = 'Not connected';
    } else {
      const peerOk = jamConnections.some(c => c && c.open);
      const participants = getJamParticipantCount();
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
    ts: Date.now(),
    clientId: localStorage.getItem(CLIENT_KEY) || '',
    state: getState(),
    suggestions: getSuggestions(),
    theme: getCurrentTheme(),
    ambientPrefs: getAmbientPrefs(),
    djState,
  };
}

function applyJamPayload(payload) {
  if (!payload || payload.type !== 'sync') return;
  if (payload.ts <= jamLastTs) return;
  jamLastTs = payload.ts;

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
  } finally {
    applyingRemoteSync = false;
  }

  renderAmbientMixer();
  updateDjControls();
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
      const mixes = document.getElementById('mixesSelect');
      if (mixes) mixes.innerHTML = '';
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
    const status = document.getElementById('mixesStatus');
    if (status) status.textContent = 'Connect Spotify to load your playlists';
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
  updateMasterVolumeUI();

  loadDjState();
  updateDjControls();

  renderSceneStrip();
  setSceneTheme(localStorage.getItem(THEME_KEY) || 'city', false);
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
      if (sharedCid && sessionStorage.getItem(AUTO_AUTH_KEY) !== '1') {
        sessionStorage.setItem(AUTO_AUTH_KEY, '1');
        showToast('Connecting Spotify...');
        await initiateAuth();
        return;
      }
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
      if (e.data?.type === 'suggestions') renderSuggestions();
    };
  }

  setInterval(() => {
    maybeAutoStartFromQueue();
    maybeAutoAdvanceJam();
    runDjTick();
  }, 1000);
  // Poll for updates every 5s (fallback)
  setInterval(renderAll, 5000);
})();
