/*
  Музыка Hassaq.
  1) Если положить файл v3/assets/music.mp3 (например, трек с Pixabay) — играет он.
  2) Если файла нет — браузер сам играет спокойную мелодию в духе домбры
     (синтез щипковой струны Karplus–Strong, лад ре-минорной пентатоники, бурдон на открытых струнах).
*/
(() => {
  const FILE = window.HQ_MUSIC_FILE || 'assets/music.mp3';
  const VOL = 0.55;
  let ctx, master, mode = null, playing = false, timer = null, audioEl = null;

  /* ---------- file mode ---------- */
  const hasFile = fetch(FILE, { method: 'HEAD' }).then(r => r.ok && /audio|mpeg|octet/.test(r.headers.get('content-type') || 'audio')).catch(() => false);

  /* ---------- synth mode ---------- */
  const D3 = 146.83;
  const hz = s => D3 * Math.pow(2, s / 12);
  const bufCache = new Map();

  function pluckBuffer(freq, dur = 3.2, bright = 0.5) {
    const key = freq.toFixed(2) + bright;
    if (bufCache.has(key)) return bufCache.get(key);
    const sr = ctx.sampleRate, len = Math.floor(sr * dur);
    const buf = ctx.createBuffer(1, len, sr), d = buf.getChannelData(0);
    const N = Math.round(sr / freq);
    const ring = new Float32Array(N);
    let prev = 0;
    for (let i = 0; i < N; i++) { const n = Math.random() * 2 - 1; prev = prev + bright * (n - prev); ring[i] = prev; }
    let idx = 0, last = 0;
    const decay = 0.996;
    for (let i = 0; i < len; i++) {
      const cur = ring[idx];
      const nxt = ring[(idx + 1) % N];
      const v = decay * 0.5 * (cur + nxt);
      ring[idx] = v;
      d[i] = cur * 0.9 + last * 0.1; last = cur;
      idx = (idx + 1) % N;
    }
    // soft attack to avoid clicks
    for (let i = 0; i < 64; i++) d[i] *= i / 64;
    bufCache.set(key, buf);
    return buf;
  }

  function impulse(sec = 3.2) {
    const sr = ctx.sampleRate, len = sr * sec;
    const b = ctx.createBuffer(2, len, sr);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    return b;
  }

  let bus;
  function buildGraph() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0;
    master.connect(ctx.destination);
    // dombra body: warm low-pass + resonance bump
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200; lp.Q.value = 0.4;
    const body = ctx.createBiquadFilter(); body.type = 'peaking'; body.frequency.value = 240; body.gain.value = 5; body.Q.value = 1.2;
    const rev = ctx.createConvolver(); rev.buffer = impulse();
    const wet = ctx.createGain(); wet.gain.value = 0.32;
    const dry = ctx.createGain(); dry.gain.value = 0.85;
    bus = ctx.createGain();
    bus.connect(body); body.connect(lp);
    lp.connect(dry); dry.connect(master);
    lp.connect(rev); rev.connect(wet); wet.connect(master);
  }

  function pluck(semi, t, vel = 0.5, bright = 0.5, pan = 0) {
    const src = ctx.createBufferSource();
    src.buffer = pluckBuffer(hz(semi), 3.2, bright);
    src.detune.value = (Math.random() - 0.5) * 6;
    const g = ctx.createGain(); g.gain.value = vel;
    let node = g;
    if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); node = p; }
    src.connect(g); node.connect(bus);
    src.start(t);
  }

  // D minor pentatonic + 2nd (D E F G A C) — semitones from D3
  // Melodic phrases on an eighth-note grid (null = rest); calm, küy-like contour.
  const P = [
    [12, null, 10, null, 7, 10, 12, null, 15, null, 12, 10, 7, null, null, null],
    [7, null, 5, 7, 10, null, 7, null, 5, 3, 0, null, 3, null, null, null],
    [12, 14, 15, null, 14, 12, 10, null, 12, null, 10, 7, 10, null, null, null],
    [19, null, 17, 15, 12, null, 15, null, 14, 12, 10, null, 12, null, null, null],
    [0, 3, 5, null, 7, null, 10, 7, 5, null, 3, null, 0, null, null, null],
    [15, null, 12, null, 10, 12, 10, 7, 5, null, 7, null, 7, null, null, null]
  ];
  const ORDER = [0, 1, 2, 1, 3, 5, 4, 1];
  const EIGHTH = 60 / 72 / 2;           // 72 bpm
  let step = 0, phraseIdx = 0, nextT = 0;

  function schedule() {
    while (nextT < ctx.currentTime + 0.25) {
      const phrase = P[ORDER[phraseIdx % ORDER.length]];
      const i = step % 16;
      const note = phrase[i];
      // drone: open strings (D2 and A2) like a dombra strum, softly
      if (i % 4 === 0) {
        pluck(-12, nextT, 0.22, 0.35, -0.2);
        pluck(-5, nextT + 0.012, 0.14, 0.35, -0.1);
      }
      if (note !== null) {
        const swing = (i % 2) ? EIGHTH * 0.08 : 0;
        const vel = 0.38 + Math.random() * 0.12;
        pluck(note, nextT + swing, vel, 0.55, 0.15);
        // occasional grace-note ornament (қағыс)
        if (Math.random() < 0.18 && i % 2 === 0) pluck(note + 2, nextT + swing - 0.06, vel * 0.5, 0.6, 0.15);
      }
      nextT += EIGHTH;
      step++;
      if (step % 16 === 0) { phraseIdx++; if (phraseIdx % 8 === 0) nextT += EIGHTH * 4; }
    }
  }

  function fade(to, sec) {
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(to, t + sec);
  }

  /* ---------- public API ---------- */
  async function start() {
    if (playing) return;
    playing = true;
    if (!ctx) buildGraph();
    if (ctx.state === 'suspended') await ctx.resume();
    if (mode === null) mode = (await hasFile) ? 'file' : 'synth';
    if (mode === 'file') {
      if (!audioEl) {
        audioEl = new Audio(FILE); audioEl.loop = true; audioEl.crossOrigin = 'anonymous';
        ctx.createMediaElementSource(audioEl).connect(master);
      }
      audioEl.play().catch(() => {});
    } else {
      nextT = ctx.currentTime + 0.1;
      clearInterval(timer);
      timer = setInterval(schedule, 60);
      schedule();
    }
    fade(VOL, mode === 'file' ? 4 : 2.5);   // мягкое нарастание
    window.dispatchEvent(new CustomEvent('hassaq-music', { detail: true }));
  }
  function stop() {
    if (!playing) return;
    playing = false;
    fade(0, 0.8);
    setTimeout(() => {
      if (playing) return;
      clearInterval(timer);
      if (audioEl) audioEl.pause();
    }, 900);
    window.dispatchEvent(new CustomEvent('hassaq-music', { detail: false }));
  }
  // pause when tab hidden, resume when back
  let wasPlaying = false;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { wasPlaying = playing; if (playing) stop(); }
    else if (wasPlaying) start();
  });

  window.HassaqMusic = { start, stop, toggle: () => (playing ? stop() : start()), get on() { return playing; }, get mode() { return mode; } };
})();
