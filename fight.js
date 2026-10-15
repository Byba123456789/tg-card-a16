// звук сюжетки: короткий синт, без файлов (кроме ульты, если есть audio/gojo.mp3)
const Sfx = (() => {
  let ac = null;
  function ctx() {
    if (!ac) try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
    if (ac.state !== 'running') ac.resume().catch(() => {});
    return ac;
  }
  function tone(f, d, { type = 'triangle', vol = 0.12, at = 0, f2 = 0 } = {}) {
    const a = ctx();
    if (!a) return;
    const t = a.currentTime + at, o = a.createOscillator(), g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + d + 0.02);
  }
  function noise(d, { vol = 0.15, f = 1200, at = 0 } = {}) {
    const a = ctx();
    if (!a) return;
    const t = a.currentTime + at, len = Math.ceil(a.sampleRate * d), buf = a.createBuffer(1, len, a.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain();
    s.buffer = buf;
    fl.type = 'bandpass'; fl.frequency.value = f; fl.Q.value = 0.9;
    g.gain.value = vol;
    s.connect(fl).connect(g).connect(a.destination);
    s.start(t);
  }
  const play = {
    swing: () => noise(0.12, { vol: 0.08, f: 2400 }),
    hit: () => { tone(140, 0.12, { type: 'square', vol: 0.08, f2: 60 }); noise(0.08, { vol: 0.2, f: 800 }); },
    kill: () => { tone(220, 0.25, { type: 'square', vol: 0.08, f2: 50 }); noise(0.2, { vol: 0.25, f: 500 }); },
    hurt: () => { tone(320, 0.2, { type: 'sawtooth', vol: 0.07, f2: 120 }); noise(0.1, { vol: 0.15, f: 1500 }); },
    slam: () => { tone(80, 0.35, { type: 'sine', vol: 0.25, f2: 35 }); noise(0.3, { vol: 0.25, f: 300 }); },
    clap: () => { noise(0.08, { vol: 0.5, f: 2000 }); noise(0.15, { vol: 0.25, f: 900, at: 0.01 }); },
    pickup: () => { tone(660, 0.08, { vol: 0.08 }); tone(990, 0.12, { vol: 0.08, at: 0.07 }); },
    snap: () => noise(0.05, { vol: 0.4, f: 3200 }),
    pop: () => tone(500, 0.06, { type: 'square', vol: 0.04, f2: 900 }),
  };

  // ульта: трек из файла, если он есть; иначе фортепианная заглушка
  let track = null;
  fetch('audio/gojo.mp3').then(r => r.ok ? r.blob() : Promise.reject()).then(bl => { track = URL.createObjectURL(bl); }).catch(() => {});
  function piano(dur) {
    if (track) {
      const el = new Audio(track);
      el.volume = 0.9;
      el.play().catch(() => {});
      setTimeout(() => { const f = setInterval(() => { el.volume = Math.max(0, el.volume - 0.1); if (el.volume <= 0) { clearInterval(f); el.pause(); } }, 50); }, dur * 1000 - 500);
      return;
    }
    const N = [220, 261.6, 329.6, 440, 392, 329.6, 293.7, 349.2, 440, 523.3, 440, 349.2, 329.6, 415.3, 493.9, 659.3];
    N.forEach((f, i) => {
      const at = i * dur / N.length;
      tone(f, 0.9, { type: 'triangle', vol: 0.1, at });
      tone(f * 2, 0.5, { type: 'sine', vol: 0.03, at });
      if (i % 4 === 0) tone(f / 2, 1.6, { type: 'sine', vol: 0.08, at });
    });
  }
  return { unlock: ctx, play, piano };
})();

