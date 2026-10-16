// звук сюжетки: короткий синт + треки локаций и ульты из audio/
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
    step: () => noise(0.045, { vol: 0.07, f: 320 + Math.random() * 160 }),
    blip: f => tone(f * (0.95 + Math.random() * 0.1), 0.035, { type: 'square', vol: 0.018 }),
    buzz: () => { tone(110, 0.28, { type: 'sawtooth', vol: 0.04 }); tone(113, 0.28, { type: 'sawtooth', vol: 0.04 }); },
    ping: () => { tone(880, 0.08, { vol: 0.06 }); tone(1320, 0.14, { vol: 0.05, at: 0.06 }); },
    send: () => tone(600, 0.09, { vol: 0.04, f2: 1300 }),
    ring: () => { tone(425, 0.9, { type: 'sine', vol: 0.05 }); },
    fail: () => { tone(950, 0.16, { type: 'sine', vol: 0.05 }); tone(1400, 0.16, { type: 'sine', vol: 0.05, at: 0.18 }); tone(1800, 0.3, { type: 'sine', vol: 0.05, at: 0.36 }); },
    door: () => { noise(0.28, { vol: 0.14, f: 380 }); tone(170, 0.22, { type: 'square', vol: 0.025, f2: 110 }); },
    key: () => { tone(2200, 0.05, { vol: 0.05 }); tone(2600, 0.05, { vol: 0.05, at: 0.06 }); tone(2400, 0.09, { vol: 0.05, at: 0.12 }); },
    rope: () => { noise(0.3, { vol: 0.12, f: 1800 }); noise(0.15, { vol: 0.08, f: 900, at: 0.2 }); },
    whoosh: () => noise(0.28, { vol: 0.1, f: 1100 }),
    land: () => { tone(90, 0.16, { type: 'sine', vol: 0.2, f2: 50 }); noise(0.1, { vol: 0.15, f: 400 }); },
    boing: () => tone(170, 0.45, { type: 'sine', vol: 0.16, f2: 540 }),
    bike: () => { noise(0.9, { vol: 0.06, f: 650 }); for (let i = 0; i < 6; i++) tone(1900, 0.02, { type: 'square', vol: 0.012, at: i * 0.15 }); },
    throw: () => { noise(0.16, { vol: 0.08, f: 1600 }); tone(300, 0.1, { vol: 0.03, f2: 520 }); },
    whistle: () => { tone(2800, 0.22, { type: 'sine', vol: 0.06 }); tone(2900, 0.3, { type: 'sine', vol: 0.06, at: 0.27 }); },
    charge: () => tone(110, 0.7, { type: 'sawtooth', vol: 0.05, f2: 420 }),
    grow: () => tone(55, 1.4, { type: 'sawtooth', vol: 0.08, f2: 260 }),
    shrink: () => tone(900, 1.7, { type: 'triangle', vol: 0.06, f2: 70 }),
    type: () => noise(0.02, { vol: 0.07, f: 4200 }),
    clink: () => { tone(1800, 0.3, { vol: 0.06 }); tone(2700, 0.25, { vol: 0.04, at: 0.02 }); },
    strum: () => [196, 247, 294, 392, 494].forEach((f, i) => tone(f, 0.9, { vol: 0.05, at: i * 0.025 })),
    crash: () => { noise(0.3, { vol: 0.28, f: 700 }); tone(160, 0.2, { type: 'square', vol: 0.05, f2: 60 }); },
    go: () => { tone(660, 0.08, { vol: 0.06 }); tone(990, 0.16, { vol: 0.06, at: 0.08 }); },
    win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.25, { vol: 0.07, at: i * 0.09 })),
    lose: () => [392, 330, 262].forEach((f, i) => tone(f, 0.4, { vol: 0.07, at: i * 0.18 })),
    zap: () => { tone(220, 0.55, { type: 'sawtooth', vol: 0.06, f2: 1400 }); noise(0.4, { vol: 0.1, f: 2600 }); },
    boom: () => { tone(48, 1.4, { type: 'sine', vol: 0.32, f2: 22 }); noise(0.8, { vol: 0.35, f: 300 }); noise(0.4, { vol: 0.2, f: 1200, at: 0.05 }); },
    tada: () => { [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.4, { vol: 0.07, at: i * 0.1 })); [523, 659, 784].forEach(f => tone(f, 1.6, { vol: 0.05, at: 0.55 })); },
  };

  // треки качаются один раз в blob (экран загрузки показывает прогресс), без файла — тишина
  const tracks = {}, loads = {}, prog = {};
  function load(name) {
    loads[name] ||= fetch(`audio/${name}.mp3`).then(async r => {
      if (!r.ok) throw 0;
      const total = +r.headers.get('content-length') || 0, rd = r.body.getReader(), parts = [];
      let got = 0;
      for (;;) {
        const { done, value } = await rd.read();
        if (done) break;
        parts.push(value);
        got += value.length;
        if (total) prog[name] = got / total;
      }
      tracks[name] = URL.createObjectURL(new Blob(parts, { type: 'audio/mpeg' }));
      prog[name] = 1;
      return true;
    }).catch(() => { delete loads[name]; return false; });
    return loads[name];
  }
  let bgm = null;
  function music(name) {
    if (bgm && bgm.name === name) return;
    stopMusic();
    if (!tracks[name]) return;
    const el = new Audio(tracks[name]);
    el.loop = true;
    el.volume = 0.45;
    el.play().catch(() => {});
    bgm = { name, el };
  }
  function stopMusic() {
    if (!bgm) return;
    const el = bgm.el;
    bgm = null;
    const f = setInterval(() => { el.volume = Math.max(0, el.volume - 0.05); if (el.volume <= 0) { clearInterval(f); el.pause(); } }, 40);
  }
  document.addEventListener('visibilitychange', () => { if (bgm) document.hidden ? bgm.el.pause() : bgm.el.play().catch(() => {}); });

  // ульта: трек Годжо, если скачался; иначе фортепианная заглушка
  function piano(dur) {
    if (bgm) { const el = bgm.el; el.volume = 0.08; setTimeout(() => { if (bgm && bgm.el === el) el.volume = 0.45; }, dur * 1000); }
    if (tracks.gojo) {
      const el = new Audio(tracks.gojo);
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
  return { unlock: ctx, play, piano, music, stopMusic, load, progress: name => prog[name] || 0 };
})();

