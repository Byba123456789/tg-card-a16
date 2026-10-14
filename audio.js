const Sound = (() => {
  let active = false;
  let ctx = null, master, sfxBus, bgBus, noise, brown, wind, leaves, hum, birdTimer = 0, music = null;
  let muted = false;
  try { muted = localStorage.getItem('bday_muted') === '1'; } catch {}
  const db = v => Math.pow(10, v / 20);

  function buffers() {
    const len = ctx.sampleRate * 5;
    noise = ctx.createBuffer(1, len, ctx.sampleRate);
    brown = ctx.createBuffer(1, len, ctx.sampleRate);
    const w = noise.getChannelData(0), br = brown.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      w[i] = Math.random() * 2 - 1;
      last = (last + 0.02 * w[i]) / 1.02;
      br[i] = last * 3.5;
    }
  }

  function loopSrc(buf) {
    const s = ctx.createBufferSource();
    s.buffer = buf;
    s.loop = true;
    s.start();
    return s;
  }

  function lfo(freq, depth, target) {
    const o = ctx.createOscillator(), gn = ctx.createGain();
    o.frequency.value = freq;
    gn.gain.value = depth;
    o.connect(gn).connect(target);
    o.start();
  }

  // фон: ветер (бурый шум через полосовой фильтр с двумя «дыханиями»), листва (высокий шум), гул космоса
  function beds() {
    const wf = ctx.createBiquadFilter();
    wf.type = 'bandpass'; wf.frequency.value = 350; wf.Q.value = 0.8;
    const wg = ctx.createGain(); wg.gain.value = 0;
    const gust = ctx.createGain(); gust.gain.value = 1;
    loopSrc(brown).connect(wf).connect(gust).connect(wg).connect(bgBus);
    lfo(0.13, 180, wf.frequency);
    lfo(0.07, 0.4, gust.gain);
    wind = { f: wf, g: wg };

    const lf = ctx.createBiquadFilter();
    lf.type = 'highpass'; lf.frequency.value = 3000;
    const lg = ctx.createGain(); lg.gain.value = 0;
    const rustle = ctx.createGain(); rustle.gain.value = 1;
    loopSrc(noise).connect(lf).connect(rustle).connect(lg).connect(bgBus);
    lfo(0.45, 0.6, rustle.gain);
    leaves = { g: lg };

    const hf = ctx.createBiquadFilter();
    hf.type = 'lowpass'; hf.frequency.value = 300;
    const hg = ctx.createGain(); hg.gain.value = 0;
    for (const [f, d] of [[55, 3], [82.4, -3], [110, 2]]) {
      const o = ctx.createOscillator();
      o.type = 'triangle'; o.frequency.value = f; o.detune.value = d;
      o.connect(hf);
      o.start();
    }
    const hmod = ctx.createGain(); hmod.gain.value = 1;
    hf.connect(hmod).connect(hg).connect(bgBus);
    lfo(0.05, 0.2, hmod.gain);
    hum = { g: hg };
  }

  function unlock() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      // на iOS без этого Web Audio молчит при беззвучном режиме
      if (navigator.audioSession) try { navigator.audioSession.type = 'playback'; } catch {}
      try { build(AC); } catch { ctx = null; return; }
    }
    active = true;
    warm();
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
  }

  function build(AC) {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : db(-3);
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -10; comp.ratio.value = 4; comp.attack.value = 0.005; comp.release.value = 0.2;
    master.connect(comp).connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.connect(master);
    bgBus = ctx.createGain(); bgBus.connect(master);
    buffers();
    beds();
    // песня — обычный аудио-элемент, мимо Web Audio (через MediaElementSource на iOS бывает тишина)
    music = new Audio('audio/dance.mp3');
    music.preload = 'auto';
  }

  // прогрев песни только в настоящем жесте: iOS иначе не даст запустить её потом из игрового цикла
  let warmed = false;
  function warm() {
    if (warmed || !music || (navigator.userActivation && !navigator.userActivation.isActive)) return;
    warmed = true;
    music.muted = true;
    music.play().then(() => { music.pause(); music.currentTime = 0; music.muted = muted; }).catch(() => { music.muted = muted; warmed = false; });
  }

  const now = () => ctx.currentTime;
  const ramp = (p, v, tau) => { const t = now(); p.cancelScheduledValues(t); p.setValueAtTime(p.value, t); p.setTargetAtTime(v, t, tau); };

  function env(gain, t, a, d, peak) {
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(peak, t + a);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  function burst({ type = 'bandpass', f = 1000, f2, Q = 1, a = 0.002, d = 0.08, vol = -20, at = 0 }) {
    const t = now() + at;
    const s = ctx.createBufferSource();
    s.buffer = noise;
    const flt = ctx.createBiquadFilter();
    flt.type = type; flt.Q.value = Q;
    flt.frequency.setValueAtTime(f, t);
    if (f2) flt.frequency.exponentialRampToValueAtTime(f2, t + a + d);
    const gn = ctx.createGain();
    env(gn, t, a, d, db(vol));
    s.connect(flt).connect(gn).connect(sfxBus);
    s.start(t, Math.random() * 4);
    s.stop(t + a + d + 0.05);
    s.onended = () => gn.disconnect();
  }

  function tone({ type = 'sine', f = 440, f2, a = 0.002, d = 0.1, vol = -20, at = 0 }) {
    const t = now() + at;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + a + d);
    const gn = ctx.createGain();
    env(gn, t, a, d, db(vol));
    o.connect(gn).connect(sfxBus);
    o.start(t);
    o.stop(t + a + d + 0.05);
    o.onended = () => gn.disconnect();
  }

  const vary = (v, p = 0.05) => v * (1 + (Math.random() * 2 - 1) * p);
  let lastStep = 0, fallNode = null;

  const SFX = {
    grab() {
      burst({ f: vary(1200), Q: 1.5, d: 0.07, vol: -16 });
      tone({ f: vary(140), f2: 70, d: 0.06, vol: -16 });
    },
    step() {
      if (now() - lastStep < 0.12) return;
      lastStep = now();
      burst({ type: 'lowpass', f: vary(800), d: 0.05, vol: -22 });
      burst({ f: vary(2500, 0.3), Q: 0.8, a: 0.03, d: 0.09, vol: -28, at: 0.02 });
    },
    miss() { burst({ f: 3500, f2: 700, Q: 3, a: 0.005, d: 0.22, vol: -18 }); },
    land() {
      tone({ f: 110, f2: 45, a: 0.001, d: 0.22, vol: -8 });
      burst({ type: 'lowpass', f: 300, d: 0.09, vol: -16 });
    },
    bonk() {
      tone({ type: 'triangle', f: 330, f2: 180, a: 0.001, d: 0.18, vol: -12 });
      tone({ type: 'square', f: 220, f2: 160, a: 0.001, d: 0.1, vol: -28 });
    },
    birdIn() {
      for (let i = 0; i < 5; i++) burst({ f: 600, Q: 1, a: 0.005, d: 0.05, vol: -22, at: i * (0.07 + i * 0.008) });
      tone({ f: 3200, f2: 2400, a: 0.005, d: 0.12, vol: -24, at: 0.45 });
    },
    birdOut() {
      for (let i = 0; i < 6; i++) burst({ f: 650, Q: 1, a: 0.004, d: 0.04, vol: -20 - i * 3, at: i * (0.06 - i * 0.004) });
      tone({ f: 2800, f2: 3600, a: 0.005, d: 0.1, vol: -26 });
    },
    jingle() {
      [523, 659, 784, 1047].forEach((f, i) => tone({ type: 'square', f, a: 0.002, d: i === 3 ? 0.3 : 0.12, vol: -24, at: i * 0.09 }));
    },
    click() { tone({ type: 'square', f: 1800, f2: 1200, a: 0.001, d: 0.03, vol: -24 }); },
  };

  function play(name) {
    if (!ctx || muted || ctx.state !== 'running') return;
    SFX[name]();
  }

  // свист падения нарастает, пока не остановим
  function fallStart() {
    if (!ctx || fallNode) return;
    const t = now();
    const s = loopSrc(noise);
    const flt = ctx.createBiquadFilter();
    flt.type = 'bandpass'; flt.Q.value = 1.2;
    flt.frequency.setValueAtTime(400, t);
    flt.frequency.exponentialRampToValueAtTime(2500, t + 1.4);
    const gn = ctx.createGain();
    gn.gain.setValueAtTime(db(-40), t);
    gn.gain.exponentialRampToValueAtTime(db(-14), t + 1.4);
    s.connect(flt).connect(gn).connect(sfxBus);
    fallNode = { s, gn };
  }

  function fallStop() {
    if (!fallNode) return;
    const { s, gn } = fallNode;
    fallNode = null;
    ramp(gn.gain, 0, 0.05);
    setTimeout(() => { s.stop(); gn.disconnect(); }, 400);
  }

  function chirpLoop() {
    clearTimeout(birdTimer);
    if (!ctx || !leaves || leaves.on !== true) return;
    if (!muted && ctx.state === 'running') {
      const n = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        const f = 2200 + Math.random() * 2300;
        tone({ type: i % 2 ? 'triangle' : 'sine', f, f2: f + (Math.random() < 0.5 ? 600 : -600), a: 0.005, d: 0.05, vol: -30, at: i * 0.09 });
      }
    }
    birdTimer = setTimeout(chirpLoop, 4000 + Math.random() * 8000);
  }

  // фон по уровню: 'tree' | 'mountain' | 'space' | null, m — высота в метрах для силы ветра
  function setLevel(level, m = 0) {
    if (!ctx || !wind) return;
    const k = Math.min(1, Math.max(0, (m - 40) / 500));
    ramp(wind.g.gain, level === 'tree' ? db(-34) : level === 'mountain' ? db(-30 + 10 * k) : level === 'space' ? db(-44) : 0, 1);
    ramp(wind.f.frequency, 300 + 600 * k, 1);
    ramp(wind.f.Q, 0.7 + 1.3 * k, 1);
    ramp(leaves.g.gain, level === 'tree' ? db(-40) : 0, 1);
    ramp(hum.g.gain, level === 'space' ? db(-30) : 0, 1.2);
    const birds = level === 'tree';
    if (birds !== leaves.on) { leaves.on = birds; if (birds) chirpLoop(); }
  }

  // песня танца идёт через общий микшер, фон на время песни приглушается
  function playMusic(from = 0) {
    if (!music) return;
    clearTimeout(musicFade);
    music.volume = 1;
    music.currentTime = from;
    music.muted = muted;
    music.play().catch(() => {});
    if (bgBus) ramp(bgBus.gain, db(-12), 0.3);
  }

  // песня затухает за ~0.25 с вместо обрыва (на iOS громкость не меняется — там просто остановится)
  let musicFade = 0;
  function stopMusic() {
    if (!music) return;
    clearTimeout(musicFade);
    let v = 1;
    const fade = () => {
      v -= 0.2;
      if (v > 0) { music.volume = v; musicFade = setTimeout(fade, 50); }
      else { music.pause(); music.currentTime = 0; music.volume = 1; }
    };
    fade();
    if (bgBus) ramp(bgBus.gain, 1, 0.5);
  }

  // уход из игры: всё засыпает; возврат — просыпается
  function pause() {
    active = false;
    if (music) { music.pause(); music.currentTime = 0; }
    if (ctx) ctx.suspend().catch(() => {});
  }

  function setMuted(v) {
    muted = v;
    try { localStorage.setItem('bday_muted', v ? '1' : '0'); } catch {}
    if (master) ramp(master.gain, v ? 0 : db(-3), 0.05);
    if (music) music.muted = v;
  }

  // после сворачивания iOS иногда держит контекст «running», но немым — перезапускаем
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) { ctx.suspend().catch(() => {}); if (music) music.pause(); }
    else if (active) ctx.suspend().then(() => ctx.resume()).catch(() => {});
  });
  for (const ev of ['pointerdown', 'touchend', 'click']) addEventListener(ev, () => { if (active && ctx && ctx.state !== 'running') ctx.resume().catch(() => {}); }, true);

  return { unlock, pause, play, fallStart, fallStop, setLevel, playMusic, stopMusic, setMuted, get muted() { return muted; } };
})();