// бой в духе Isaac: волны врагов, телеграф атаки, удар гитарой, ульта-пианино
// C: { st, pl, R, b, disc, vib, OUTLINE, blocked(x, y), view() }
const Fight = C => {
  const { st, pl, R, OUTLINE } = C;
  const TYPES = {
    runner: { hp: 4, speed: 34, wind: 0.32, act: 0.16, rest: 0.45, reach: 19, dmg: 1 },
    stick: { hp: 3, speed: 30, wind: 0.45, act: 0.14, rest: 0.5, reach: 24, dmg: 1 },
    fat: { hp: 8, speed: 19, wind: 0.65, act: 0.18, rest: 0.8, reach: 23, dmg: 2, zone: 17 },
  };
  const S = { hp: 6, max: 6, inv: 0, ult: 0, piano: null, dead: false, swing: 0 };
  let foes = [], fx = [], drops = [], rings = [], waves = [], waveI = 0, waveT = 0, calm = false;

  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const lookTo = (o, dx, dy) => {
    if (Math.abs(dx) > Math.abs(dy) * 1.1) { o.dir = 'side'; o.face = dx > 0 ? 1 : -1; } else o.dir = dy < 0 ? 'up' : 'down';
  };

  function spawn(w) {
    const t = TYPES[w.t];
    const e = {
      t: w.t, look: w.look || 'gop', x: w.at[0], y: w.at[1], to: w.to, hp: w.hp || t.hp, max: w.hp || t.hp,
      state: 'enter', time: 0, dir: 'down', face: 1, kbx: 0, kby: 0, kbt: 0, flash: 0, walk: 0, hitBy: -1,
      key: !!w.key, aim: null, moving: false, slot: Math.random() * Math.PI * 2,
    };
    foes.push(e);
    return e;
  }

  function start(list, opts = {}) {
    foes = []; fx = []; drops = []; rings = [];
    waves = list; waveI = 0; waveT = 0; calm = !!opts.calm;
    S.dead = false; S.inv = 0; S.piano = null;
    if (opts.heal !== false) S.hp = S.max;
    nextWave();
  }
  function nextWave() {
    if (waveI >= waves.length) return;
    for (const w of waves[waveI++]) spawn(w);
  }
  const engage = () => { calm = false; };
  const cleared = () => !foes.length && waveI >= waves.length;
  const arrived = () => foes.every(e => e.state !== 'enter');

  function puff(x, y, n, cols, sp = 60) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = sp * (0.4 + Math.random() * 0.8);
      fx.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, life: 0.25 + Math.random() * 0.2, col: cols[i % cols.length], g: 160 });
    }
  }

  function hurtHero(dmg, from) {
    if (S.inv > 0 || S.dead || st.lock) return;
    S.hp = Math.max(0, S.hp - dmg);
    S.inv = 0.9;
    const dx = pl.x - from.x, dy = pl.y - from.y, d = Math.hypot(dx, dy) || 1;
    pl.kbx = dx / d * 10; pl.kby = dy / d * 10; pl.kbt = 0.12;
    st.shake = 0.2;
    st.hurtFlash = 0.15;
    C.vib();
    Sfx.play.hurt();
    puff(pl.x, pl.y - 8, 6, ['#ffffff', '#e74c3c']);
    if (!S.hp) S.dead = true;
  }

  function damage(e, n, from, push = 8) {
    e.hp -= n;
    e.flash = 0.09;
    const dx = e.x - from.x, dy = e.y - from.y, d = Math.hypot(dx, dy) || 1, k = e.t === 'fat' ? push * 0.35 : push;
    e.kbx = dx / d * k; e.kby = dy / d * k; e.kbt = 0.12;
    // замах сбивается не всегда, иначе частые удары делают врагов безобидными
    if (e.t !== 'fat' && e.state === 'wind' && Math.random() < 0.4) { e.state = 'rest'; e.time = 0.3; }
    S.ult = Math.min(1, S.ult + 0.05);
    puff(e.x, e.y - 8, 5, ['#ffffff', '#f5d6a0', '#e8a08c']);
    if (e.hp <= 0) {
      foes.splice(foes.indexOf(e), 1);
      st.stop = 0.1;
      st.shake = 0.18;
      S.ult = Math.min(1, S.ult + 0.1);
      Sfx.play.kill();
      puff(e.x, e.y - 8, 12, ['#ffffff', '#c0c4cc', '#e8a08c'], 90);
      if (e.key) drops.push({ kind: 'key', x: e.x, y: e.y, t: 0 });
      else if (Math.random() < 0.28) drops.push({ kind: 'burger', x: e.x, y: e.y, t: 0 });
    } else {
      st.stop = Math.max(st.stop, 0.06);
      Sfx.play.hit();
    }
  }

  // удар гитарой: точка удара (tx, ty), один враг — одно попадание за замах
  function swingHit(tx, ty, id) {
    let n = 0;
    for (const e of [...foes]) {
      if (e.hitBy === id || e.state === 'enter') continue;
      if (Math.hypot(e.x - tx, e.y - 7 - ty) < (e.t === 'fat' ? 18 : 14)) {
        e.hitBy = id;
        damage(e, 1, pl);
        n++;
      }
    }
    return n;
  }
  function nearest(r) {
    let best = null, bd = r;
    for (const e of foes) { const d = dist(e, pl); if (d < bd && e.state !== 'enter') { bd = d; best = e; } }
    return best;
  }

  function ult() {
    if (S.ult < 1 || S.piano) return false;
    S.ult = 0;
    st.stop = 0.3;
    st.ultFlash = 0.3;
    Sfx.play.snap();
    S.piano = { x: Math.max(30, Math.min(194, pl.x)), y: Math.max(26, pl.y - 14), t: 4.3, next: 0.35, notes: [] };
    Sfx.piano(4.3);
    return true;
  }

  function move(o, dx, dy, free) {
    const nx = o.x + dx, ny = o.y + dy;
    if (free || !C.blocked(nx, o.y)) o.x = nx;
    if (free || !C.blocked(o.x, ny)) o.y = ny;
  }

  function update(dt) {
    S.inv = Math.max(0, S.inv - dt);
    if (pl.kbt > 0) { const k = Math.min(dt, pl.kbt) / 0.12; pl.kbt -= dt; move(pl, pl.kbx * k, pl.kby * k); }
    for (const p of fx) { p.life -= dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    fx = fx.filter(p => p.life > 0);
    for (const d of drops) {
      d.t += dt;
      if (dist(d, pl) < 11) {
        d.got = true;
        Sfx.play.pickup();
        if (d.kind === 'burger') { S.hp = Math.min(S.max, S.hp + 2); puff(d.x, d.y - 4, 6, ['#f5a623', '#ffffff']); }
        else st.hasKey = true;
      }
    }
    drops = drops.filter(d => !d.got);
    // пианино: волны от него расходятся и бьют всех на пути
    if (S.piano) {
      const p = S.piano;
      p.t -= dt;
      p.next -= dt;
      if (p.next <= 0 && p.t > 0.4) { p.next = 0.5; rings.push({ x: p.x, y: p.y, r: 6, hit: new Set() }); }
      if (Math.random() < dt * 6) p.notes.push({ x: p.x + (Math.random() - 0.5) * 20, y: p.y - 14, life: 1 });
      for (const n of p.notes) { n.life -= dt; n.y -= 16 * dt; n.x += Math.sin(n.life * 8) * 0.3; }
      p.notes = p.notes.filter(n => n.life > 0);
      if (p.t <= 0) S.piano = null;
    }
    for (const r of rings) {
      r.r += 85 * dt;
      for (const e of [...foes]) {
        if (r.hit.has(e) || e.state === 'enter') continue;
        if (Math.abs(Math.hypot(e.x - r.x, (e.y - r.y) * 1.4) - r.r) < 7) { r.hit.add(e); damage(e, 1, r, 18); }
      }
    }
    rings = rings.filter(r => r.r < 150);

    if (!foes.length && waveI < waves.length) {
      waveT += dt;
      if (waveT > 0.7) { waveT = 0; nextWave(); }
    }
    for (const e of foes) think(e, dt);
    // и не стоят на герое (кроме рывка)
    for (const e of foes) {
      const dx = e.x - pl.x, dy = e.y - pl.y, d = Math.hypot(dx, dy);
      if (d > 0 && d < 10 && e.state !== 'act' && e.state !== 'enter') move(e, dx / d * (10 - d), dy / d * (10 - d));
    }
    // враги не залезают друг в друга
    for (let i = 0; i < foes.length; i++) for (let j = i + 1; j < foes.length; j++) {
      const a = foes[i], b = foes[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
      const min = a.t === 'fat' || b.t === 'fat' ? 14 : 10;
      if (d > 0 && d < min && a.state !== 'enter' && b.state !== 'enter') {
        const k = (min - d) / 2 / d;
        move(a, -dx * k, -dy * k);
        move(b, dx * k, dy * k);
      }
    }
  }

  function think(e, dt) {
    const T = TYPES[e.t];
    e.flash = Math.max(0, e.flash - dt);
    if (e.kbt > 0) { const k = Math.min(dt, e.kbt) / 0.12; e.kbt -= dt; move(e, e.kbx * k, e.kby * k); }
    e.moving = false;
    const dx = pl.x - e.x, dy = pl.y - e.y, d = Math.hypot(dx, dy) || 1;
    if (e.state === 'enter') {
      const tx = e.to[0] - e.x, ty = e.to[1] - e.y, td = Math.hypot(tx, ty);
      if (td < 1.5) { e.state = calm ? 'calm' : 'chase'; e.time = 0.3; }
      else { lookTo(e, tx, ty); move(e, tx / td * 40 * dt, ty / td * 40 * dt, true); e.moving = true; }
    } else if (e.state === 'calm') {
      lookTo(e, dx, dy);
      if (!calm) e.state = 'chase';
    } else if (e.state === 'chase') {
      lookTo(e, dx, dy);
      e.time -= dt;
      if (d < T.reach && e.time <= 0 && !st.lock) {
        e.state = 'wind';
        e.time = T.wind;
        e.aim = e.t === 'fat' ? { x: e.x + dx / d * 16, y: e.y + dy / d * 16 } : { x: pl.x, y: pl.y };
      } else {
        // каждый заходит со своей стороны, а не лезет в одну точку
        const gx = pl.x - Math.cos(e.slot) * T.reach * 0.9 - e.x, gy = pl.y - Math.sin(e.slot) * T.reach * 0.7 - e.y, gd = Math.hypot(gx, gy);
        if (gd > 2) { move(e, gx / gd * T.speed * dt, gy / gd * T.speed * dt); e.moving = true; }
      }
    } else if (e.state === 'wind') {
      e.time -= dt;
      if (e.t !== 'fat') lookTo(e, dx, dy);
      if (e.time <= 0) {
        e.state = 'act';
        e.time = T.act;
        e.done = false;
        if (e.t === 'fat') {
          st.shake = 0.25;
          Sfx.play.slam();
          puff(e.aim.x, e.aim.y, 8, ['#9aa0a8', '#c8ccd2'], 50);
          if (Math.hypot(pl.x - e.aim.x, (pl.y - e.aim.y) * 1.3) < T.zone + 3) hurtHero(T.dmg, e);
          e.done = true;
        } else Sfx.play.swing();
      }
    } else if (e.state === 'act') {
      e.time -= dt;
      if (e.t === 'runner') {
        const ax = e.aim.x - e.x, ay = e.aim.y - e.y, ad = Math.hypot(ax, ay) || 1;
        if (ad > 3) move(e, ax / ad * 120 * dt, ay / ad * 120 * dt);
      }
      if (!e.done && d < (e.t === 'stick' ? T.reach + 4 : 11)) { e.done = true; hurtHero(T.dmg, e); }
      if (e.time <= 0) { e.state = 'rest'; e.time = T.rest; }
    } else if (e.state === 'rest') {
      e.time -= dt;
      if (e.time <= 0) { e.state = 'chase'; e.time = 0.15 + Math.random() * 0.3; }
    }
    if (e.moving) e.walk += dt; else e.walk = 0;
  }

  // отрисовка
  const scr = () => C.view();
  function drawFoe(e) {
    const { ox, oy } = scr();
    const pose = e.state === 'wind' ? 'windup' : e.state === 'act' ? 'punch' : 'idle';
    const f = e.moving ? Math.floor(e.walk / 0.13) % 4 : -1;
    const def = Actors.DEFS[e.look];
    Actors.draw(C.b, def, ox + e.x, oy + e.y, { dir: e.dir, face: e.face, f, bob: 0, blink: false, pose, flash: e.flash > 0 });
    if (e.t === 'stick') drawStick(e, pose);
    if (e.state === 'wind' && e.t !== 'fat' && e.time < 0.2) R(Math.round(e.x) - 1, Math.round(e.y) - 33, 2, 4, '#ffffff');
    if (e.hp < e.max) {
      const w = e.t === 'fat' ? 18 : 12, x = Math.round(e.x - w / 2), y = Math.round(e.y) - (e.t === 'fat' ? 32 : 30);
      R(x - 1, y - 1, w + 2, 4, OUTLINE);
      R(x, y, w, 2, '#5a1e1e');
      R(x, y, Math.ceil(w * e.hp / e.max), 2, '#e74c3c');
    }
    if (e.key) { R(Math.round(e.x) - 2, Math.round(e.y) - 36, 5, 3, '#d4a017'); R(Math.round(e.x) + 1, Math.round(e.y) - 34, 1, 3, '#d4a017'); }
  }
  function drawStick(e, pose) {
    const b = C.b, { ox, oy } = scr();
    const s = e.dir === 'side' ? e.face : 1;
    let a = pose === 'windup' ? -2.2 : pose === 'punch' ? 0 : 0.9;
    if (e.dir === 'side' && s < 0) a = Math.PI - a;
    if (e.dir === 'up') a = pose === 'punch' ? -Math.PI / 2 : -2.4;
    if (e.dir === 'down' && pose === 'punch') a = Math.PI / 2;
    const hx = ox + Math.round(e.x) + (e.dir === 'side' ? 2 * s : 5), hy = oy + Math.round(e.y) - (pose === 'windup' ? 18 : 10);
    for (let i = 0; i < 13; i++) {
      b.fillStyle = i > 10 ? '#3a2416' : OUTLINE;
      b.fillRect(Math.round(hx + Math.cos(a) * i) - 1, Math.round(hy + Math.sin(a) * i) - 1, 3, 3);
    }
    for (let i = 0; i < 12; i++) {
      b.fillStyle = i > 9 ? '#5a3a22' : '#a0703c';
      b.fillRect(Math.round(hx + Math.cos(a) * i), Math.round(hy + Math.sin(a) * i), 1, 1);
    }
  }
  function drawDrop(d) {
    const bob = Math.round(Math.sin(d.t * 5) * 1.5), x = Math.round(d.x), y = Math.round(d.y) - 6 + bob;
    if (d.kind === 'burger') {
      R(x - 5, y - 1, 11, 9, OUTLINE);
      R(x - 4, y, 9, 3, '#d9822b');
      R(x - 3, y, 2, 1, '#f5d6a0');
      R(x - 4, y + 3, 9, 1, '#5a8a2a');
      R(x - 4, y + 4, 9, 1, '#6a3a1a');
      R(x - 4, y + 5, 9, 2, '#c8781e');
    } else {
      R(x - 4, y - 1, 9, 6, OUTLINE);
      R(x - 3, y, 3, 4, '#f2c230');
      R(x, y + 1, 4, 2, '#f2c230');
      R(x + 2, y + 3, 1, 1, '#f2c230');
      R(x - 2, y + 1, 1, 2, OUTLINE);
    }
    C.b.globalAlpha = 0.3;
    R(x - 3, Math.round(d.y), 7, 1, '#000');
    C.b.globalAlpha = 1;
  }
  function drawPiano(p) {
    const x = Math.round(p.x) - 14, y = Math.round(p.y);
    const k = Math.min(1, (4.3 - p.t) / 0.25);
    if (k < 1) { C.b.globalAlpha = k; }
    R(x - 1, y - 21, 30, 23, OUTLINE);
    R(x, y - 20, 28, 14, '#16161c');
    R(x + 2, y - 18, 24, 2, '#2c2c36');
    R(x + 3, y - 30, 22, 11, OUTLINE);
    R(x + 4, y - 29, 20, 10, '#22222a');
    R(x + 5, y - 28, 8, 1, '#4a4a58');
    R(x, y - 6, 28, 5, '#f4f1ea');
    for (let i = 1; i < 28; i += 3) R(x + i, y - 6, 1, 3, OUTLINE);
    R(x, y - 1, 28, 2, '#101014');
    R(x + 2, y + 1, 2, 3, OUTLINE);
    R(x + 24, y + 1, 2, 3, OUTLINE);
    C.b.globalAlpha = 1;
  }
  function items() {
    const list = foes.map(e => [e.y, () => drawFoe(e)]);
    for (const d of drops) list.push([d.y, () => drawDrop(d)]);
    if (S.piano) list.push([S.piano.y, () => drawPiano(S.piano)]);
    return list;
  }
  function drawUnder() {
    const b = C.b;
    for (const e of foes) {
      if (e.t === 'fat' && e.state === 'wind') {
        const k = 1 - e.time / TYPES.fat.wind;
        b.globalAlpha = 0.18 + 0.25 * k;
        const { ox, oy } = scr();
        C.disc(ox + e.aim.x, oy + e.aim.y, TYPES.fat.zone, '#e74c3c');
        b.globalAlpha = 1;
      }
    }
    for (const r of rings) {
      b.globalAlpha = Math.max(0, 0.7 - r.r / 200);
      b.fillStyle = '#bfe8ff';
      const { ox, oy } = scr();
      for (let a = 0; a < 6.28; a += 2 / r.r) b.fillRect(Math.round(ox + r.x + Math.cos(a) * r.r), Math.round(oy + r.y + Math.sin(a) * r.r / 1.4), 2, 1);
      b.globalAlpha = 1;
    }
  }
  function drawOver() {
    for (const p of fx) R(Math.round(p.x), Math.round(p.y), 2, 2, p.col);
    if (S.piano) for (const n of S.piano.notes) {
      C.b.globalAlpha = Math.min(1, n.life * 2);
      const x = Math.round(n.x), y = Math.round(n.y);
      R(x, y - 5, 1, 5, '#ffffff'); R(x - 2, y - 1, 3, 2, '#ffffff'); R(x + 1, y - 5, 2, 1, '#ffffff');
      C.b.globalAlpha = 1;
    }
  }
  // сердца (по 2 HP) и шкала ульты; экранные координаты
  function hud() {
    const b = C.b;
    const heart = (x, y, fill) => {
      const P = ['.kk.kk.', 'kRRkRRk', 'kRRRRRk', '.kRRRk.', '..kRk..', '...k...'];
      P.forEach((row, j) => [...row].forEach((c, i) => {
        if (c === '.') return;
        const half = i < 4 ? fill >= 1 : fill >= 2;
        b.fillStyle = c === 'k' ? OUTLINE : half ? '#e74c3c' : '#4a2a30';
        b.fillRect(x + i, y + j, 1, 1);
      }));
    };
    for (let i = 0; i < S.max / 2; i++) heart(6 + i * 9, 6, Math.max(0, Math.min(2, S.hp - i * 2)));
    const w = 30;
    b.fillStyle = OUTLINE; b.fillRect(5, 15, w + 2, 5);
    b.fillStyle = '#2c2a40'; b.fillRect(6, 16, w, 3);
    b.fillStyle = S.ult >= 1 && Math.floor(st.t * 6) % 2 ? '#ffffff' : '#7fd0ff';
    b.fillRect(6, 16, Math.round(w * S.ult), 3);
  }

  return { S, start, engage, cleared, arrived, spawn, swingHit, nearest, ult, update, items, drawUnder, drawOver, hud, hurtHero, foes: () => foes, drops: () => drops };
};
