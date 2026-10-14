const Game = (() => {
  const TREE_TOP = 40;
  const STEP = 12;
  const BIRDS_FROM = 50;
  const CLOUDS_FROM = 55;
  const CLOUDS_TO = 420;
  const SPACE_FROM = 600;
  const DANCE_SEC = 4;
  const PAL = {
    hair: '#c99c5f', hairD: '#8f6634', skin: '#f1c7a2', skinD: '#d39e79', eye: '#2b2633',
    jacket: '#8f9bad', jacketD: '#6b7688', shirt: '#f6f4ef', pants: '#25262c', shoe: '#121216', outline: '#15161b',
  };
  const SKY = [
    [0, '#9bd8ff', '#dff4ff'], [60, '#7cc0f5', '#c3e6ff'], [300, '#3f7fd0', '#8bbcef'],
    [500, '#172c5e', '#30508f'], [650, '#05060f', '#0b1026'],
  ];
  const MILESTONES = [
    [TREE_TOP, 'Вершина дерева!'], [TREE_TOP + 1, 'Теперь гора'], [80, 'Птицы, блять'],
    [180, 'В облаках'], [CLOUDS_TO, 'Выше облаков'], [SPACE_FROM, 'Космос, сука'], [1000, 'Илон Маск нервно курит'],
  ];
  const FALL_ROASTS = [
    'Хват как у пенсионера', 'Магнезию забыл, гений?', 'Ну ты и мешок', 'Гравитация передаёт привет',
    'Даже голубь лезет лучше', 'Слабак, давай ещё', 'Пиздец полёт', 'Скалодром плачет',
  ];
  // позы: углы рук/ног в градусах (0 — вниз, 180 — вверх, + — вправо по экрану), [плечо/бедро, локоть/колено]
  const POSES = {
    stand: { la: [-10, -5], ra: [10, 5], ll: [-6, 0], rl: [6, 0] },
    reachL: { la: [-130, -160], ra: [60, 20], ll: [-20, 5], rl: [25, -5] },
    reachR: { la: [-60, -20], ra: [130, 160], ll: [-25, 5], rl: [20, -5] },
    grip: { la: [-150, -170], ra: [150, 170], ll: [-15, 5], rl: [15, -5] },
    fall: { la: [-130, -100], ra: [130, 100], ll: [-35, 20], rl: [40, -20] },
    d1: { la: [-140, -160], ra: [140, 160], ll: [-42, -15], rl: [42, 15] },
    d2: { la: [-35, 35], ra: [150, 170], ll: [-18, 0], rl: [10, -6], hx: -1 },
    d3: { la: [-150, -170], ra: [35, -35], ll: [-10, 6], rl: [18, 0], hx: 1 },
    d4: { la: [-35, 35], ra: [85, 95], ll: [-22, 0], rl: [26, 0] },
    d5: { la: [-120, -170], ra: [35, -35], ll: [-15, 0], rl: [15, 0], hx: -1 },
    d6: { la: [-90, -90], ra: [90, 90], ll: [-12, 0], rl: [12, 0], back: true },
    d7: { la: [-95, -90], ra: [95, 90], ll: [-38, -10], rl: [38, 10] },
  };
  const DANCE = ['d1', 'd1', 'd2', 'd3', 'd2', 'd3', 'd4', 'd4', 'd5', 'd6', 'd7', 'd7', 'd2', 'd3', 'd1', 'd1'];

  let cv, g, buf, b, W, H, scale, raf = 0, last = 0, st = null, audio = null, best = 0;
  const off = document.createElement('canvas');
  off.width = 40; off.height = 44;
  const oc = off.getContext('2d');
  const sil = document.createElement('canvas');
  sil.width = 40; sil.height = 44;
  const sc = sil.getContext('2d');
  const $ = id => document.getElementById(id);

  const rnd = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const clamp = (v, a, z) => Math.max(a, Math.min(z, v));
  const holdY = i => 16 + i * STEP + (i > TREE_TOP ? 16 : 0);
  const meterAt = wy => Math.max(0, (wy - 16) / STEP);

  function mix(c1, c2, k) {
    const p = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
    const a = p(c1), z = p(c2);
    return '#' + a.map((v, i) => Math.round(v + (z[i] - v) * k).toString(16).padStart(2, '0')).join('');
  }

  function skyAt(m) {
    for (let i = 1; i < SKY.length; i++) {
      if (m < SKY[i][0]) {
        const [m0, t0, b0] = SKY[i - 1], [m1, t1, b1] = SKY[i];
        const k = (m - m0) / (m1 - m0);
        return [mix(t0, t1, k), mix(b0, b1, k)];
      }
    }
    return [SKY[SKY.length - 1][1], SKY[SKY.length - 1][2]];
  }

  function side(i) {
    if (i === TREE_TOP) return 0;
    while (st.sides.length <= i) {
      const prev = st.sides[st.sides.length - 1] || 1;
      st.sides.push(Math.random() < 0.6 ? -prev : prev);
    }
    return st.sides[i] || 1;
  }

  function anchor(hold) {
    if (hold === 0) return 9;
    if (hold === TREE_TOP) return holdY(TREE_TOP) + 9;
    return holdY(hold) - 16;
  }

  function reset() {
    st = {
      mode: 'climb', hold: 0, sides: [1], stamina: 100, camY: -6, charY: anchor(0), fromY: anchor(0), tween: 1,
      side: 1, birds: [], feathers: [], shake: 0, bonk: 0, t: 0, danceT: 0, fallV: 0, fallT: 0, msgT: 0, reached: 0,
    };
  }

  function resize() {
    const w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    scale = Math.max(2, Math.round(w / 130));
    W = Math.ceil(w / scale);
    H = Math.ceil(h / scale);
    buf.width = W; buf.height = H;
    cv.width = W * scale; cv.height = H * scale;
    g.imageSmoothingEnabled = false;
    b.imageSmoothingEnabled = false;
  }

  const sy = wy => Math.round(H - (wy - st.camY));

  function px(c, x, y, w, h, col) {
    c.fillStyle = col;
    c.fillRect(Math.round(x), Math.round(y), w, h);
  }

  function limb(c, x, y, [a1, a2], l1, l2, w, col, end, endCol) {
    const r = Math.PI / 180;
    const x1 = x + Math.sin(a1 * r) * l1, y1 = y + Math.cos(a1 * r) * l1;
    const x2 = x1 + Math.sin(a2 * r) * l2, y2 = y1 + Math.cos(a2 * r) * l2;
    for (const [sx, sy0, ex, ey] of [[x, y, x1, y1], [x1, y1, x2, y2]]) {
      const n = Math.ceil(Math.hypot(ex - sx, ey - sy0) * 2) || 1;
      for (let i = 0; i <= n; i++) px(c, sx + (ex - sx) * i / n - w / 2, sy0 + (ey - sy0) * i / n - w / 2, w, w, col);
    }
    if (end) px(c, x2 - end[0] / 2, y2 - end[1] / 2, end[0], end[1], endCol);
  }

  function renderChar(name, back, wink) {
    const p = POSES[name];
    const isBack = back || p.back;
    oc.clearRect(0, 0, 40, 44);
    const x = 20 + (p.hx || 0), y = 30;
    limb(oc, x - 2, y, p.ll, 4, 4, 3, PAL.pants, [4, 2], PAL.shoe);
    limb(oc, x + 2, y, p.rl, 4, 4, 3, PAL.pants, [4, 2], PAL.shoe);
    px(oc, x - 4, y - 8, 8, 9, PAL.jacket);
    px(oc, x - 4, y - 8, 1, 9, PAL.jacketD);
    px(oc, x + 3, y - 8, 1, 9, PAL.jacketD);
    if (isBack) px(oc, x, y - 7, 1, 8, PAL.jacketD);
    else {
      px(oc, x - 1, y - 8, 3, 5, PAL.shirt);
      px(oc, x, y - 3, 1, 3, PAL.shirt);
    }
    const hx = x - 5, hy = y - 18;
    px(oc, hx + 1, hy + 2, 9, 8, isBack ? PAL.hair : PAL.skin);
    px(oc, hx, hy, 11, 3, PAL.hair);
    px(oc, hx + 1, hy - 1, 8, 1, PAL.hair);
    px(oc, hx, hy + 3, 1, isBack ? 6 : 4, PAL.hairD);
    px(oc, hx + 10, hy + 3, 1, isBack ? 6 : 4, PAL.hairD);
    if (isBack) px(oc, hx + 2, hy + 8, 7, 2, PAL.hairD);
    else {
      px(oc, hx + 1, hy + 3, 3, 1, PAL.hair);
      px(oc, hx + 6, hy + 3, 2, 1, PAL.hair);
      px(oc, hx + 3, hy + 5, 1, 2, PAL.eye);
      if (wink) px(oc, hx + 6, hy + 6, 2, 1, PAL.eye);
      else px(oc, hx + 7, hy + 5, 1, 2, PAL.eye);
      px(oc, hx + 4, hy + 8, 3, 1, PAL.skinD);
    }
    limb(oc, x - 3, y - 7, p.la, 5, 5, 2, PAL.jacket, [2, 2], PAL.skin);
    limb(oc, x + 3, y - 7, p.ra, 5, 5, 2, PAL.jacket, [2, 2], PAL.skin);
    sc.clearRect(0, 0, 40, 44);
    sc.globalCompositeOperation = 'source-over';
    sc.drawImage(off, 0, 0);
    sc.globalCompositeOperation = 'source-in';
    sc.fillStyle = PAL.outline;
    sc.fillRect(0, 0, 40, 44);
  }

  function drawChar(name, x, y, back, wink) {
    renderChar(name, back, wink);
    const ox = Math.round(x - 20), oy = Math.round(y - 30);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) b.drawImage(sil, ox + dx, oy + dy);
    b.drawImage(off, ox, oy);
  }

  function drawSky() {
    const m = meterAt(st.camY + H / 2);
    const [top, bottom] = skyAt(m);
    const gr = b.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, top);
    gr.addColorStop(1, bottom);
    b.fillStyle = gr;
    b.fillRect(0, 0, W, H);
    const stars = clamp((m - 430) / 220, 0, 1);
    if (stars > 0) {
      b.globalAlpha = stars;
      for (let i = 0; i < 70; i++) {
        const x = Math.floor(rnd(i) * W), y = Math.floor((rnd(i + 99) * H * 3 + st.camY * 0.05) % H);
        px(b, x, y, 1, 1, rnd(i + 7) > 0.85 ? '#ffe9a8' : '#ffffff');
      }
      b.globalAlpha = 1;
    }
    if (m > SPACE_FROM + 30) {
      const py = Math.round(H * 0.3 + ((st.camY * 0.04) % (H * 1.6)) - H * 0.4);
      b.fillStyle = '#d98b4e';
      b.beginPath(); b.arc(W * 0.78, py, 9, 0, Math.PI * 2); b.fill();
      px(b, W * 0.78 - 16, py, 32, 1, '#f0c89a');
      b.fillStyle = '#4f8fd9';
      b.beginPath(); b.arc(W * 0.15, py + H * 0.7, 6, 0, Math.PI * 2); b.fill();
    }
    if (st.camY < 260) {
      const base = sy(0);
      for (let x = 0; x < W; x++) {
        const h1 = 18 + Math.sin(x * 0.07) * 6 + Math.sin(x * 0.19) * 3;
        px(b, x, base - h1 + st.camY * 0.25, 1, h1 + 40, '#8cc79a');
        const h2 = 9 + Math.sin(x * 0.11 + 2) * 4;
        px(b, x, base - h2 + st.camY * 0.1, 1, h2 + 40, '#6fb37f');
      }
    }
  }

  function cloudShape(x, y, s, col) {
    px(b, x, y, 14 * s, 4 * s, col);
    px(b, x + 3 * s, y - 3 * s, 7 * s, 3 * s, col);
    px(b, x + 8 * s, y - 2 * s, 5 * s, 2 * s, col);
  }

  function drawClouds(front) {
    const band = 46;
    for (let k = Math.floor(st.camY / band) - 1; k < Math.floor((st.camY + H) / band) + 2; k++) {
      const m = meterAt(k * band);
      if (m < CLOUDS_FROM || m > CLOUDS_TO) continue;
      const dens = Math.sin(Math.PI * (m - CLOUDS_FROM) / (CLOUDS_TO - CLOUDS_FROM));
      for (let j = 0; j < 3; j++) {
        const id = k * 7 + j;
        if (rnd(id) > dens * 0.9 || (rnd(id * 3) < 0.35) !== front) continue;
        const s = 1 + Math.floor(rnd(id * 5) * 2);
        const dir = rnd(id * 11) > 0.5 ? 1 : -1;
        const span = W + 40 * s;
        const x = ((rnd(id * 13) * span + st.t * (4 + rnd(id) * 6) * dir) % span + span) % span - 20 * s;
        b.globalAlpha = front ? 0.92 : 0.75;
        cloudShape(x, sy(k * band + rnd(id * 17) * band), s, '#ffffff');
      }
    }
    b.globalAlpha = 1;
  }

  function drawWorld() {
    const cx = Math.round(W / 2);
    const lo = st.camY - 40, hi = st.camY + H + 40;
    const top = holdY(TREE_TOP);
    const space = clamp((meterAt(st.camY) - 450) / 200, 0, 1);
    for (let wy = Math.max(0, Math.floor(lo / 4) * 4); wy < hi; wy += 4) {
      const r = wy / 4;
      const hw = 24 + Math.floor(rnd(r * 0.37) * 4) + Math.round(Math.sin(r * 0.21) * 4);
      const far = wy < top - 2;
      for (let x = cx - hw; x < cx + hw; x += 4) {
        const v = rnd(r * 31 + x);
        let col = v < 0.2 ? '#6b6f7a' : v > 0.85 ? '#9a9ea8' : '#80848f';
        if (far) col = mix(col, '#a9c7e6', 0.55);
        else if (space) col = mix(col, '#3f3658', space * 0.8);
        px(b, x, sy(wy) - 4, 4, 4, col);
      }
    }
    if (lo < 0) {
      const gy = sy(0);
      px(b, 0, gy, W, H, '#6b4a2b');
      px(b, 0, gy, W, 3, '#4caf50');
      for (let x = 2; x < W; x += 9) px(b, x, gy - 2, 2, 2, rnd(x) > 0.5 ? '#3d9142' : '#f2d14b');
    }
    if (lo < top) {
      for (let wy = Math.max(0, lo); wy < Math.min(top, hi); wy += 2) {
        const yy = sy(wy) - 2;
        px(b, cx - 8, yy, 16, 2, '#7a4f2c');
        if (rnd(Math.floor(wy / 2)) > 0.7) px(b, cx - 6 + Math.floor(rnd(wy) * 10), yy, 2, 2, '#5c3a1e');
      }
      px(b, cx - 12, sy(0) - 3, 24, 3, '#7a4f2c');
      for (let i = 2; i < TREE_TOP; i += 3) {
        if (holdY(i) < lo || holdY(i) > hi) continue;
        const s = rnd(i * 3.1) > 0.5 ? 1 : -1;
        px(b, cx + s * 8 - (s < 0 ? 6 : 0), sy(holdY(i) + 5), 6, 4, '#3f9b47');
      }
      const py = sy(top);
      px(b, cx - 34, py, 70, 4, '#7a4f2c');
      px(b, cx - 34, py + 3, 70, 1, '#5c3a1e');
      for (const [dx, w] of [[-40, 14], [-20, 10], [24, 12], [34, 12]]) {
        px(b, cx + dx, py - 5, w, 6, '#3f9b47');
        px(b, cx + dx + 2, py - 7, w - 4, 2, '#5cbf5f');
      }
    }
    const from = Math.max(1, Math.floor((lo - 16) / STEP) - 2), to = Math.ceil((hi - 16) / STEP) + 2;
    for (let i = from; i <= to; i++) {
      if (i === TREE_TOP) continue;
      const s = side(i), y = sy(holdY(i));
      if (i < TREE_TOP) {
        const len = 10 + Math.floor(rnd(i) * 6);
        px(b, s > 0 ? cx + 8 : cx - 8 - len, y - 1, len, 3, '#7a4f2c');
        px(b, s > 0 ? cx + 6 + len : cx - 12 - len, y - 5, 7, 5, '#3f9b47');
        px(b, s > 0 ? cx + 7 + len : cx - 11 - len, y - 6, 5, 1, '#5cbf5f');
      } else {
        const hx = cx + s * 7 - 3;
        px(b, hx, y - 2, 6, 4, mix('#c9ccd4', '#8e86b0', space));
        px(b, hx, y + 1, 6, 1, mix('#5f636d', '#2c2640', space));
        px(b, hx + 1, y - 2, 3, 1, '#ffffff');
      }
    }
  }

  function birdPos(bd) {
    const cy = sy(st.charY), cx = Math.round(W / 2) + st.side;
    const slots = [[0, -23], [bd.slotSide * 7, -11]];
    const [tx, ty] = slots[bd.slot];
    return [cx + tx, cy + ty];
  }

  function drawBird(bd) {
    const ufo = meterAt(st.charY) >= SPACE_FROM;
    const x = Math.round(bd.x), y = Math.round(bd.y);
    const flap = bd.state !== 'sit' && Math.floor(st.t * 12) % 2;
    if (ufo) {
      px(b, x - 5, y - 1, 10, 3, '#b8c1cc');
      px(b, x - 2, y - 3, 4, 2, '#7fe0ff');
      px(b, x - 4, y + 2, 1, 1, Math.floor(st.t * 6) % 2 ? '#ffde59' : '#ff5c7a');
      px(b, x + 3, y + 2, 1, 1, Math.floor(st.t * 6) % 2 ? '#ff5c7a' : '#ffde59');
      return;
    }
    const f = bd.face;
    px(b, x - 5, y - 3, 10, 6, '#15161b');
    px(b, x + f * 3 - 2, y - 5, 4, 4, '#15161b');
    px(b, x - 4, y - 2, 8, 4, '#eef1f5');
    px(b, x + f * 3 - 1, y - 4, 3, 3, '#eef1f5');
    px(b, x + f * 3 + (f > 0 ? 1 : -1), y - 3, 1, 1, '#15161b');
    px(b, x + f * 5 - (f < 0 ? 1 : 0), y - 3, 2, 1, '#f2a33a');
    px(b, x - f * 5 - (f > 0 ? 1 : 0), y - 1, 2, 2, '#8a93a1');
    px(b, x - 3, y - (flap ? 5 : 1), 5, flap ? 3 : 2, '#b4bcc8');
    if (bd.state === 'sit') { px(b, x - 2, y + 2, 1, 2, '#f2a33a'); px(b, x + 1, y + 2, 1, 2, '#f2a33a'); }
  }

  function spawnBird() {
    const used = st.birds.map(bd => bd.slot);
    const slot = used.includes(0) ? 1 : 0;
    const from = Math.random() < 0.5 ? -1 : 1;
    st.birds.push({ slot, slotSide: from, face: -from, state: 'fly', t: 0, x: from > 0 ? W + 8 : -8, y: H * 0.2, sx: from > 0 ? W + 8 : -8, sy: H * 0.2 });
  }

  function updateBirds(dt) {
    const m = st.hold;
    if (st.mode === 'climb' && m >= BIRDS_FROM) {
      const max = m > 350 ? 2 : 1;
      const rate = Math.min(0.45, 0.07 + (m - BIRDS_FROM) * 0.0008);
      if (st.birds.length < max && Math.random() < rate * dt) spawnBird();
    }
    for (const bd of st.birds) {
      bd.t += dt;
      if (bd.state === 'fly') {
        const [tx, ty] = birdPos(bd);
        const k = Math.min(1, bd.t / 0.9);
        bd.x = bd.sx + (tx - bd.sx) * k;
        bd.y = bd.sy + (ty - bd.sy) * k - Math.sin(k * Math.PI) * 10;
        if (k >= 1) { bd.state = 'sit'; haptic('soft'); }
      } else if (bd.state === 'sit') {
        [bd.x, bd.y] = birdPos(bd);
      } else {
        bd.x += bd.vx * dt;
        bd.y -= 70 * dt;
      }
    }
    st.birds = st.birds.filter(bd => bd.state !== 'leave' || bd.t < 1.2);
  }

  function shoo(bd) {
    bd.state = 'leave';
    bd.t = 0;
    bd.vx = (bd.x < W / 2 ? -1 : 1) * 90;
    bd.face = bd.vx > 0 ? 1 : -1;
    for (let i = 0; i < 5; i++) st.feathers.push({ x: bd.x, y: bd.y, vx: (Math.random() - 0.5) * 40, vy: -Math.random() * 30, life: 0.8 });
    haptic('light');
  }

  function flash(text) {
    const el = $('gMsg');
    el.textContent = text;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
  }

  function grab(next, s) {
    st.fromY = st.charY;
    st.hold = next;
    st.tween = 0;
    if (s) st.side = s;
    st.stamina = Math.min(100, st.stamina + Math.max(4, 8 - next * 0.004));
    haptic('light');
    for (const [m, text] of MILESTONES) if (next === m && st.reached < m) flash(text);
    st.reached = Math.max(st.reached, next);
    if (next === TREE_TOP) startDance();
  }

  function startDance() {
    st.mode = 'dance';
    st.danceT = 0;
    st.stamina = 100;
    for (const bd of st.birds) if (bd.state !== 'leave') shoo(bd);
    if (!audio) audio = new Audio('audio/dance.mp3');
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }

  function stopAudio() {
    if (audio) { audio.pause(); audio.currentTime = 0; }
  }

  function fall() {
    st.mode = 'fall';
    st.fallV = 0;
    st.fallT = 0;
    for (const bd of st.birds) if (bd.state !== 'leave') shoo(bd);
    haptic('error');
  }

  function over() {
    st.mode = 'over';
    const m = st.reached;
    const record = m > best;
    if (record) { best = m; store.set('best', best); }
    $('gFallT').textContent = `Сорвался с ${m} м`;
    $('gFallR').textContent = FALL_ROASTS[Math.floor(Math.random() * FALL_ROASTS.length)];
    $('gFallB').textContent = record && m > 0 ? 'Новый рекорд!' : `Рекорд: ${best} м`;
    $('gFall').classList.remove('hidden');
    updateHud();
  }

  function onTap(e) {
    if (!st || st.mode !== 'climb') return;
    e.preventDefault();
    const r = cv.getBoundingClientRect();
    const bx = (e.clientX - r.left) / r.width * W, by = (e.clientY - r.top) / r.height * H;
    const hit = st.birds.find(bd => bd.state !== 'leave' && Math.hypot(bd.x - bx, bd.y - by) < 12);
    if (hit) return shoo(hit);
    if (st.birds.some(bd => bd.state === 'sit')) {
      st.bonk = 0.3;
      st.stamina -= 4;
      haptic('medium');
      return;
    }
    const tapSide = bx < W / 2 ? -1 : 1;
    const need = side(st.hold + 1);
    if (need === 0 || need === tapSide) grab(st.hold + 1, tapSide);
    else {
      st.stamina -= 12;
      st.shake = 0.25;
      haptic('heavy');
    }
  }

  function update(dt) {
    st.t += dt;
    st.tween = Math.min(1, st.tween + dt / 0.12);
    st.shake = Math.max(0, st.shake - dt);
    st.bonk = Math.max(0, st.bonk - dt);
    if (st.mode === 'fall') {
      st.fallT += dt;
      st.fallV += 520 * dt;
      st.charY -= st.fallV * dt;
      if (st.fallT > 1.3) over();
    } else if (st.mode !== 'over') {
      const k = 1 - Math.pow(1 - st.tween, 3);
      st.charY = st.fromY + (anchor(st.hold) - st.fromY) * k;
    }
    if (st.mode === 'climb') {
      const sitting = st.birds.some(bd => bd.state === 'sit');
      const drain = 6 + Math.min(16, st.hold * 0.025);
      st.stamina -= drain * dt * (sitting ? 1.7 : 1) * (st.hold === 0 ? 0 : 1);
      if (st.stamina <= 0) { st.stamina = 0; fall(); }
    }
    if (st.mode === 'dance') {
      st.danceT += dt;
      if (st.danceT >= DANCE_SEC) { stopAudio(); st.mode = 'climb'; st.fromY = st.charY; }
    }
    updateBirds(dt);
    for (const f of st.feathers) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 40 * dt; f.life -= dt; }
    st.feathers = st.feathers.filter(f => f.life > 0);
    const target = st.mode === 'fall' ? st.camY - st.fallV * dt * 0.35 : Math.max(-6, st.charY - H * 0.36);
    st.camY += (target - st.camY) * Math.min(1, dt * 8);
  }

  function draw() {
    drawSky();
    drawClouds(false);
    drawWorld();
    const cx = Math.round(W / 2) + (st.mode === 'dance' ? 0 : st.side) + (st.shake ? Math.round(Math.sin(st.t * 80) * 2) : 0);
    const cy = sy(st.charY) + (st.bonk ? -1 : 0);
    let pose = 'grip', back = true, wink = false;
    if (st.mode === 'dance') {
      const i = Math.min(DANCE.length - 1, Math.floor(st.danceT / (DANCE_SEC / DANCE.length)));
      pose = DANCE[i];
      back = false;
      wink = i >= DANCE.length - 2;
      drawChar(pose, cx, cy + (i % 2 ? 1 : 0), back, wink);
    } else {
      if (st.mode === 'fall') { pose = Math.floor(st.t * 10) % 2 ? 'fall' : 'grip'; back = false; }
      else if (st.hold === 0 || st.hold === TREE_TOP) pose = 'stand';
      else pose = st.side < 0 ? 'reachL' : 'reachR';
      drawChar(pose, cx, cy, back, wink);
    }
    if (st.bonk) for (let i = 0; i < 3; i++) px(b, cx - 6 + i * 6, cy - 26 - (i % 2) * 2, 2, 2, '#ffde59');
    for (const bd of st.birds) drawBird(bd);
    for (const f of st.feathers) px(b, f.x, f.y, 2, 1, '#e8ecf2');
    drawClouds(true);
    g.drawImage(buf, 0, 0, W * scale, H * scale);
  }

  function updateHud() {
    $('gM').textContent = st.reached;
    $('gBest').textContent = Math.max(best, st.reached);
    const bar = $('gSt');
    bar.style.width = Math.max(0, st.stamina) + '%';
    bar.classList.toggle('low', st.stamina < 30);
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    update(dt);
    draw();
    updateHud();
    raf = requestAnimationFrame(loop);
  }

  function start() {
    reset();
    $('gStart').classList.add('hidden');
    $('gFall').classList.add('hidden');
    haptic('light');
  }

  function init() {
    cv = $('gCanvas');
    g = cv.getContext('2d');
    buf = document.createElement('canvas');
    b = buf.getContext('2d');
    cv.addEventListener('pointerdown', onTap);
    $('gGo').addEventListener('click', start);
    $('gAgain').addEventListener('click', start);
    addEventListener('resize', () => { if (raf) resize(); });
    store.get('best').then(v => { best = parseInt(v, 10) || 0; if (st) updateHud(); });
  }

  return {
    open() {
      if (!cv) init();
      if (!st) { reset(); st.mode = 'ready'; }
      resize();
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
    },
    close() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      stopAudio();
      if (st && st.mode === 'dance') { st.mode = 'climb'; st.fromY = st.charY; }
    },
  };
})();
