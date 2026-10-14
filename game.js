const Game = (() => {
  const STEP = 12;
  const TREE_TOP = 40;
  const BIRDS_FROM = 50;
  const CLOUDS_FROM = 55;
  const CLOUDS_TO = 420;
  const SPACE_FROM = 600;
  const SKY = [
    [0, '#7cc7f2', '#d6f0ff'], [60, '#62b2ec', '#bfe4ff'], [300, '#3f7fd0', '#8bbcef'],
    [500, '#172c5e', '#30508f'], [650, '#05060f', '#0b1026'],
  ];
  const MILESTONES = [
    [TREE_TOP, 'Вершина дерева!'], [TREE_TOP + 2, 'Теперь гора'], [80, 'Птицы, блять'],
    [180, 'В облаках'], [CLOUDS_TO, 'Выше облаков'], [SPACE_FROM, 'Космос, сука'], [1000, 'Илон Маск нервно курит'],
  ];
  const FALL_ROASTS = [
    'Хват как у пенсионера', 'Магнезию забыл, гений?', 'Ну ты и мешок', 'Гравитация передаёт привет',
    'Даже голубь лезет лучше', 'Слабак, давай ещё', 'Пиздец полёт', 'Скалодром плачет',
  ];

  let cv, g, buf, b, W, H, scale, raf = 0, last = 0, st = null, ch = null, audio = null, best = 0;
  const $ = id => document.getElementById(id);
  const rnd = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const clamp = (v, a, z) => Math.max(a, Math.min(z, v));

  // ряды зацепок: на дереве от земли, выше платформы — заново от её уровня (как от земли)
  const PLAT_Y = -36 - TREE_TOP * STEP;
  const rowY = i => i <= TREE_TOP ? -36 - i * STEP : PLAT_Y - 36 - (i - TREE_TOP - 1) * STEP;
  const meters = y => Math.max(0, Math.round((-y - 36) / STEP));

  function side(i) {
    if (i < 0) return i % 2 ? -1 : 1;
    while (st.sides.length <= i) {
      const prev = st.sides[st.sides.length - 1] || 1;
      st.sides.push(Math.random() < 0.6 ? -prev : prev);
    }
    return st.sides[i];
  }

  function hold(i) {
    const s = side(i), same = s === side(i - 1);
    const x = s * (same ? 4 + Math.round(rnd(i)) : 9 + Math.round(rnd(i) * 3));
    const y = rowY(i) + Math.round(rnd(i + 50) * 2 - 1);
    return y >= 0 ? { x: s * 4, y: 0, side: s, ground: true } : { x, y, side: s };
  }

  // выступы ног тянутся за стороной зацепок выше; после танца нижние ряды — это сама платформа
  function foot(j, s) {
    const y = rowY(j);
    const floor = st.afterTree ? PLAT_Y : 0;
    if (y >= floor) return { x: s * 4, y: floor, ground: true };
    return { x: side(j + 2) * 6 + (s < 0 ? -2 : 2) + Math.round(rnd(j * 3 + s) * 2 - 1), y: y + Math.round(rnd(j * 5)) };
  }

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

  function reset() {
    st = {
      mode: 'climb', sides: [1], stamina: 100, camY: 0, queue: null, reached: 0, afterTree: false,
      birds: [], feathers: [], shake: 0, bonk: 0, t: 0, fallT: 0, danceT: 0,
    };
    ch = Char.create(hold, foot);
    ch.onDone = onStepDone;
    ch.hangAt(1);
    st.camY = Math.min(ch.hip.y - H * 0.6, -H * 0.85);
  }

  function resize() {
    const w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    scale = Math.max(2, Math.round(w / 195));
    W = Math.ceil(w / scale);
    H = Math.ceil(h / scale);
    buf.width = W; buf.height = H;
    cv.width = W * scale; cv.height = H * scale;
    g.imageSmoothingEnabled = false;
    b.imageSmoothingEnabled = false;
  }

  const SX = x => Math.round(x + W / 2);
  const SY = y => Math.round(y - st.camY);
  function px(x, y, w, h, col) { b.fillStyle = col; b.fillRect(Math.round(x), Math.round(y), w, h); }

  function drawSky() {
    const m = meters(st.camY + H / 2);
    const [top, bottom] = skyAt(m);
    const gr = b.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, top);
    gr.addColorStop(1, bottom);
    b.fillStyle = gr;
    b.fillRect(0, 0, W, H);
    const stars = clamp((m - 430) / 220, 0, 1);
    if (stars > 0) {
      b.globalAlpha = stars;
      for (let i = 0; i < 90; i++) {
        const x = Math.floor(rnd(i) * W), y = Math.floor(((rnd(i + 99) * H * 3 - st.camY * 0.05) % H + H) % H);
        px(x, y, 1, 1, rnd(i + 7) > 0.85 ? '#ffe9a8' : '#ffffff');
      }
      b.globalAlpha = 1;
    }
    if (m > SPACE_FROM + 30) {
      const py = Math.round(((H * 0.3 - st.camY * 0.04) % (H * 1.6) + H * 1.6) % (H * 1.6) - H * 0.3);
      b.fillStyle = '#d98b4e';
      b.beginPath(); b.arc(W * 0.8, py, 12, 0, Math.PI * 2); b.fill();
      px(W * 0.8 - 22, py, 44, 1, '#f0c89a');
      b.fillStyle = '#4f8fd9';
      b.beginPath(); b.arc(W * 0.15, py + H * 0.7, 8, 0, Math.PI * 2); b.fill();
    }
    if (st.camY > -700) {
      for (const [par, base, amp, col, f] of [[0.15, 34, 24, '#9cc3e4', 0.031], [0.3, 14, 18, '#7aa5cf', 0.047]]) {
        const gy = -st.camY * par + H * 0.62;
        for (let x = 0; x < W; x++) {
          const hh = base + Math.abs(Math.sin(x * f + par * 9)) * amp + Math.sin(x * f * 3.7) * 3;
          px(x, gy - hh, 1, H, col);
        }
      }
    }
  }

  function cloud(x, y, s, alpha) {
    b.globalAlpha = alpha;
    px(x - 1, y - 1, 26 * s, 8 * s, '#b7d9f2');
    px(x, y, 24 * s, 6 * s, '#ffffff');
    px(x + 5 * s, y - 4 * s, 12 * s, 5 * s, '#ffffff');
    b.globalAlpha = 1;
  }

  function drawClouds(front) {
    const band = 46;
    for (let k = Math.floor(st.camY / band) - 1; k < Math.floor((st.camY + H) / band) + 2; k++) {
      const m = meters(k * band);
      if (m < CLOUDS_FROM || m > CLOUDS_TO) continue;
      const dens = Math.sin(Math.PI * (m - CLOUDS_FROM) / (CLOUDS_TO - CLOUDS_FROM));
      for (let j = 0; j < 3; j++) {
        const id = k * 7 + j;
        if (rnd(id) > dens * 0.9 || (rnd(id * 3) < 0.35) !== front) continue;
        const s = 1 + Math.floor(rnd(id * 5) * 2);
        const dir = rnd(id * 11) > 0.5 ? 1 : -1;
        const span = W + 60 * s;
        const x = ((rnd(id * 13) * span + st.t * (4 + rnd(id) * 6) * dir) % span + span) % span - 30 * s;
        cloud(x, SY(k * band + rnd(id * 17) * band), s, front ? 0.92 : 0.75);
      }
    }
  }

  function drawWorld() {
    const ox = W / 2;
    const top = st.camY - 4, bottom = st.camY + H + 4;
    const space = clamp((meters(st.camY) - 450) / 200, 0, 1);
    for (let y = Math.floor(top / 2) * 2; y < Math.min(0, bottom); y += 2) {
      const r = Math.floor(y / 2);
      const hw = 34 + Math.round(Math.sin(r * 0.13) * 5 + Math.sin(r * 0.41) * 2 + rnd(r) * 2);
      const far = y > PLAT_Y;
      const sy = SY(y);
      const edge = far ? '#6e86a3' : '#2a2433';
      px(ox - hw - 1, sy, 1, 2, edge);
      px(ox + hw, sy, 1, 2, edge);
      for (let x = -hw; x < hw; x += 3) {
        const v = rnd(Math.floor(y / 3) * 57 + Math.floor(x / 3) * 13);
        let col = v < 0.18 ? '#6c6878' : v > 0.86 ? '#a7a3b2' : '#8a8697';
        if (x < -hw + 4) col = '#a7a3b2';
        if (x > hw - 5) col = '#5d596a';
        if (far) col = mix(col, '#a9c7e6', 0.55);
        else if (space) col = mix(col, '#3f3658', space * 0.8);
        px(ox + x, sy, 3, 2, col);
      }
    }
    if (bottom > PLAT_Y) {
      for (let y = Math.max(PLAT_Y, Math.floor(top)); y < Math.min(0, bottom); y += 2) {
        const sy = SY(y);
        px(ox - 15, sy, 1, 2, '#2a1a10');
        px(ox + 14, sy, 1, 2, '#2a1a10');
        px(ox - 14, sy, 28, 2, '#7a4f2c');
        px(ox - 14, sy, 3, 2, '#94633a');
        px(ox + 10, sy, 4, 2, '#5c3a1e');
        if (rnd(Math.floor(y / 2)) > 0.72) px(ox - 9 + Math.floor(rnd(y) * 18), sy, 3, 2, '#5c3a1e');
      }
      const py = SY(PLAT_Y);
      px(ox - 46, py - 1, 92, 7, '#2a1a10');
      px(ox - 45, py, 90, 5, '#7a4f2c');
      px(ox - 45, py, 90, 1, '#94633a');
      for (const [dx, w] of [[-52, 16], [-30, 12], [24, 14], [40, 16]]) {
        px(ox + dx - 1, py - 8, w + 2, 9, '#1f4a24');
        px(ox + dx, py - 7, w, 7, '#3f9b47');
        px(ox + dx + 2, py - 7, w - 4, 2, '#5cbf5f');
      }
    }
    for (let i = -3; i < ch.k + 40; i++) {
      if (i === TREE_TOP) continue;
      const h = hold(i);
      if (h.ground) continue;
      const sx = SX(h.x), sy = SY(h.y);
      if (sy < -10 || sy > H + 10) continue;
      if (i < TREE_TOP) {
        const out = h.x < 0 ? -1 : 1;
        px(sx - 4, sy - 2, 9, 5, '#2a1a10');
        px(sx - 3, sy - 1, 7, 3, '#9b6a3e');
        px(sx - 3, sy - 1, 5, 1, '#c08a55');
        px(sx + out * 4 - (out < 0 ? 3 : 0), sy - 6, 4, 4, '#3f9b47');
      } else {
        px(sx - 3, sy - 2, 7, 5, '#2a2433');
        px(sx - 2, sy - 1, 5, 3, mix('#c9b79c', '#9a8fbf', space));
        px(sx - 2, sy - 1, 3, 1, mix('#efe2c8', '#c9c2ea', space));
        px(sx - 2, sy + 1, 5, 1, mix('#8c7a62', '#5a5180', space));
      }
    }
    for (let j = -3; j < ch.k + 40; j++) {
      for (const s of [-1, 1]) {
        const f = foot(j, s);
        const sx = SX(f.x), sy = SY(f.y);
        // левая нога ходит по чётным рядам, правая по нечётным — рисуем только используемые выступы
        if (f.ground || (j % 2 === 0) !== (s < 0) || sy < -10 || sy > H + 10) continue;
        px(sx - 2, sy - 1, 5, 3, j < TREE_TOP ? '#2a1a10' : '#2a2433');
        px(sx - 1, sy, 3, 1, j < TREE_TOP ? '#6b4426' : '#8f7f68');
      }
    }
    const gy = SY(0);
    if (gy < H) {
      px(0, gy, W, H, '#6b4a2b');
      px(0, gy - 1, W, 1, '#2a2433');
      px(0, gy, W, 3, '#5cbf5f');
      px(0, gy + 3, W, 1, '#3d9142');
      for (let x = 1; x < W; x += 7) px(x, gy - 2, 1, 2, rnd(x) > 0.8 ? '#f2d14b' : '#5cbf5f');
    }
  }

  function headPos() { return [SX(ch.hip.x), SY(ch.hip.y) - 31]; }

  function drawBird(bd) {
    const ufo = meters(ch.hip.y) >= SPACE_FROM;
    const x = Math.round(bd.x), y = Math.round(bd.y);
    const flap = bd.state !== 'sit' && Math.floor(st.t * 12) % 2;
    if (ufo) {
      px(x - 6, y - 2, 12, 4, '#15161b');
      px(x - 5, y - 1, 10, 2, '#b8c1cc');
      px(x - 2, y - 4, 4, 3, '#7fe0ff');
      px(x - 4, y + 1, 1, 1, Math.floor(st.t * 6) % 2 ? '#ffde59' : '#ff5c7a');
      px(x + 3, y + 1, 1, 1, Math.floor(st.t * 6) % 2 ? '#ff5c7a' : '#ffde59');
      return;
    }
    const f = bd.face;
    px(x - 5, y - 3, 10, 6, '#15161b');
    px(x + f * 3 - 2, y - 5, 4, 4, '#15161b');
    px(x - 4, y - 2, 8, 4, '#eef1f5');
    px(x + f * 3 - 1, y - 4, 3, 3, '#eef1f5');
    px(x + f * 3 + (f > 0 ? 1 : -1), y - 3, 1, 1, '#15161b');
    px(x + f * 5 - (f < 0 ? 1 : 0), y - 3, 2, 1, '#f2a33a');
    px(x - 3, y - (flap ? 5 : 1), 5, flap ? 3 : 2, '#b4bcc8');
    if (bd.state === 'sit') { px(x - 2, y + 2, 1, 2, '#f2a33a'); px(x + 1, y + 2, 1, 2, '#f2a33a'); }
  }

  function updateBirds(dt) {
    const m = ch.k;
    if (st.mode === 'climb' && m >= BIRDS_FROM && st.birds.length < 1) {
      const rate = Math.min(0.45, 0.07 + (m - BIRDS_FROM) * 0.0008);
      if (Math.random() < rate * dt) {
        const from = Math.random() < 0.5 ? -1 : 1;
        st.birds.push({ state: 'fly', t: 0, face: -from, sx: from > 0 ? W + 8 : -8, sy: H * 0.25, x: 0, y: 0 });
      }
    }
    const [hx, hy] = headPos();
    for (const bd of st.birds) {
      bd.t += dt;
      if (bd.state === 'fly') {
        const k = Math.min(1, bd.t / 0.9);
        bd.x = bd.sx + (hx - bd.sx) * k;
        bd.y = bd.sy + (hy - 3 - bd.sy) * k - Math.sin(k * Math.PI) * 12;
        if (k >= 1) { bd.state = 'sit'; haptic('soft'); }
      } else if (bd.state === 'sit') {
        bd.x = hx; bd.y = hy - 3;
      } else {
        bd.x += bd.vx * dt;
        bd.y -= 80 * dt;
      }
    }
    st.birds = st.birds.filter(bd => bd.state !== 'leave' || bd.t < 1.2);
  }

  function shoo(bd) {
    bd.state = 'leave';
    bd.t = 0;
    bd.vx = (bd.x < W / 2 ? -1 : 1) * 100;
    bd.face = bd.vx > 0 ? 1 : -1;
    for (let i = 0; i < 6; i++) st.feathers.push({ x: bd.x, y: bd.y, vx: (Math.random() - 0.5) * 50, vy: -Math.random() * 30, life: 0.8 });
    haptic('light');
  }

  function flash(text) {
    const el = $('gMsg');
    el.textContent = text;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
  }

  function stepDur() { return Math.max(0.28, 0.42 - ch.k * 0.0002); }

  function tryClimb(tapSide) {
    const next = hold(ch.k + 1);
    if (next.side !== tapSide) {
      st.stamina -= 12;
      st.shake = 0.25;
      haptic('heavy');
      return;
    }
    ch.climbUp(stepDur());
    st.stamina = Math.min(100, st.stamina + Math.max(4, 8 - ch.k * 0.004));
    haptic('light');
  }

  function onStepDone() {
    const k = ch.k;
    for (const [m, text] of MILESTONES) if (k === m && st.reached < m) flash(text);
    st.reached = Math.max(st.reached, k);
    if (k === TREE_TOP) return startTopOfTree();
    if (st.queue && st.mode === 'climb') {
      const s = st.queue;
      st.queue = null;
      tryClimb(s);
    }
  }

  // вылез на платформу: встаёт (таз плавно поднимается из виса) и танцует под первые 4 секунды песни
  function startTopOfTree() {
    st.mode = 'dance';
    st.queue = null;
    st.stamina = 100;
    for (const bd of st.birds) if (bd.state !== 'leave') shoo(bd);
    const hip = { ...ch.hip };
    ch.stand(0, PLAT_Y);
    ch.hip = hip;
    st.danceT = 0;
    if (!audio) audio = new Audio('audio/dance.mp3');
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }

  function endDance() {
    if (audio) { audio.pause(); audio.currentTime = 0; }
    st.afterTree = true;
    st.mode = 'climb';
    ch.onDone = onStepDone;
    ch.hangAt(TREE_TOP + 2);
    flash('Теперь гора');
    st.reached = Math.max(st.reached, TREE_TOP + 2);
  }

  function fall() {
    st.mode = 'fall';
    st.fallT = 0;
    st.queue = null;
    for (const bd of st.birds) if (bd.state !== 'leave') shoo(bd);
    // с горы падает на платформу дерева, с дерева — на землю
    ch.fall(st.afterTree ? PLAT_Y : 0);
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
    if (!st || (st.mode !== 'climb')) return;
    e.preventDefault();
    const r = cv.getBoundingClientRect();
    const bx = (e.clientX - r.left) / r.width * W, by = (e.clientY - r.top) / r.height * H;
    const hit = st.birds.find(bd => bd.state !== 'leave' && Math.hypot(bd.x - bx, bd.y - by) < 14);
    if (hit) return shoo(hit);
    if (st.birds.some(bd => bd.state === 'sit')) {
      st.bonk = 0.3;
      st.stamina -= 4;
      haptic('medium');
      return;
    }
    const tapSide = bx < W / 2 ? -1 : 1;
    // во время перехвата тап не теряется: запоминаем один следующий
    if (ch.mode === 'climb') { st.queue = tapSide; return; }
    tryClimb(tapSide);
  }

  function update(dt) {
    st.t += dt;
    st.shake = Math.max(0, st.shake - dt);
    st.bonk = Math.max(0, st.bonk - dt);
    ch.update(dt);
    if (st.mode === 'climb') {
      const sitting = st.birds.some(bd => bd.state === 'sit');
      const drain = 6 + Math.min(14, ch.k * 0.02);
      if (ch.k > 1 || ch.mode === 'climb') st.stamina -= drain * dt * (sitting ? 1.7 : 1);
      if (st.stamina <= 0) { st.stamina = 0; fall(); }
    } else if (st.mode === 'dance') {
      st.danceT += dt;
      if (st.danceT > 0.45 && ch.mode === 'stand' && !ch.danceBase) {
        ch.onDone = endDance;
        ch.dance(0, PLAT_Y);
      }
    } else if (st.mode === 'fall') {
      st.fallT += dt;
      if (st.fallT > 1.4) over();
    }
    updateBirds(dt);
    for (const f of st.feathers) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 40 * dt; f.life -= dt; }
    st.feathers = st.feathers.filter(f => f.life > 0);
    const target = st.mode === 'fall' ? st.camY + (ch.hip.y - H * 0.5 - st.camY) * 0.35 : Math.min(ch.hip.y - H * 0.6, -H * 0.85);
    st.camY += (target - st.camY) * Math.min(1, dt * 6);
  }

  function draw() {
    drawSky();
    drawClouds(false);
    drawWorld();
    const shake = st.shake ? Math.round(Math.sin(st.t * 80) * 2) : 0;
    ch.draw(b, -W / 2 - shake, st.camY);
    if (st.bonk) {
      const [hx, hy] = headPos();
      for (let i = 0; i < 3; i++) px(hx - 7 + i * 7, hy - 6 - (i % 2) * 2, 2, 2, '#ffde59');
    }
    for (const bd of st.birds) drawBird(bd);
    for (const f of st.feathers) px(f.x, f.y, 2, 1, '#e8ecf2');
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
      resize();
      if (!st) { reset(); st.mode = 'ready'; }
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
    },
    close() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      if (audio) { audio.pause(); audio.currentTime = 0; }
      if (st && st.mode === 'dance') endDance();
    },
  };
})();
