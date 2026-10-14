const Game = (() => {
  const STEP = 12;
  const TREE_TOP = 40;
  const BIRDS_FROM = 50;
  const CLOUDS_FROM = 55;
  const CLOUDS_TO = 420;
  const SPACE_FROM = 600;
  const OUTLINE = '#1a1620';
  // небо по высоте: [метры, верх, низ]
  const SKY = [
    [0, '#6cc4ee', '#cfeee8'], [60, '#5fb4ec', '#bfe4ff'], [250, '#4f9fe0', '#a8d8f4'],
    [380, '#3a3f95', '#f4a070'], [480, '#1c2a6a', '#7a4fa8'], [600, '#0e0a2e', '#140a3a'], [680, '#06061a', '#0e0a2e'],
  ];
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const MILESTONES = [
    [TREE_TOP, 'Вершина дерева!'], [80, 'Птицы, блять'],
    [180, 'В облаках'], [CLOUDS_TO, 'Выше облаков'], [SPACE_FROM, 'Космос, сука'], [1000, 'Илон Маск нервно курит'],
  ];
  const FALL_ROASTS = [
    'Хват как у пенсионера', 'Магнезию забыл, гений?', 'Ну ты и мешок', 'Гравитация передаёт привет',
    'Даже голубь лезет лучше', 'Слабак, давай ещё', 'Пиздец полёт', 'Скалодром плачет',
  ];
  const BARK = { light: '#a8743f', body: '#7a4c2a', shadow: '#4a2c1a', dark: '#2b1a12' };
  const LEAF = { out: '#173a22', deep: '#1f5a38', shadow: '#2f7a3a', body: '#4fa83f', light: '#8fd45a', hi: '#c9e86a' };
  const ROCK = { light: '#b8bfd0', body: '#8790a6', shadow: '#5a6280', deep: '#3a4060', crack: '#2a2e44' };

  let cv, g, buf, b, W, H, scale, raf = 0, last = 0, st = null, ch = null, best = 0;
  let sky = null, skyKey = '';
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
      birds: [], parts: [], shake: 0, bonk: 0, t: 0, fallT: 0, danceT: 0, levelT: 0,
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
    skyKey = '';
  }

  let camX = 0;
  const SX = x => Math.round(x + W / 2 + camX);
  const SY = y => Math.round(y - st.camY);
  function px(x, y, w, h, col) { b.fillStyle = col; b.fillRect(Math.round(x), Math.round(y), w, h); }
  function disc(cx, cy, r, col) {
    b.fillStyle = col;
    for (let dy = -r; dy <= r; dy++) {
      const w = Math.floor(Math.sqrt(r * r - dy * dy));
      b.fillRect(Math.round(cx - w), Math.round(cy + dy), w * 2 + 1, 1);
    }
  }

  // небо полосами с дизерингом Байера; перерисовываем только когда меняется высота
  function drawSky(m) {
    const key = `${W}x${H}:${m}`;
    if (key !== skyKey) {
      skyKey = key;
      if (!sky) sky = document.createElement('canvas');
      sky.width = W; sky.height = H;
      const sc = sky.getContext('2d'), img = sc.createImageData(W, H), d = img.data;
      const [top, bottom] = skyAt(m);
      const bands = 6, cols = [];
      for (let i = 0; i <= bands; i++) cols.push(mix(top, bottom, i / bands).slice(1).match(/../g).map(h => parseInt(h, 16)));
      for (let y = 0; y < H; y++) {
        const t = y / (H - 1) * bands, i = Math.min(bands - 1, Math.floor(t)), f = t - i;
        for (let x = 0; x < W; x++) {
          const c = f * 16 > BAYER[(y & 3) * 4 + (x & 3)] ? cols[i + 1] : cols[i];
          const o = (y * W + x) * 4;
          d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
        }
      }
      sc.putImageData(img, 0, 0);
    }
    b.drawImage(sky, 0, 0);
  }

  function drawSpace(m) {
    const a = clamp((m - 430) / 220, 0, 1);
    if (a <= 0) return;
    b.globalAlpha = a * 0.08;
    for (const [i, col] of [[0, '#7a3fa0'], [1, '#2f5fb0'], [2, '#c04a8a']]) {
      const cy = ((rnd(i + 70) * H * 2 - st.camY * 0.05) % (H * 2) + H * 2) % (H * 2) - H * 0.5;
      disc(rnd(i + 80) * W, cy, 40 + Math.round(rnd(i + 90) * 30), col);
    }
    b.globalAlpha = a;
    const blink = Math.floor(st.t * 2);
    for (const [k, n] of [[0.05, 70], [0.15, 30]]) {
      for (let i = 0; i < n; i++) {
        const id = i + k * 1000;
        const x = Math.floor(rnd(id) * W), y = Math.floor(((rnd(id + 99) * H * 3 - st.camY * k) % H + H) % H);
        const r = rnd(id + 7);
        if (r > 0.95) {
          const on = (blink + i) % 3 !== 0;
          const col = on ? '#ffffff' : '#c8cdf2';
          px(x, y - 1, 1, 3, col); px(x - 1, y, 3, 1, col);
        } else px(x, y, 1, 1, r > 0.8 ? '#ffd84a' : r > 0.5 ? '#c8cdf2' : '#6a6f9c');
      }
    }
    if (m > SPACE_FROM + 30) {
      const py = Math.round(((H * 0.3 - st.camY * 0.04) % (H * 1.6) + H * 1.6) % (H * 1.6) - H * 0.3);
      planet(Math.round(W * 0.78), py, 16, ['#f4c27a', '#d98a4a', '#8a4a3a', '#4a2a38'], true);
      planet(Math.round(W * 0.16), py + Math.round(H * 0.65), 9, ['#9ad0f0', '#5a8ad0', '#2f4a8a', '#1a2a5a'], false);
    }
    b.globalAlpha = 1;
  }

  // кольцо — пиксельный эллипс: задняя половина под планетой, передняя поверх
  function ringHalf(cx, cy, r, front) {
    for (let a = 0; a < 360; a += 3) {
      const s = Math.sin(a * Math.PI / 180);
      if ((s > 0) !== front) continue;
      px(cx + Math.cos(a * Math.PI / 180) * (r + 8), cy + s * 3, 1, 1, front ? '#c9a0e0' : '#8a6aa8');
    }
  }

  function planet(cx, cy, r, [light, body, shadow, deep], ring) {
    if (ring) ringHalf(cx, cy, r, false);
    disc(cx, cy, r + 1, OUTLINE);
    disc(cx, cy, r, deep);
    disc(cx - 1, cy - 1, r - 2, shadow);
    disc(cx - 3, cy - 3, r - 4, body);
    disc(cx - 5, cy - 5, Math.max(1, r - 9), light);
    if (ring) ringHalf(cx, cy, r, true);
  }

  // дальние слои (горы, лес) — бледнее и медленнее мира
  function drawFar(m, skyBottom) {
    const fade = 1 - clamp((m - 450) / 150, 0, 1);
    if (fade <= 0) return;
    b.globalAlpha = fade;
    const layers = [
      { k: 0.08, base: 0.55, amp: 60, f: 0.021, col: '#8090b8', snow: true },
      { k: 0.16, base: 0.68, amp: 44, f: 0.033, col: '#5f7298', snow: true },
      { k: 0.3, base: 0.82, amp: 18, f: 0.06, col: '#3f6a52', canopy: true },
    ];
    layers.forEach((l, li) => {
      const col = mix(l.col, skyBottom, 0.45 - li * 0.12);
      const gy = Math.round(H * l.base - st.camY * l.k);
      if (gy > H + l.amp + 40) return;
      for (let x = 0; x < W; x++) {
        let h;
        if (l.canopy) h = 10 + Math.round(Math.abs(Math.sin(x * 0.11 + li)) * 8 + Math.sin(x * 0.37) * 3);
        else h = Math.round(l.amp * Math.abs(Math.sin(x * l.f + li * 2)) + 12 * Math.abs(Math.sin(x * l.f * 2.7 + 1)));
        px(x, gy - h, 1, H, col);
        if (l.snow && h > l.amp * 0.8) px(x, gy - h, 1, 3 + (x % 3 === 0 ? 1 : 0), mix('#f4f8ff', skyBottom, 0.3));
      }
    });
    b.globalAlpha = 1;
  }

  function cloud(cx, cy, s, seed, tint) {
    const n = 3 + Math.floor(rnd(seed) * 3);
    const blobs = [];
    for (let i = 0; i < n; i++) blobs.push([cx + (i - (n - 1) / 2) * 9 * s + rnd(seed + i) * 4, cy - rnd(seed + i * 3) * 5 * s, Math.round((5 + rnd(seed + i * 7) * 5) * s)]);
    const [hi, body, low] = [mix('#ffffff', tint, 0.15), mix('#dfe9f5', tint, 0.25), mix('#a9bddb', tint, 0.35)];
    for (const [x, y, r] of blobs) disc(x, y + 2, r, low);
    for (const [x, y, r] of blobs) disc(x, y, r, body);
    for (const [x, y, r] of blobs) disc(x - 1, y - 2, Math.max(1, r - 3), hi);
  }

  function drawClouds(front, skyBottom) {
    const band = 50;
    for (let k = Math.floor(st.camY / band) - 1; k < Math.floor((st.camY + H) / band) + 2; k++) {
      const m = meters(k * band);
      if (m < CLOUDS_FROM || m > CLOUDS_TO) continue;
      const dens = Math.sin(Math.PI * (m - CLOUDS_FROM) / (CLOUDS_TO - CLOUDS_FROM));
      for (let j = 0; j < 3; j++) {
        const id = k * 7 + j;
        if (rnd(id) > dens * 0.9 || (rnd(id * 3) < 0.3) !== front) continue;
        const s = front ? 1.4 : 0.8 + rnd(id * 5) * 0.6;
        const dir = rnd(id * 11) > 0.5 ? 1 : -1;
        const span = W + 120;
        const x = ((rnd(id * 13) * span + st.t * (4 + rnd(id) * 6) * dir) % span + span) % span - 60;
        b.globalAlpha = front ? 0.92 : 0.85;
        cloud(x, SY(k * band + rnd(id * 17) * band), s, id, skyBottom);
        b.globalAlpha = 1;
      }
    }
  }

  function leafCluster(cx, cy, size, seed) {
    const sway = Math.round(Math.sin(st.t * 1.6 + seed) * 0.6);
    const n = 3 + Math.floor(rnd(seed) * 3);
    const blobs = [];
    for (let i = 0; i < n; i++) {
      const a = rnd(seed + i * 2) * Math.PI * 2, d = rnd(seed + i * 5) * size * 0.6;
      blobs.push([cx + Math.cos(a) * d + sway, cy + Math.sin(a) * d * 0.6, Math.round(size * (0.45 + rnd(seed + i * 9) * 0.3))]);
    }
    for (const [x, y, r] of blobs) disc(x, y, r + 1, LEAF.out);
    for (const [x, y, r] of blobs) disc(x, y, r, LEAF.shadow);
    for (const [x, y, r] of blobs) disc(x - 1, y - 1, Math.max(1, r - 2), LEAF.body);
    for (const [x, y, r] of blobs) disc(x - 2, y - 3, Math.max(1, r - 5), LEAF.light);
    const [x0, y0, r0] = blobs[0];
    px(x0 - 2, y0 - r0 + 1, 2, 1, LEAF.hi);
  }

  function branch(x0, y0, x1, y1, seed) {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
    for (const [w, col] of [[9, BARK.dark], [7, BARK.body]]) {
      for (let i = 0; i <= n; i++) {
        const k = i / n, t = Math.round(lerpN(w, w - 4, k));
        px(x0 + (x1 - x0) * k - t / 2, y0 + (y1 - y0) * k - t / 2, t, t, col);
      }
    }
    for (let i = 0; i <= n; i += 1) {
      const k = i / n;
      px(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k - lerpN(3, 1, k), 1, 1, BARK.light);
    }
    leafCluster(x1, y1 - 2, 14 + Math.round(rnd(seed) * 6), seed);
    if (rnd(seed * 3) > 0.5) leafCluster((x0 + x1) / 2, (y0 + y1) / 2 - 6, 9, seed + 17);
  }
  const lerpN = (a, z, k) => a + (z - a) * k;

  // ствол: свет слева, тень справа, борозды коры и сучки по детерминированному хэшу
  function drawTree(top, bottom) {
    const tTop = Math.max(PLAT_Y, Math.floor(top / 2) * 2), tBot = Math.min(0, bottom);
    for (let y = tTop; y < tBot; y += 2) {
      const r = Math.floor(y / 2);
      const bend = Math.round(Math.sin(y * 0.01) * 2);
      const half = 20 + (y > -40 ? Math.round((y + 40) * 0.25) : 0);
      const sy = SY(y), l = SX(-half + bend), w = half * 2;
      px(l - 1, sy, w + 2, 2, BARK.dark);
      px(l, sy, w, 2, BARK.body);
      px(l, sy, 6, 2, BARK.light);
      px(l + w - 9, sy, 9, 2, BARK.shadow);
      // длинные вертикальные борозды: у каждой своя колонка и свои отрезки разной длины
      for (let f = 0; f < 5; f++) {
        const fx = 6 + Math.floor(rnd(f * 13 + 1) * (w - 14));
        const seg = Math.floor((y + rnd(f + 3) * 40) / 22);
        if (rnd(seg * 7 + f) > 0.45) px(l + fx + Math.round(Math.sin(y * 0.05 + f)), sy, 1, 2, f % 2 ? BARK.shadow : BARK.dark);
      }
      if (rnd(Math.floor(y / 160)) > 0.5 && ((y % 160) + 160) % 160 < 8) {
        const kx = l + 8 + Math.floor(rnd(Math.floor(y / 160) + 5) * (w - 20));
        px(kx, sy, 6, 2, ((y % 160) + 160) % 160 < 2 ? BARK.light : BARK.dark);
      }
    }
    for (let i = 0; ; i++) {
      const by = -70 - i * 115 + Math.round(rnd(i) * 30);
      if (by < PLAT_Y + 50) break;
      if (by < top - 90 || by > bottom + 40) continue;
      const s = i % 3 === 2 ? (i % 2 ? 1 : -1) : (i % 2 ? -1 : 1);
      const len = 36 + Math.round(rnd(i + 3) * 36), ang = 0.4 + rnd(i + 5) * 0.25;
      const x0 = s * 18, y0 = SY(by);
      branch(SX(x0), y0, SX(x0 + s * Math.cos(ang) * len), y0 - Math.sin(ang) * len, i * 31 + 7);
    }
    const py = SY(PLAT_Y);
    if (py > -60 && py < H + 60) {
      branch(SX(-18), py + 4, SX(-62), py - 6, 901);
      branch(SX(18), py + 4, SX(62), py - 8, 903);
      px(SX(-48) - 1, py - 1, 97, 7, BARK.dark);
      px(SX(-48), py, 95, 5, BARK.body);
      px(SX(-48), py, 95, 1, BARK.light);
      px(SX(-48), py + 4, 95, 1, BARK.shadow);
      leafCluster(SX(-44), py - 3, 12, 911);
      leafCluster(SX(46), py - 3, 12, 913);
    }
  }

  // скала из гранёных блоков колоннами со сдвигом (как кладка камня): верх светлый, низ и правый край тёмные; трещины, мох внизу, снег местами наверху
  const CUTS = [-60, -27, -9, 8, 26, 60];
  function drawRock(top, bottom, m) {
    const space = clamp((m - 450) / 200, 0, 1);
    const snowK = clamp((m - 300) / 150, 0, 1);
    const tint = c => space ? mix(c, '#3f3658', space * 0.75) : c;
    for (let y = Math.floor(top / 2) * 2; y < Math.min(PLAT_Y + 6, bottom); y += 2) {
      const r = Math.floor(y / 2);
      const hw = 40 + Math.round(Math.sin(r * 0.13) * 5 + Math.sin(r * 0.41) * 2 + rnd(r) * 2);
      const sy = SY(y);
      px(SX(-hw) - 1, sy, hw * 2 + 2, 2, OUTLINE);
      for (let c = 0; c < CUTS.length - 1; c++) {
        const rowH = 26 + Math.floor(rnd(c * 3 + 1) * 16), ph = Math.floor(rnd(c + 7) * rowH);
        const row = Math.floor((y + ph) / rowH), inRow = (((y + ph) % rowH) + rowH) % rowH;
        const jit = Math.round(rnd(row * 5 + c) * 6 - 3);
        const x0 = Math.max(CUTS[c] + (c ? jit : 0), -hw), x1 = Math.min(CUTS[c + 1] + (c < CUTS.length - 2 ? Math.round(rnd(row * 5 + c + 1) * 6 - 3) : 0), hw);
        if (x1 <= x0) continue;
        const id = row * 31 + c * 7;
        const warm = rnd(id) > 0.7;
        let col = warm ? '#9a8a7a' : ROCK.body;
        if (inRow < 2) col = snowK > 0 && rnd(id + 3) < snowK * 0.45 ? '#f4f8ff' : (warm ? '#b8a690' : ROCK.light);
        else if (inRow >= rowH - 3) col = ROCK.deep;
        else if (inRow < 4 && m < 250 && rnd(id + 5) > 0.75) col = inRow === 2 ? '#9ac848' : '#5f9a3a';
        px(SX(x0), sy, x1 - x0, 2, tint(col));
        if (inRow >= 2 && inRow < rowH - 3) {
          px(SX(x1) - 2, sy, 2, 2, tint(ROCK.shadow));
          px(SX(x0), sy, 1, 2, tint(warm ? '#b8a690' : ROCK.light));
        }
        if (rnd(id + 9) > 0.8 && inRow > 6 && inRow < rowH - 8) {
          const cx = x0 + 4 + Math.floor(rnd(id + 11) * Math.max(1, x1 - x0 - 8)) + Math.round(Math.sin(inRow * 0.7) * 2);
          px(SX(cx), sy, 1, 2, tint(ROCK.crack));
          px(SX(cx) + 1, sy, 1, 1, tint(ROCK.light));
        }
      }
    }
  }
  // номер ряда по высоте (обратная к rowY) — перебираем только видимые зацепки
  const rowAt = y => y > PLAT_Y ? (-36 - y) / STEP : TREE_TOP + 1 + (PLAT_Y - 36 - y) / STEP;
  // скала статична: рисуем её полосами по 128 px в отдельные холсты и кэшируем (тон квантуем по 25 м)
  const STRIP = 128, strips = new Map();
  function drawRockCached(top, bottom, m) {
    const mq = Math.round(m / 25) * 25;
    for (let si = Math.floor(top / STRIP); si * STRIP < Math.min(bottom, PLAT_Y + 6); si++) {
      const key = `${si}:${mq}:${W}`;
      let c = strips.get(key);
      if (!c) {
        c = document.createElement('canvas');
        c.width = W; c.height = STRIP;
        const saved = [b, st.camY, camX];
        b = c.getContext('2d');
        st.camY = si * STRIP; camX = 0;
        drawRock(si * STRIP, si * STRIP + STRIP, mq);
        [b, st.camY, camX] = saved;
        strips.set(key, c);
        if (strips.size > 24) strips.delete(strips.keys().next().value);
      }
      b.drawImage(c, camX, SY(si * STRIP));
    }
  }

  function drawHolds(space) {
    const from = Math.max(-3, Math.floor(rowAt(st.camY + H + 20)) - 2), to = Math.ceil(rowAt(st.camY - 20)) + 2;
    for (let i = from; i <= to; i++) {
      if (i === TREE_TOP) continue;
      const h = hold(i);
      if (h.ground) continue;
      const sx = SX(h.x), sy = SY(h.y);
      if (sy < -10 || sy > H + 10) continue;
      if (i < TREE_TOP) {
        px(sx - 4, sy - 2, 9, 6, BARK.dark);
        px(sx - 3, sy - 1, 7, 4, BARK.body);
        px(sx - 3, sy - 1, 6, 1, BARK.light);
        px(sx - 3, sy + 2, 7, 1, BARK.shadow);
      } else {
        px(sx - 3, sy - 2, 7, 5, OUTLINE);
        px(sx - 2, sy - 1, 5, 3, mix('#c9b79c', '#9a8fbf', space));
        px(sx - 2, sy - 1, 3, 1, mix('#efe2c8', '#c9c2ea', space));
        px(sx - 2, sy + 1, 5, 1, mix('#8c7a62', '#5a5180', space));
      }
    }
    for (let j = from; j <= to; j++) {
      for (const s of [-1, 1]) {
        const f = foot(j, s);
        const sx = SX(f.x), sy = SY(f.y);
        // левая нога ходит по чётным рядам, правая по нечётным — рисуем только используемые выступы
        if (f.ground || (j % 2 === 0) !== (s < 0) || sy < -10 || sy > H + 10) continue;
        // выступ рядом с зацепкой не рисуем: нога встаёт на саму зацепку
        const hj = hold(j);
        if (Math.abs(hj.x - f.x) < 7 && Math.abs(hj.y - f.y) < 6) continue;
        px(sx - 2, sy - 1, 5, 3, j < TREE_TOP ? BARK.dark : OUTLINE);
        px(sx - 1, sy, 3, 1, j < TREE_TOP ? BARK.shadow : mix('#8f7f68', '#5a5180', space));
      }
    }
  }

  function drawGround() {
    const gy = SY(0);
    if (gy >= H + 4) return;
    px(0, gy, W, H, '#7a5232');
    px(0, gy + 6, W, H, '#4a2f1e');
    px(0, gy - 1, W, 1, OUTLINE);
    px(0, gy, W, 3, '#4fa83f');
    px(0, gy, W, 1, '#8fd45a');
    px(0, gy + 3, W, 1, '#2f7a3a');
    for (let x = 1; x < W; x += 5) {
      const r = rnd(x + 3);
      px(x, gy - 2, 1, 2, r > 0.5 ? '#8fd45a' : '#4fa83f');
      if (r > 0.9) { px(x, gy - 4, 1, 2, '#2f7a3a'); px(x - 1, gy - 5, 3, 1, r > 0.95 ? '#ffd84a' : '#ff8ca8'); }
      if (rnd(x + 9) > 0.85) px(x, gy + 8 + Math.floor(rnd(x) * 8), 2, 1, '#a8794a');
    }
  }

  function headPos() { return [SX(ch.hip.x), SY(ch.hip.y) - 31]; }

  // голубь 14×10: 3 положения крыла на 4 кадра, сидя — крылья сложены и клюёт
  function drawBird(bd) {
    const ufo = meters(ch.hip.y) >= SPACE_FROM;
    const x = Math.round(bd.x), y = Math.round(bd.y), f = bd.face;
    if (ufo) {
      const bob = Math.round(Math.sin(st.t * 4) * 1);
      px(x - 11, y - 2 + bob, 22, 5, OUTLINE);
      px(x - 10, y - 1 + bob, 20, 3, '#b8c4d6');
      px(x - 10, y + 1 + bob, 20, 1, '#7a869e');
      px(x - 5, y - 6 + bob, 10, 5, OUTLINE);
      px(x - 4, y - 5 + bob, 8, 4, '#8ff0e0');
      for (let i = 0; i < 4; i++) px(x - 8 + i * 5, y + bob, 2, 1, (Math.floor(st.t * 6) + i) % 2 ? '#ffd84a' : '#ff6a8a');
      return;
    }
    const sit = bd.state === 'sit';
    const frame = sit ? -1 : [0, 1, 2, 1][Math.floor(st.t * 10) % 4];
    const lift = frame === 2 ? -1 : frame === 0 ? 1 : 0;
    const yy = y + lift;
    const peck = sit && Math.floor(st.t * 1.4) % 3 === 0 ? 1 : 0;
    px(x - 5, yy - 3, 11, 7, OUTLINE);
    px(x + f * 4 - 2, yy - 6 + peck, 5, 5, OUTLINE);
    px(x - f * 6 - (f > 0 ? 1 : 0), yy - 1, 3, 3, OUTLINE);
    px(x - 4, yy - 2, 9, 5, '#8c93a6');
    px(x - 4, yy + 1, 9, 2, '#5b6177');
    px(x - 3, yy - 2, 6, 1, '#b8bfd1');
    px(x + f * 4 - 1, yy - 5 + peck, 3, 3, '#8c93a6');
    px(x + f * 4 - 1, yy - 2 + peck, 3, 1, f > 0 ? '#4fb7a0' : '#9a6ac0');
    px(x + f * 4 + (f > 0 ? 1 : -1), yy - 4 + peck, 1, 1, OUTLINE);
    px(x + f * 6 - (f < 0 ? 1 : 0), yy - 3 + peck, 2, 1, '#e0a040');
    px(x - f * 6 - (f > 0 ? 0 : 1), yy, 2, 1, '#5b6177');
    if (sit) {
      px(x - 3, yy - 1, 6, 2, '#5b6177');
      px(x - 2, yy + 3, 1, 2, '#e0a040'); px(x + 1, yy + 3, 1, 2, '#e0a040');
    } else if (frame === 0) {
      px(x - 2, yy - 8, 2, 6, OUTLINE); px(x - 1, yy - 7, 1, 5, '#b8bfd1');
      px(x + 1, yy - 7, 2, 5, OUTLINE);
    } else if (frame === 1) {
      px(x - 5, yy - 2, 8, 2, OUTLINE); px(x - 4, yy - 2, 6, 1, '#b8bfd1');
    } else {
      px(x - 2, yy + 2, 2, 5, OUTLINE); px(x - 1, yy + 2, 1, 4, '#5b6177');
    }
  }

  function spawnParts(kind, x, y, n) {
    for (let i = 0; i < n; i++) {
      const p = { kind, x, y, vx: (Math.random() - 0.5) * 60, vy: -Math.random() * 40 - 10, life: 0.4 + Math.random() * 0.2, max: 0.6 };
      if (kind === 'crumb') p.col = Math.random() > 0.5 ? BARK.body : BARK.light;
      if (kind === 'dust') { p.col = Math.random() > 0.3 ? '#9aa3b5' : '#dfe4ee'; p.vy = -Math.random() * 30; }
      if (kind === 'leaf') { p.col = [LEAF.body, LEAF.light, LEAF.shadow][i % 3]; p.life = 1.2; p.vy = -20; }
      if (kind === 'feather') { p.col = '#dfe4ee'; p.life = 0.9; p.vy = -Math.random() * 30; }
      if (kind === 'star') { const a = i / n * Math.PI * 2; p.vx = Math.cos(a) * 50; p.vy = Math.sin(a) * 50; p.life = 0.3; p.col = '#ffd84a'; }
      st.parts.push(p);
    }
    if (st.parts.length > 120) st.parts.splice(0, st.parts.length - 120);
  }

  function updateParts(dt) {
    for (const p of st.parts) {
      p.life -= dt;
      if (p.kind === 'leaf' || p.kind === 'feather') { p.vy = Math.min(p.vy + 60 * dt, 30); p.x += Math.sin(p.life * 10) * 0.4; }
      else if (p.kind !== 'star' && p.kind !== 'dust') p.vy += 300 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    st.parts = st.parts.filter(p => p.life > 0);
  }

  function drawParts() {
    for (const p of st.parts) {
      const x = Math.round(p.x), y = Math.round(p.y);
      if (p.kind === 'star') { const c = Math.floor(p.life * 20) % 2 ? '#ffffff' : p.col; px(x, y - 1, 1, 3, c); px(x - 1, y, 3, 1, c); }
      else if (p.kind === 'feather') px(x, y, 1, 3, p.col);
      else if (p.kind === 'leaf') px(x, y, 2, 2, p.col);
      else px(x, y, p.life > 0.3 ? 2 : 1, p.life > 0.3 ? 2 : 1, p.col);
    }
  }

  function updateBirds(dt) {
    const m = ch.k;
    if (st.mode === 'climb' && m >= BIRDS_FROM && st.birds.length < 1) {
      const rate = Math.min(0.45, 0.07 + (m - BIRDS_FROM) * 0.0008);
      if (Math.random() < rate * dt) {
        const from = Math.random() < 0.5 ? -1 : 1;
        st.birds.push({ state: 'fly', t: 0, face: -from, sx: from > 0 ? W + 12 : -12, sy: H * 0.2, x: 0, y: 0 });
      }
    }
    const [hx, hy] = headPos();
    for (const bd of st.birds) {
      bd.t += dt;
      if (bd.state === 'fly') {
        // подлёт с торможением к голове
        const k = Math.min(1, bd.t / 1.0), e = 1 - Math.pow(1 - k, 3);
        bd.x = bd.sx + (hx - bd.sx) * e;
        bd.y = bd.sy + (hy - 4 - bd.sy) * e - Math.sin(k * Math.PI) * 10;
        if (k >= 1) { bd.state = 'sit'; haptic('soft'); Sound.play('birdIn'); }
      } else if (bd.state === 'sit') {
        bd.x = hx; bd.y = hy - 4;
      } else {
        bd.x += bd.vx * dt;
        bd.vy -= 140 * dt;
        bd.y += bd.vy * dt;
      }
    }
    st.birds = st.birds.filter(bd => bd.state !== 'leave' || bd.t < 1.4);
  }

  function shoo(bd) {
    bd.state = 'leave';
    bd.t = 0;
    bd.vx = (bd.x < W / 2 ? -1 : 1) * 90;
    bd.vy = 20;
    bd.face = bd.vx > 0 ? 1 : -1;
    spawnParts('feather', bd.x, bd.y, 4);
    haptic('light');
    Sound.play('birdOut');
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
      st.shake = 0.18;
      haptic('heavy');
      Sound.play('miss');
      return;
    }
    ch.climbUp(stepDur());
    st.stamina = Math.min(100, st.stamina + Math.max(4, 8 - ch.k * 0.004));
    haptic('light');
    Sound.play('step');
    const h = hold(ch.k), s0 = st;
    setTimeout(() => {
      if (st !== s0 || st.mode !== 'climb') return;
      Sound.play('grab');
      const tree = ch.k <= TREE_TOP;
      spawnParts(tree ? 'crumb' : 'dust', SX(h.x), SY(h.y), tree ? 4 : 3);
      if (tree && Math.random() < 0.3) spawnParts('leaf', SX(h.x), SY(h.y) - 4, 2);
    }, stepDur() * 900);
  }

  function onStepDone() {
    const k = ch.k;
    for (const [m, text] of MILESTONES) if (k === m && st.reached < m) { flash(text); Sound.play('jingle'); }
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
    Sound.playMusic();
  }

  function endDance() {
    Sound.stopMusic();
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
    Sound.play('miss');
    Sound.fallStart();
  }

  function over() {
    st.mode = 'over';
    Sound.fallStop();
    const m = st.reached;
    const record = m > best;
    if (record) { best = m; store.set('best', best); if (m > 0) Sound.play('jingle'); }
    $('gFallT').textContent = `Сорвался с ${m} м`;
    $('gFallR').textContent = FALL_ROASTS[Math.floor(Math.random() * FALL_ROASTS.length)];
    $('gFallB').textContent = record && m > 0 ? 'Новый рекорд!' : `Рекорд: ${best} м`;
    $('gFall').classList.remove('hidden');
    updateHud();
  }

  function onTap(e) {
    Sound.unlock();
    if (!st || st.mode !== 'climb') return;
    e.preventDefault();
    const r = cv.getBoundingClientRect();
    const bx = (e.clientX - r.left) / r.width * W, by = (e.clientY - r.top) / r.height * H;
    const hit = st.birds.find(bd => bd.state !== 'leave' && Math.hypot(bd.x - bx, bd.y - by) < 14);
    if (hit) return shoo(hit);
    if (st.birds.some(bd => bd.state === 'sit')) {
      st.bonk = 0.3;
      st.stamina -= 4;
      haptic('medium');
      Sound.play('bonk');
      const [hx, hy] = headPos();
      spawnParts('star', hx, hy - 6, 5);
      return;
    }
    const tapSide = bx < W / 2 ? -1 : 1;
    // во время перехвата тап не теряется: запоминаем один следующий
    if (ch.mode === 'climb') { st.queue = tapSide; return; }
    tryClimb(tapSide);
  }

  function level() {
    const m = meters(ch.hip.y);
    if (st.mode === 'ready') return [null, m];
    return [m >= SPACE_FROM ? 'space' : st.afterTree ? 'mountain' : 'tree', m];
  }

  function update(dt) {
    st.t += dt;
    st.shake = Math.max(0, st.shake - dt);
    st.bonk = Math.max(0, st.bonk - dt);
    camX = st.shake ? Math.round((Math.random() * 2 - 1) * 2 * st.shake / 0.18) : 0;
    const wasLanded = ch.landed;
    ch.update(dt);
    if (ch.landed && !wasLanded) { Sound.fallStop(); Sound.play('land'); }
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
    st.levelT -= dt;
    if (st.levelT <= 0) { st.levelT = 0.5; Sound.setLevel(...level()); }
    updateBirds(dt);
    updateParts(dt);
    const target = st.mode === 'fall' ? st.camY + (ch.hip.y - H * 0.5 - st.camY) * 0.35 : Math.min(ch.hip.y - H * 0.6, -H * 0.85);
    st.camY += (target - st.camY) * Math.min(1, dt * 6);
  }

  function draw() {
    const m = meters(st.camY + H / 2);
    const [, skyBottom] = skyAt(m);
    drawSky(m);
    drawSpace(m);
    drawFar(m, skyBottom);
    drawClouds(false, skyBottom);
    const top = st.camY - 4, bottom = st.camY + H + 4;
    const space = clamp((m - 450) / 200, 0, 1);
    if (top < PLAT_Y + 6) drawRockCached(top, bottom, m);
    if (bottom > PLAT_Y - 120) drawTree(top, bottom);
    drawGround();
    drawHolds(space);
    ch.draw(b, -W / 2 - camX, st.camY);
    for (const bd of st.birds) drawBird(bd);
    drawParts();
    drawClouds(true, skyBottom);
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
    Sound.unlock();
    Sound.play('click');
    reset();
    $('gStart').classList.add('hidden');
    $('gFall').classList.add('hidden');
    haptic('light');
  }

  function muteIcon() { $('gMute').textContent = Sound.muted ? '🔇' : '🔊'; }

  function init() {
    cv = $('gCanvas');
    g = cv.getContext('2d');
    buf = document.createElement('canvas');
    b = buf.getContext('2d');
    cv.addEventListener('pointerdown', onTap);
    $('gGo').addEventListener('click', start);
    $('gAgain').addEventListener('click', start);
    $('gMute').addEventListener('click', () => { Sound.unlock(); Sound.setMuted(!Sound.muted); muteIcon(); });
    muteIcon();
    addEventListener('resize', () => { if (raf) resize(); });
    store.get('best').then(v => { best = parseInt(v, 10) || 0; if (st) updateHud(); });
  }

  return {
    open() {
      if (!cv) init();
      Sound.unlock();
      resize();
      if (!st) { reset(); st.mode = 'ready'; }
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
    },
    close() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      Sound.fallStop();
      if (st && st.mode === 'dance') endDance();
      Sound.pause();
    },
  };
})();