// бой в духе Isaac: волны врагов, телеграф атаки, удар гитарой, ульта-пианино
// C: { st, pl, R, b, disc, vib, OUTLINE, blocked(x, y), view() }
const Fight = C => {
  const { st, pl, R, OUTLINE } = C;
  const TYPES = {
    runner: { hp: 4, speed: 34, wind: 0.32, act: 0.16, rest: 0.45, reach: 19, dmg: 1 },
    stick: { hp: 3, speed: 30, wind: 0.45, act: 0.14, rest: 0.5, reach: 24, dmg: 1 },
    fat: { hp: 8, speed: 19, wind: 0.65, act: 0.18, rest: 0.8, reach: 23, dmg: 2, zone: 17 },
    ranged: { hp: 3, speed: 26, wind: 0.55, act: 0.1, rest: 1.5, reach: 80, keep: 55, dmg: 1, proj: 'ring' },
    boss: { hp: 70, speed: 22, reach: 0, dmg: 2 },
  };
  // ульта длится, пока играет gojo.mp3 (13 с); волны реже и слабее, чтобы урон за ульту остался прежним
  const ULT_T = 13;
  const S = { hp: 6, max: 6, inv: 0, ult: 0, piano: null, dead: false, swing: 0, script: false, event: null, noDeath: false };
  let foes = [], fx = [], drops = [], rings = [], waves = [], waveI = 0, waveT = 0, calm = false;
  let shots = [], pops = [], allies = [];
  const pop = (text, x, y) => pops.push({ text, x, y, t: 1.3 });

  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const lookTo = (o, dx, dy) => {
    if (Math.abs(dx) > Math.abs(dy) * 1.1) { o.dir = 'side'; o.face = dx > 0 ? 1 : -1; } else o.dir = dy < 0 ? 'up' : 'down';
  };

  function spawn(w) {
    const t = { ...TYPES[w.t], ...(w.o || {}) };
    const e = {
      t: w.t, T: t, boss: w.t === 'boss', head: 15, cool: 1.5, atk: null, stage: 'ground', z: 0, dark: 0, look: w.look || 'gop', x: w.at[0], y: w.at[1], to: w.to, hp: w.hp || t.hp, max: w.hp || t.hp,
      state: 'enter', time: 0, dir: 'down', face: 1, kbx: 0, kby: 0, kbt: 0, flash: 0, walk: 0, hitBy: -1,
      key: !!w.key, aim: null, moving: false, slot: Math.random() * Math.PI * 2,
    };
    foes.push(e);
    return e;
  }

  function start(list, opts = {}) {
    foes = []; fx = []; drops = []; rings = []; shots = []; pops = [];
    waves = list; waveI = 0; waveT = 0; calm = !!opts.calm;
    S.dead = false; S.inv = 0; S.piano = null; S.script = false; S.event = null; S.noDeath = false;
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
    S.hp = Math.max(S.noDeath ? 1 : 0, S.hp - dmg);
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

  // mine — удар героя: копит его ульту и даёт хитстоп; напарники бьют без задержки кадра
  function damage(e, n, from, push = 8, mine = true) {
    if (!foes.includes(e) || (e.boss && airborne(e))) return;
    // напарники по боссу бьют слабее, иначе он сносится за секунды
    if (e.boss && !mine) n *= 0.35;
    e.hp -= n;
    // босса бьют все разом: вспышка и искры только от удара героя, иначе он вечно белый
    if (mine || !e.boss) e.flash = 0.09;
    const dx = e.x - from.x, dy = e.y - from.y, d = Math.hypot(dx, dy) || 1, k = e.boss ? 0 : e.t === 'fat' ? push * 0.35 : push;
    e.kbx = dx / d * k; e.kby = dy / d * k; e.kbt = 0.12;
    // замах сбивается не всегда, иначе частые удары делают врагов безобидными
    if (e.t !== 'fat' && !e.boss && e.state === 'wind' && Math.random() < 0.4) { e.state = 'rest'; e.time = 0.3; }
    if (mine && !S.piano) S.ult = Math.min(1, S.ult + 0.05);
    if (mine || !e.boss) puff(e.x, e.y - (e.boss ? 24 : 8), 5, ['#ffffff', '#f5d6a0', '#e8a08c']);
    if (e.boss) { if (mine) Sfx.play.hit(); return; }
    if (e.hp <= 0) {
      foes.splice(foes.indexOf(e), 1);
      st.stop = mine ? 0.1 : 0.03;
      st.shake = 0.18;
      if (mine) S.ult = Math.min(1, S.ult + 0.1);
      Sfx.play.kill();
      puff(e.x, e.y - 8, 12, ['#ffffff', '#c0c4cc', '#e8a08c'], 90);
      if (e.key) drops.push({ kind: 'key', x: e.x, y: e.y, t: 0 });
      else if (Math.random() < 0.28) drops.push({ kind: 'burger', x: e.x, y: e.y, t: 0 });
    } else {
      if (mine) st.stop = Math.max(st.stop, 0.06);
      Sfx.play.hit();
    }
  }

  // удар гитарой: точка удара (tx, ty), один враг — одно попадание за замах
  function swingHit(tx, ty, id) {
    let n = 0;
    for (const e of [...foes]) {
      if (e.hitBy === id || e.state === 'enter' || airborne(e)) continue;
      if (Math.hypot(e.x - tx, e.y - (e.boss ? 20 : 7) - ty) < (e.boss ? 22 : e.t === 'fat' ? 18 : 14)) {
        e.hitBy = id;
        damage(e, 1, pl);
        n++;
      }
    }
    return n;
  }
  function nearest(r) {
    let best = null, bd = r;
    for (const e of foes) { const d = dist(e, pl); if (d < bd && e.state !== 'enter' && !airborne(e)) { bd = d; best = e; } }
    return best;
  }

  function ult() {
    if (S.ult < 1 || S.piano) return false;
    S.ult = 0;
    st.stop = 0.3;
    st.ultFlash = 0.3;
    Sfx.play.snap();
    S.piano = { x: Math.max(30, Math.min(194, pl.x)), y: Math.max(26, pl.y - 14), t: ULT_T, next: 0.35, notes: [] };
    Sfx.piano(ULT_T);
    return true;
  }

  function move(o, dx, dy, free) {
    const nx = o.x + dx, ny = o.y + dy;
    // застрял внутри предмета — выпускаем
    if (!free && C.blocked(o.x, o.y)) free = true;
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
        else { st.hasKey = true; Sfx.play.key(); }
      }
    }
    drops = drops.filter(d => !d.got);
    // пианино: волны от него расходятся и бьют всех на пути
    if (S.piano) {
      const p = S.piano;
      p.t -= dt;
      p.next -= dt;
      if (p.next <= 0 && p.t > 0.4) { p.next = 0.8; rings.push({ x: p.x, y: p.y, r: 6, hit: new Set() }); }
      if (Math.random() < dt * 6) p.notes.push({ x: p.x + (Math.random() - 0.5) * 20, y: p.y - 14, life: 1 });
      for (const n of p.notes) { n.life -= dt; n.y -= 16 * dt; n.x += Math.sin(n.life * 8) * 0.3; }
      p.notes = p.notes.filter(n => n.life > 0);
      if (p.t <= 0) S.piano = null;
    }
    for (const r of rings) {
      r.r += 85 * dt;
      for (const e of [...foes]) {
        if (r.hit.has(e) || e.state === 'enter') continue;
        if (Math.abs(Math.hypot(e.x - r.x, (e.y - r.y) * 1.4) - r.r) < 7) { r.hit.add(e); damage(e, 0.5, r, 18); }
      }
    }
    rings = rings.filter(r => r.r < 150);

    updateShots(dt);
    for (const q of pops) { q.t -= dt; q.y -= 10 * dt; }
    pops = pops.filter(q => q.t > 0);
    if (!st.lock && !S.script) {
      for (const a of allies) allyThink(a, dt);
      // герой и напарники не налезают друг на друга
      const bodies = [pl, ...allies];
      for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i], c = bodies[j], dx = c.x - a.x, dy = c.y - a.y, d = Math.hypot(dx, dy);
        if (d > 0 && d < 12) {
          const k = (12 - d) / d;
          if (i) { move(a, -dx * k / 2, -dy * k / 2); move(c, dx * k / 2, dy * k / 2); } else move(c, dx * k, dy * k);
        }
      }
    }

    if (!foes.length && waveI < waves.length) {
      waveT += dt;
      if (waveT > 0.7) { waveT = 0; nextWave(); }
    }
    for (const e of [...foes]) if (e.boss) bossThink(e, dt); else if (!S.script) think(e, dt);
    // и не стоят на герое (кроме рывка)
    for (const e of foes) {
      const dx = e.x - pl.x, dy = e.y - pl.y, d = Math.hypot(dx, dy);
      if (d > 0 && d < 10 && e.state !== 'act' && e.state !== 'enter' && !e.boss) move(e, dx / d * (10 - d), dy / d * (10 - d));
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
    const T = e.T;
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
      if (e.t === 'ranged') {
        const k = d < T.keep - 8 ? -1 : d > T.reach * 0.85 ? 1 : 0;
        if (k) { move(e, dx / d * T.speed * k * dt, dy / d * T.speed * k * dt); e.moving = true; }
        if (d < T.reach && e.time <= 0 && !st.lock) { e.state = 'wind'; e.time = T.wind; e.aim = { x: pl.x, y: pl.y }; }
      } else if (d < T.reach && e.time <= 0 && !st.lock) {
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
        } else if (e.t === 'ranged') {
          const ax = pl.x - e.x, ay = pl.y - e.y, ad = Math.hypot(ax, ay) || 1;
          shots.push({ x: e.x, y: e.y - 10, vx: ax / ad * 75, vy: ay / ad * 75, kind: T.proj, foe: true, dmg: T.dmg, life: 3 });
          Sfx.play.throw();
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


  // ---------- снаряды ----------
  function updateShots(dt) {
    for (const sh of shots) {
      sh.x += sh.vx * dt; sh.y += sh.vy * dt; sh.life -= dt;
      if (sh.x < -20 || sh.x > 244 || sh.y < -40 || sh.y > 144) sh.life = 0;
      if (sh.fx) continue;
      if (sh.foe) {
        if (Math.hypot(pl.x - sh.x, pl.y - 8 - sh.y) < 7) { hurtHero(sh.dmg, sh); sh.life = 0; }
        continue;
      }
      for (const e of [...foes]) {
        if (e.state === 'enter' || airborne(e) || (sh.hit && sh.hit.has(e))) continue;
        if (Math.hypot(e.x - sh.x, e.y - (e.boss ? 20 : 8) - sh.y) < (e.boss ? 18 : 9)) {
          damage(e, sh.dmg, sh, 6, false);
          if (sh.hit) sh.hit.add(e); else { sh.life = 0; break; }
        }
      }
    }
    shots = shots.filter(sh => sh.life > 0);
  }
  const aimShot = (from, to, speed, kind, dmg, extra = {}) => {
    const ax = to.x - from.x, ay = to.y - 8 - from.y, ad = Math.hypot(ax, ay) || 1;
    shots.push({ x: from.x, y: from.y, vx: ax / ad * speed, vy: ay / ad * speed, kind, dmg, life: 2, ...extra });
  };

  // ---------- напарники: спасённые друзья дерутся сами, ульта — сама по таймеру ----------
  const ALLY = {
    roma: { look: 'roma', reach: 70, cd: 0.8, dmg: 1, ranged: true, shout: 'КЛОД, ФАС!' },
    anton: { look: 'anton', reach: 16, cd: 1.0, dmg: 2, shout: 'СПОРТПИТ!' },
    andrey: { look: 'andrey', reach: 14, cd: 0.5, dmg: 1, shout: 'ФУРРИ-РЕЖИМ!' },
  };
  const SLOT = [[-16, 10], [16, 10], [0, 18]];
  function setAllies(ids) {
    allies = ids.map((id, i) => ({ id, ...ALLY[id], x: pl.x + SLOT[i][0], y: pl.y + SLOT[i][1], dir: 'up', face: 1, t: 0.5, ult: 0, ultT: 0, walk: 0, moving: false, atk: 0, slot: i, dashI: 0, claude: null }));
  }
  function nearestTo(o, r = 999) {
    let best = null, bd = r;
    for (const e of foes) { const d = dist(e, o); if (d < bd && e.state !== 'enter' && e.state !== 'calm' && !airborne(e)) { bd = d; best = e; } }
    return best;
  }
  function allyThink(a, dt) {
    a.t -= dt; a.atk = Math.max(0, a.atk - dt); a.moving = false;
    const busy = foes.some(e => e.state !== 'enter' && e.state !== 'calm');
    if (busy && a.ultT <= 0) a.ult = Math.min(1, a.ult + dt / 10);
    if (a.ult >= 1 && busy) {
      a.ult = 0;
      a.ultT = a.id === 'anton' ? 6 : 5;
      pop(a.shout, a.x, a.y - 34);
      Sfx.play.snap();
      const tg = nearestTo(a);
      if (a.id === 'anton' && tg) { aimShot({ x: a.x, y: a.y - 14 }, tg, 170, 'bar', 3, { hit: new Set(), life: 1.5 }); Sfx.play.throw(); }
      if (a.id === 'roma') a.claude = { x: a.x + 10, y: a.y - 20, t: 0 };
    }
    if (a.ultT > 0) { a.ultT -= dt; if (a.ultT <= 0) a.claude = null; }
    const move2 = (tx, ty, sp) => {
      const gx = tx - a.x, gy = ty - a.y, gd = Math.hypot(gx, gy);
      if (gd > 3) { lookTo(a, gx, gy); move(a, gx / gd * Math.min(sp * dt, gd), gy / gd * Math.min(sp * dt, gd)); a.moving = true; }
      return gd;
    };
    // Клод летает рядом с Ромой и стреляет зелёными цифрами
    if (a.claude) {
      const c = a.claude;
      c.t += dt;
      c.x += (a.x + 12 - c.x) * dt * 4; c.y += (a.y - 22 + Math.sin(c.t * 6) * 2 - c.y) * dt * 4;
      if (Math.floor(c.t / 0.15) !== Math.floor((c.t - dt) / 0.15)) { const tg = nearestTo(c); if (tg) aimShot(c, tg, 160, 'digit', 1, { ch: Math.random() < 0.5 ? '0' : '1' }); }
    }
    // Андрей-фурри носится от врага к врагу
    if (a.id === 'andrey' && a.ultT > 0 && busy) {
      const live = foes.filter(e => e.state !== 'enter' && e.state !== 'calm');
      const tg = live[a.dashI % live.length];
      if (move2(tg.x, tg.y, 150) < 9) { damage(tg, 1, a, 12, false); a.dashI++; a.atk = 0.12; }
      if (a.moving) a.walk += dt;
      return;
    }
    const tg = nearestTo(a);
    if (!tg) {
      move2(pl.x + SLOT[a.slot][0], pl.y + SLOT[a.slot][1], 50);
    } else if (a.ranged) {
      const d = dist(a, tg);
      if (d > a.reach) move2(tg.x, tg.y, 45); else if (d < 40) move2(a.x * 2 - tg.x, a.y * 2 - tg.y, 40); else lookTo(a, tg.x - a.x, tg.y - a.y);
      if (d < a.reach + 10 && a.t <= 0) { aimShot({ x: a.x, y: a.y - 10 }, tg, 140, 'pellet', a.dmg); a.t = a.cd; a.atk = 0.12; Sfx.play.pop(); }
    } else {
      const big = a.id === 'anton' && a.ultT > 0;
      const off = tg.boss ? 22 : 10;
      if (move2(tg.x - Math.sign(tg.x - a.x || 1) * off, tg.y, big ? 60 : 48) < 6 || dist(a, tg) < (tg.boss ? 26 : a.reach)) {
        lookTo(a, tg.x - a.x, tg.y - a.y);
        if (a.t <= 0) { damage(tg, big ? 2 : a.dmg, a, big ? 14 : 8, false); a.t = big ? 0.4 : a.cd; a.atk = 0.15; }
      }
    }
    if (a.moving) a.walk += dt; else a.walk = 0;
  }
  function drawAlly(a) {
    const { ox, oy } = scr();
    const look = a.id === 'andrey' && a.ultT > 0 ? 'andreyF' : a.look, big = a.id === 'anton' && a.ultT > 0;
    const f = a.moving ? Math.floor(a.walk / 0.12) % 4 : -1;
    Actors.draw(C.b, Actors.DEFS[look], ox + a.x, oy + a.y, { dir: a.dir, face: a.face, f, bob: 0, blink: false, pose: a.atk > 0 ? 'punch' : null, scale: big ? 1.5 : 1, rot: a.rot || 0, z: a.z || 0 });
    const x = Math.round(a.x), y = Math.round(a.y), s = a.dir === 'side' ? a.face : 1;
    if (a.id === 'roma' && a.dir === 'side') { R(x + 5 * s - (s < 0 ? 3 : 0), y - 13, 4, 2, OUTLINE); R(x + 5 * s - (s < 0 ? 3 : 0), y - 13, 1, 3, OUTLINE); }
    if (a.id === 'anton' && !big) { R(x - 9, y - 23, 18, 1, '#9aa0a8'); R(x - 10, y - 25, 2, 5, OUTLINE); R(x + 8, y - 25, 2, 5, OUTLINE); }
    if (a.id === 'andrey' && a.atk > 0) for (let i = 0; i < 3; i++) R(x + 6 * s + i * 2 * s, y - 16 + i, 1, 5, '#ffffff');
    if (a.claude) drawClaude(a.claude);
  }
  // мини-Клод: оранжевая звёздочка с лапками-лучами
  function drawClaude(c) {
    const x = Math.round(c.x), y = Math.round(c.y);
    for (let i = 0; i < 8; i++) {
      const ang = i * Math.PI / 4 + c.t * 2;
      for (let r = 3; r < 7; r++) R(Math.round(x + Math.cos(ang) * r), Math.round(y + Math.sin(ang) * r), 1, 1, '#d97757');
    }
    const { ox, oy } = scr();
    C.disc(ox + x, oy + y, 4, OUTLINE);
    C.disc(ox + x, oy + y, 3, '#e8865e');
    R(x - 2, y - 1, 1, 2, OUTLINE); R(x + 1, y - 1, 1, 2, OUTLINE);
  }

  // ---------- босс «Развитие» ----------
  // stage: ground — обычный бой; на нуле HP событие 'down' (сюжет роняет его, тьма, взлетает).
  // air — летает, неуязвим, стреляет умными словами; land → cast — стоит и кастует, бить можно, слова летят без урона.
  // Конец 1-го каста — событие 'cast1' (сюжет снимает всем полхп), 2-го — 'cast2' (катсцена).
  const SHOUT = { storm: 'МОЗГОВОЙ ШТУРМ!', dash: 'ВЫХОД ИЗ ЗОНЫ КОМФОРТА!', pump: 'ПРОКАЧКА!' };
  const WIND = { storm: 0.75, dash: 0.75, pump: 0.85 };
  const WORDS = ['СИНЕРГИЯ', 'ПАРАДИГМА', 'ИНСАЙТ', 'ЭНТРОПИЯ', 'ДИСРАПТ', 'РЕФЛЕКСИЯ', 'ОСОЗНАННОСТЬ', 'ПОТЕНЦИАЛ', 'ДЕДЛАЙН', 'АПГРЕЙД', 'МАЙНДСЕТ', 'КОГНИТИВНО'];
  const word = () => WORDS[Math.floor(Math.random() * WORDS.length)];
  const airborne = e => (e.z || 0) > 4;
  function bossThink(e, dt) {
    e.flash = Math.max(0, e.flash - dt);
    e.moving = false;
    const dx = pl.x - e.x, dy = pl.y - e.y, d = Math.hypot(dx, dy) || 1;
    if (e.state === 'enter') {
      const tx = e.to[0] - e.x, ty = e.to[1] - e.y, td = Math.hypot(tx, ty);
      if (td < 1.5) e.state = calm ? 'calm' : 'chase';
      else { lookTo(e, tx, ty); move(e, tx / td * 30 * dt, ty / td * 30 * dt, true); e.moving = true; e.walk += dt; }
      return;
    }
    if (e.state === 'calm') { lookTo(e, dx, dy); if (!calm) e.state = 'chase'; return; }
    if (S.script || S.event) return;
    if (e.stage === 'ground') {
      if (e.hp <= 0) { e.hp = 0; e.atk = null; S.event = 'down'; return; }
      const ph2 = e.hp <= e.max * 0.5;
      e.head += ((ph2 ? 17 : 15) - e.head) * Math.min(1, dt * 3);
      if (!e.atk) {
        lookTo(e, dx, dy);
        if (d > 42) { move(e, dx / d * e.T.speed * dt, dy / d * e.T.speed * dt); e.moving = true; e.walk += dt; }
        e.cool -= dt;
        if (e.cool <= 0) {
          const opts = ['storm', 'dash', ...(ph2 ? ['pump', 'storm'] : [])];
          const kind = opts[Math.floor(Math.random() * opts.length)];
          e.atk = { kind, t: WIND[kind], fired: 0 };
          if (kind === 'dash') e.atk.dir = { x: dx / d, y: dy / d };
          if (kind === 'pump') e.atk.at = { x: pl.x, y: pl.y };
          pop(SHOUT[kind], e.x, e.y - 56);
          Sfx.play.charge();
        }
        return;
      }
      const A = e.atk;
      A.t -= dt;
      if (A.t > 0) return;
      if (A.kind === 'storm') {
        // лампочки-идеи кольцом; во второй половине HP — ещё два залпа со сдвигом
        const n = ph2 ? 12 : 9, off = A.fired * 0.22;
        for (let i = 0; i < n; i++) {
          const ang = i / n * Math.PI * 2 + off;
          shots.push({ x: e.x, y: e.y - 28, vx: Math.cos(ang) * 58, vy: Math.sin(ang) * 58, kind: 'bulb', foe: true, dmg: 1, life: 3 });
        }
        Sfx.play.pop();
        A.fired++;
        if (A.fired < (ph2 ? 3 : 1)) { A.t = 0.35; return; }
      } else if (A.kind === 'dash') {
        if (A.go === undefined) { A.go = 0.55; Sfx.play.swing(); }
        A.go -= dt;
        move(e, A.dir.x * 170 * dt, A.dir.y * 170 * dt);
        e.moving = true; e.walk += dt;
        if (!A.hit && d < 15) { A.hit = true; hurtHero(2, e); }
        if (A.go > 0) { A.t = 0; return; }
      } else if (A.kind === 'pump') {
        st.shake = 0.3;
        Sfx.play.slam();
        puff(A.at.x, A.at.y, 12, ['#9aa0a8', '#c8ccd2', '#ffd23f'], 70);
        if (Math.hypot(pl.x - A.at.x, (pl.y - A.at.y) * 1.3) < 33) hurtHero(2, A.at);
      }
      e.atk = null;
      e.cool = ph2 ? 1.4 : 2;
    } else if (e.stage === 'air') {
      e.z += (34 - e.z) * Math.min(1, dt * 2.5);
      e.t2 = (e.t2 || 0) + dt;
      const tx = 112 + Math.sin(e.t2 * 0.8) * 72, ty = 46 + Math.sin(e.t2 * 1.6) * 20;
      move(e, (tx - e.x) * Math.min(1, dt * 2), (ty - e.y) * Math.min(1, dt * 2), true);
      lookTo(e, dx, dy);
      e.cool -= dt;
      if (e.cool <= 0) {
        e.cool = 0.6;
        const sy = e.y - e.z - 22, ax = pl.x - e.x, ay = pl.y - 8 - sy, ad = Math.hypot(ax, ay) || 1;
        shots.push({ x: e.x, y: sy, vx: ax / ad * 70, vy: ay / ad * 70, kind: 'word', text: word(), foe: true, dmg: 1, life: 4 });
        Sfx.play.throw();
      }
      e.airT -= dt;
      if (e.airT <= 0) e.stage = 'land';
    } else if (e.stage === 'land') {
      e.z = Math.max(0, e.z - 50 * dt);
      if (!e.z) { e.stage = 'cast'; e.castT = 5; st.shake = 0.25; Sfx.play.land(); Sfx.play.charge(); pop('КАСТУЕТ…', e.x, e.y - 60); }
    } else if (e.stage === 'cast') {
      e.castT -= dt;
      e.hp = Math.max(1, e.hp);
      if (Math.floor(e.castT / 0.12) !== Math.floor((e.castT + dt) / 0.12)) {
        const a = Math.random() * Math.PI * 2;
        shots.push({ x: e.x, y: e.y - 26, vx: Math.cos(a) * 55, vy: Math.sin(a) * 55 - 10, kind: 'word', text: word(), fx: true, life: 1.4 });
      }
      if (e.castT <= 0) {
        e.casts = (e.casts || 0) + 1;
        S.event = e.casts === 1 ? 'cast1' : 'cast2';
        e.stage = e.casts === 1 ? 'air' : 'hold';
        e.airT = 7;
        e.cool = 1;
      }
    }
  }
  function drawBoss(e) {
    const { ox, oy } = scr(), s = e.scale ?? 1, r = Math.max(2, Math.round(e.head * s)), z = Math.round(e.z || 0), b = C.b;
    if (z > 0) { b.globalAlpha = 0.3; C.disc(ox + e.x, oy + e.y, 8, '#000'); b.globalAlpha = 1; }
    const rot = e.rot || 0, L = (16 + e.head * 0.75) * s;
    const hx = ox + Math.round(e.x + Math.sin(rot) * L), hy = oy + Math.round(e.y - z - Math.cos(rot) * L);
    // тёмная аура и щупальца тьмы
    if (e.dark > 0) {
      b.globalAlpha = 0.35 * e.dark;
      C.disc(hx, hy + 8, r + 12 + Math.round(Math.sin(st.t * 6) * 2), '#2a0a3a');
      b.globalAlpha = 0.8 * e.dark;
      b.fillStyle = '#12041c';
      for (let i = 0; i < 10; i++) {
        const a = st.t * 1.5 + i * 0.63, len = r + 6 + Math.sin(st.t * 4 + i) * 5;
        for (let k = r - 2; k < len; k += 1.5) b.fillRect(Math.round(hx + Math.cos(a + k * 0.05) * k), Math.round(hy + 8 + Math.sin(a + k * 0.05) * k * 0.8), 2, 2);
      }
      b.globalAlpha = 1;
    }
    Actors.draw(b, Actors.DEFS.bossbody, ox + e.x, oy + e.y, { dir: e.dir, face: e.face, f: e.moving ? Math.floor(e.walk / 0.14) % 4 : -1, bob: 0, blink: false, pose: e.atk && e.atk.kind === 'pump' ? 'windup' : null, flash: e.flash > 0, scale: s, rot, z });
    const glow = (e.atk && e.atk.kind === 'storm' && e.atk.t > 0) || e.stage === 'cast';
    if (glow && Math.floor(st.t * 12) % 2) { b.globalAlpha = 0.5; C.disc(hx, hy, r + 4, e.stage === 'cast' ? '#c084fc' : '#ffe066'); b.globalAlpha = 1; }
    C.disc(hx, hy, r + 1, OUTLINE);
    C.disc(hx, hy, r, e.flash > 0 ? '#ffffff' : '#dca487');
    if (e.flash > 0) return;
    C.disc(hx - Math.round(r * 0.12), hy - Math.round(r * 0.12), Math.round(r * 0.86), '#f2c4a4');
    C.disc(hx - Math.round(r * 0.45), hy - Math.round(r * 0.45), Math.max(1, Math.round(r * 0.18)), '#fbd8bc');
    b.fillStyle = '#3a2a1c';
    for (let yy = -r; yy < -r * 0.3; yy += 2) for (let xx = -r; xx <= r; xx += 2) if (xx * xx + yy * yy < r * r * 0.92 && (xx + yy) % 4 === 0) b.fillRect(hx + xx, hy + yy, 1, 1);
    b.fillStyle = '#8a4a6a';
    for (let i = 0; i < 4; i++) { b.fillRect(hx - Math.round(r * 0.5) + i, hy - Math.round(r * 0.25) - (i % 2), 1, 1); b.fillRect(hx + Math.round(r * 0.35) - i, hy - Math.round(r * 0.3) + (i % 2), 1, 1); }
    const ey = hy + Math.round(r * 0.12), ex = Math.max(2, Math.round(r * 0.28));
    b.fillStyle = e.dark > 0.5 ? '#c084fc' : OUTLINE;
    b.fillRect(hx - ex - 1, ey, 2, 2); b.fillRect(hx + ex, ey, 2, 2);
    b.fillStyle = OUTLINE;
    b.fillRect(hx - ex - 2, ey - 2, 3, 1); b.fillRect(hx + ex, ey - 2, 3, 1);
    b.fillRect(hx - ex, ey - 3, 1, 1); b.fillRect(hx + ex + 1, ey - 3, 1, 1);
    b.fillRect(hx - Math.round(r * 0.25), hy + Math.round(r * 0.55), Math.round(r * 0.5), 1);
    b.fillRect(hx + Math.round(r * 0.25), hy + Math.round(r * 0.5), 1, 1);
  }
  const boss = () => foes.find(e => e.boss);
  // «⏭» тестера: драка — победа сразу; босс — сразу к следующему событию
  function skip() {
    const bs = boss();
    foes = bs ? [bs] : [];
    waves = []; waveI = 0; shots = [];
    if (!bs || S.event) return;
    bs.atk = null;
    if (bs.stage === 'ground') { bs.hp = 0; S.event = 'down'; return; }
    bs.casts = (bs.casts || 0) + 1;
    S.event = bs.casts === 1 ? 'cast1' : 'cast2';
    bs.stage = bs.casts === 1 ? 'air' : 'hold';
    bs.airT = 7;
  }
  const clearShots = () => { shots = []; };
  const remove = e => { const i = foes.indexOf(e); if (i >= 0) foes.splice(i, 1); };
  // глаза в темноте: светятся поверх затемнения
  function drawEyes() {
    const b = C.b, { ox, oy } = scr();
    for (const e of foes) {
      const def = Actors.DEFS[e.look];
      if (!def.anim) continue;
      const x = ox + Math.round(e.x), y = oy + Math.round(e.y) - 20, side = e.dir === 'side';
      if (e.dir === 'up') continue;
      b.fillStyle = def.P.E;
      const pts = side ? [[e.face * 3, 0]] : [[-3, 0], [3, 0]];
      for (const [dx] of pts) { b.globalAlpha = 0.35; b.fillRect(x + dx - 1, y - 1, 3, 3); b.globalAlpha = 1; b.fillRect(x + dx, y, 1, 1); }
    }
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
    const k = Math.min(1, (ULT_T - p.t) / 0.25);
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
    const list = foes.map(e => [e.y, () => (e.boss ? drawBoss(e) : drawFoe(e))]);
    for (const a of allies) list.push([a.y, () => drawAlly(a)]);
    for (const d of drops) list.push([d.y, () => drawDrop(d)]);
    if (S.piano) list.push([S.piano.y, () => drawPiano(S.piano)]);
    return list;
  }
  function drawUnder() {
    const b = C.b;
    const bs = boss();
    if (bs && bs.atk && bs.atk.t > 0) {
      const { ox, oy } = scr();
      if (bs.atk.kind === 'dash') {
        b.fillStyle = '#e74c3c';
        b.globalAlpha = 0.5 + 0.3 * Math.sin(st.t * 30);
        for (let i = 6; i < 170; i += 4) b.fillRect(Math.round(ox + bs.x + bs.atk.dir.x * i) - 1, Math.round(oy + bs.y + bs.atk.dir.y * i) - 1, 3, 3);
        b.globalAlpha = 1;
      }
      if (bs.atk.kind === 'pump') { b.globalAlpha = 0.25 + 0.25 * (1 - bs.atk.t / WIND.pump); C.disc(ox + bs.atk.at.x, oy + bs.atk.at.y, 30, '#e74c3c'); b.globalAlpha = 1; }
    }
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
    for (const sh of shots) {
      if (sh.kind === 'word') continue;
      const x = Math.round(sh.x), y = Math.round(sh.y);
      if (sh.kind === 'ring') { R(x - 3, y - 3, 7, 7, OUTLINE); R(x - 2, y - 2, 5, 5, '#e74c3c'); R(x - 1, y - 1, 3, 3, '#f4f4f4'); R(x, y, 1, 1, OUTLINE); }
      else if (sh.kind === 'cake') { R(x - 3, y - 3, 6, 6, OUTLINE); R(x - 2, y - 2, 4, 2, '#ff8fb8'); R(x - 2, y, 4, 2, '#c8781e'); R(x, y - 4, 1, 1, '#e74c3c'); }
      else if (sh.kind === 'bulb') { R(x - 2, y - 3, 5, 6, OUTLINE); R(x - 1, y - 2, 3, 3, '#ffe066'); R(x, y - 2, 1, 1, '#ffffff'); R(x - 1, y + 1, 3, 1, '#9aa0a8'); }
      else if (sh.kind === 'bar') { R(x - 7, y - 1, 15, 3, OUTLINE); R(x - 6, y, 13, 1, '#c8ccd2'); R(x - 8, y - 3, 3, 7, OUTLINE); R(x + 6, y - 3, 3, 7, OUTLINE); }
      else if (sh.kind === 'digit') { R(x - 1, y - 2, 3, 5, '#16301a'); R(x, y - 2, 1, 5, '#4ade80'); if (sh.ch === '0') { R(x - 1, y - 2, 3, 1, '#4ade80'); R(x - 1, y + 2, 3, 1, '#4ade80'); } }
      else { R(x - 1, y - 1, 3, 3, OUTLINE); R(x, y, 1, 1, '#ffd23f'); }
    }
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

  return { S, setAllies, allies: () => allies, pops: () => pops, words: () => shots.filter(sh => sh.kind === 'word'), boss, skip, remove, clearShots, drawEyes, pop, puff, start, engage, cleared, arrived, spawn, swingHit, nearest, ult, update, items, drawUnder, drawOver, hud, hurtHero, foes: () => foes, drops: () => drops };
};
