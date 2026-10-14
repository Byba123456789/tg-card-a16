(() => {
  const COL = { ...Char.PAL, N: '#3a2418', g: '#5a3a22', O: '#d9822b', o: '#a85a1c', Y: '#f2b25a' };
  const OUTLINE = COL.k;
  const HEAD_D = [
    '...hhhhhh...',
    '.hhhHHHHhhh.',
    'hhHHHHHHHHHh',
    'HHHdHHHHdHHH',
    'HdHHHdHHHHdH',
    'HHSdHHHdHdSH',
    'HSSSSdSSSSSH',
    'HSwESSSSwESH',
    'HSwESSSSwESH',
    '.SrSSSSSSrS.',
    '..SSSmmSSS..',
    '...SSSSSS...',
  ];
  const HEAD_U = [
    '...hhhhhh...',
    '.hhhhhhhhhh.',
    'hhhhHhhHhhhh',
    'hHHhHHhHHhHh',
    'HHHHHHHHHHHH',
    'HHdHHHHHHdHH',
    'HHdHHdHdHHdH',
    'HdHHHdHdHHdH',
    'SdHHHdHdHHHS',
    'SHHdHHHHdHHS',
    '.dHHHdHdHHd.',
    '..dHdHHdHd..',
  ];
  const HEAD_S = [
    '...hhhhhh...',
    '..hhHHHHhhh.',
    '.hHHHHHHHHHh',
    'hHHHHHHHHHHH',
    'HHHdHHHHHdHH',
    'HHdHHHHSdHSH',
    'HHHdHHSSSSSS',
    'HHdHHSSSSwES',
    'HHHHHSSSSwES',
    '.HdHSSSSrSSS',
    '..HdSSSSSmS.',
    '...SSSSSSS..',
  ];
  const BODY_D = [
    '.jjJWWJJq.',
    'jjJJBBJJJq',
    'jjJJWWJJJq',
    'jjJJWxJJJq',
    'jjJJWWJJJq',
    'qqJJxWJJqq',
    '.qqqWWqqq.',
  ];
  const BODY_U = [
    '.jjJJJJJq.',
    'jjJJJJJJJq',
    'jjJJJJJJJq',
    'jjJJJqJJJq',
    'jjJJJqJJJq',
    'qqJJJqJJqq',
    '.qqqq.qqq.',
  ];
  const BODY_S = [
    '.jJJJJq.',
    'jJJJJWWq',
    'jJJJJBWq',
    'jJJJJWWq',
    'jJJJJJWq',
    'qJJJJJqq',
    '.qqqqqq.',
  ];
  const GUITAR = [
    '...kkk...',
    '..kNNNk..',
    '..kNNNk..',
    '...kgk...',
    '...kgk...',
    '...kgk...',
    '...kgk...',
    '...kgk...',
    '...kgk...',
    '..kkgkk..',
    '.kOOgOok.',
    'kYOOgOOok',
    'kYOOgOOok',
    '.kOOgOok.',
    '..kOgOk..',
    '.kOOkOOk.',
    'kYOkkkOok',
    'kYOOkOOok',
    'kOOOgOOok',
    'koOOgOOok',
    '.koooook.',
    '..kkkkk..',
  ];
  // моргание: глаза закрыты
  const blinkD = HEAD_D.map((r, i) => i === 7 ? 'HSSSSSSSSSSH' : i === 8 ? 'HSssSSSSssSH' : r);
  const blinkS = HEAD_S.map((r, i) => i === 7 ? r.replace('wE', 'SS') : i === 8 ? r.replace('wE', 'ss') : r);

  function sprite(rows) {
    const c = document.createElement('canvas');
    c.width = rows[0].length;
    c.height = rows.length;
    const x = c.getContext('2d');
    rows.forEach((row, y) => [...row].forEach((ch, i) => {
      if (ch === '.') return;
      x.fillStyle = COL[ch];
      x.fillRect(i, y, 1, 1);
    }));
    return c;
  }
  const SPR = {
    headD: sprite(HEAD_D), headDb: sprite(blinkD), headU: sprite(HEAD_U), headS: sprite(HEAD_S), headSb: sprite(blinkS),
    bodyD: sprite(BODY_D), bodyU: sprite(BODY_U), bodyS: sprite(BODY_S), guitar: sprite(GUITAR),
  };

  // комната: пол FW×FH, задняя стена высотой WH, толщина стен WT; координаты — от левого верхнего угла пола
  const FW = 224, FH = 124, WH = 36, WT = 5;
  const WIN_X = 86, WIN_W = 52;
  const SOLIDS = [
    [0, 0, 30, 64], [33, 21, 16, 18], [FW - 14, 0, 14, 46], [FW - 25, 46, 9, 6],
    [FW - 50, FH - 66, 50, 66], [WIN_X - 5, 0, WIN_W + 10, 3], [FW - 36, 56, 12, 5],
  ];
  const SPEED = 52;

  const cv = document.getElementById('cv'), g = cv.getContext('2d');
  const buf = document.createElement('canvas'), b = buf.getContext('2d');
  const CW = 18, CH = 28, FX = 9, FY = 26;
  const cc = document.createElement('canvas'), cx = cc.getContext('2d');
  const sil = document.createElement('canvas'), sx = sil.getContext('2d');
  cc.width = sil.width = CW;
  cc.height = sil.height = CH;
  let W = 0, H = 0, scale = 2, ox = 0, oy = 0, last = 0, moved = false;
  const pl = { x: 120, y: 84, dir: 'down', face: 1, moving: false, walkT: 0, t: 0, blinkT: 2, blink: 0 };
  const keys = new Set();
  let joy = null;

  const R = (x, y, w, h, col) => { b.fillStyle = col; b.fillRect(ox + x, oy + y, w, h); };
  // предмет в 3/4: следом (x, y, w, d) на полу, высотой h; lift — стоит на чём-то высотой lift
  function box(x, y, w, d, h, top, front, lift = 0) {
    const t = y - h - lift;
    R(x - 1, t - 1, w + 2, d + h + 2, OUTLINE);
    R(x, t, w, d, top);
    R(x, t + d, w, h, front);
  }

  function resize() {
    const w = innerWidth, h = innerHeight;
    scale = Math.max(2, Math.floor(Math.min(w / 240, h / 175)));
    W = Math.ceil(w / scale);
    H = Math.ceil(h / scale);
    buf.width = W; buf.height = H;
    cv.width = W * scale; cv.height = H * scale;
    g.imageSmoothingEnabled = false;
    ox = Math.floor((W - FW) / 2);
    oy = Math.floor((H - (FH + WH + WT * 2)) / 2) + WH + WT;
  }

  function drawFloor() {
    for (let row = 0; row * 6 < FH; row++) {
      const y = row * 6;
      R(0, y, FW, 6, row % 2 ? '#7f5233' : '#875838');
      R(0, y, FW, 1, '#9a6a44');
      R(0, y + 5, FW, 1, '#5e3a22');
      for (let x = (row * 23) % 44; x < FW; x += 44) R(x, y + 1, 1, 4, '#5e3a22');
      for (let x = (row * 31 + 9) % 29; x < FW; x += 29) R(x, y + 2 + row % 2, 3, 1, '#784c2f');
    }
    // солнечное пятно от окна
    b.globalAlpha = 0.13;
    for (let y = 3; y < 74; y++) R(WIN_X - 4 + Math.round(y * 0.45), y, WIN_W + 8, 1, '#fff3cc');
    b.globalAlpha = 1;
  }

  function drawBackWall() {
    R(-WT - 1, -WH - WT - 1, FW + WT * 2 + 2, WT + 1, OUTLINE);
    R(-WT, -WH - WT, FW + WT * 2, WT, '#d3ccbf');
    R(0, -WH, FW, WH, '#f4f2ed');
    R(0, -14, FW, 11, '#ece8e0');
    R(0, -3, FW, 3, '#d4cdbf');
    R(0, -3, FW, 1, '#e6e0d4');
    const top = -WH + 5, hh = WH - 12;
    R(WIN_X - 1, top - 1, WIN_W + 2, hh + 2, '#b9b2a5');
    R(WIN_X, top, WIN_W, hh, '#ffffff');
    R(WIN_X + 2, top + 2, WIN_W - 4, hh - 4, '#a7d6f2');
    R(WIN_X + 2, top + 2, WIN_W - 4, 6, '#c9e7f8');
    // октябрь за окном: верхушки деревьев
    for (let i = 0; i < 9; i++) {
      const x = WIN_X + 3 + i * 5 + (i % 2), y = top + hh - 7 + (i * 7) % 3;
      R(x, y, 5, hh - 4 - (y - top) + 2, ['#e0a030', '#c8642a', '#7a9a3a'][i % 3]);
      R(x + 1, y, 2, 1, '#f2c45a');
    }
    R(WIN_X + 2, top + hh - 3, WIN_W - 4, 1, '#8aa8b8');
    R(WIN_X + WIN_W / 2 - 1, top + 2, 2, hh - 4, '#ffffff');
    R(WIN_X + 2, top + 8, WIN_W - 4, 1, '#ffffff');
    for (let i = 0; i < 5; i++) R(WIN_X + 6 + i, top + 13 - i, 1, 1, '#e8f6ff');
    R(WIN_X - 6, -5, WIN_W + 12, 6, OUTLINE);
    R(WIN_X - 5, -4, WIN_W + 10, 3, '#fbfaf6');
    R(WIN_X - 5, -1, WIN_W + 10, 2, '#d9d3c7');
  }

  function drawWallCaps() {
    R(-WT - 1, -WH - WT, 1, WH + FH + WT * 2 + 1, OUTLINE);
    R(FW + WT, -WH - WT, 1, WH + FH + WT * 2 + 1, OUTLINE);
    R(-WT, -WH, WT, WH + FH + WT, '#d3ccbf');
    R(FW, -WH, WT, WH + FH + WT, '#d3ccbf');
    R(-1, -WH, 1, WH + FH, '#b9b2a5');
    R(FW, -WH, 1, WH + FH, '#b9b2a5');
    R(-WT, FH, FW + WT * 2, WT, '#d3ccbf');
    R(-WT - 1, FH + WT, FW + WT * 2 + 2, 1, OUTLINE);
    R(-WT, FH, FW + WT * 2, 1, '#b9b2a5');
    // проём двери
    R(13, FH, 26, WT, '#4a3222');
    R(13, FH, 26, 1, '#2e1e14');
  }

  function drawDesk() {
    box(0, 4, 28, 58, 11, '#b07a4a', '#865632');
    R(0, -7, 28, 1, '#c9915c');
    b.globalAlpha = 0.35;
    R(7, 1, 4, 24, '#7fd0ff');
    b.globalAlpha = 1;
    box(3, 12, 3, 24, 13, '#2a2a33', '#1c1c22', 11);
    R(3, -11, 3, 1, '#4a4a58');
    R(6, -12, 1, 24, '#7fd0ff');
    box(13, 18, 6, 17, 1, '#3a3a44', '#26262e', 11);
    for (let y = 0; y < 15; y += 3) R(14, 7 + y, 4, 1, '#55556a');
    R(15, 30, 3, 4, '#3a3a44');
    box(4, 46, 12, 11, 14, '#1f1f26', '#16161b', 11);
    R(5, 35, 10, 1, '#b05cff');
    R(5, 37, 10, 1, '#4ad9ff');
  }

  function drawChair() {
    box(34, 23, 12, 13, 8, '#26262e', '#1a1a20');
    R(36, 17, 8, 1, '#3a3a46');
    box(45, 20, 4, 18, 22, '#2e2e38', '#1d1d24');
    R(46, -1, 2, 14, '#c0392b');
  }

  function drawShelf() {
    box(FW - 14, 2, 14, 43, 30, '#7a5232', '#5e3d24');
    const t = 2 - 30;
    [['#c0392b', 3], ['#2f5fb0', 2], ['#e0a030', 3], ['#2e8a57', 2], ['#7a3fa0', 3]].forEach(([c, h], i) => {
      R(FW - 12, t + 3 + i * 5, 10, h, c);
      R(FW - 12, t + 3 + i * 5, 10, 1, '#ffffff33');
    });
    R(FW - 11, t + 31, 8, 7, '#3a7a3a');
    R(FW - 9, t + 30, 4, 2, '#5fae4a');
  }

  function drawDumbbell() {
    const x = FW - 36, y = 56;
    R(x + 2, y + 1, 8, 2, '#5a5a66');
    for (const dx of [0, 9]) { R(x + dx - 1, y - 2, 5, 8, OUTLINE); R(x + dx, y - 1, 3, 6, '#2a2a33'); R(x + dx, y - 1, 3, 1, '#4a4a58'); }
  }

  function drawMattress() {
    const x = FW - 50, y = FH - 66, w = 50, d = 66, h = 5, t = y - h;
    box(x, y, w, d, h, '#f2efe8', '#cfc9bd');
    R(x + 4, t + 3, w - 8, 11, OUTLINE);
    R(x + 5, t + 4, w - 10, 9, '#ffffff');
    R(x + 5, t + 11, w - 10, 2, '#dcd8ce');
    R(x, t + 24, w, d - 24, '#5a6f9a');
    R(x, t + 24, w, 2, '#7088b8');
    for (let i = 0; i < 4; i++) R(x + 8 + i * 10, t + 30 + (i % 2) * 6, 1, 18, '#4a5d86');
    R(x, y + d - h, w, h, '#4a5d86');
    R(x + w - 18, t + 16, 4, 6, OUTLINE);
    R(x + w - 17, t + 17, 2, 4, '#7fd0ff');
  }

  // у двери коврик, сама дверь — проём в передней стене
  function drawDoormat() {
    R(13, FH - 11, 26, 9, OUTLINE);
    R(14, FH - 10, 24, 7, '#6a6f7a');
    for (let x = 16; x < 37; x += 3) R(x, FH - 9, 1, 5, '#575c66');
  }

  function drawGuitar() {
    const x = FW - 25, y = 52;
    b.drawImage(SPR.guitar, ox + x, oy + y - GUITAR.length);
  }

  // персонаж собирается в маленький холст, обводка — силуэтом по 4 сторонам
  function renderChar() {
    cx.clearRect(0, 0, CW, CH);
    const side = pl.dir === 'side', up = pl.dir === 'up';
    const f = pl.moving ? Math.floor(pl.walkT / 0.115) % 4 : 0;
    const bob = pl.moving ? (f % 2 ? -1 : 0) : (Math.floor(pl.t / 0.55) % 2);
    const by = FY - 10 + bob;
    const leg = (x, lift, dark) => {
      cx.fillStyle = dark ? COL.L : COL.P;
      cx.fillRect(x, FY - 4, 3, 3 - lift);
      cx.fillStyle = COL.p;
      if (!dark) cx.fillRect(x, FY - 4, 1, 3 - lift);
      cx.fillStyle = COL.B;
      cx.fillRect(x, FY - 1 - lift, side ? 4 : 3, 1);
    };
    const arm = (x, y) => {
      cx.fillStyle = COL.J;
      cx.fillRect(x, y, 2, 4);
      cx.fillStyle = COL.q;
      cx.fillRect(x, y + 3, 2, 1);
      cx.fillStyle = COL.S;
      cx.fillRect(x, y + 4, 2, 2);
    };
    if (side) {
      const s = f === 1 ? 1 : f === 3 ? -1 : 0;
      leg(FX - 2 - s, f === 3 ? 1 : 0, true);
      leg(FX - 2 + s, f === 1 ? 1 : 0, false);
      cx.drawImage(SPR.bodyS, FX - 4, by);
      cx.drawImage(pl.blink ? SPR.headSb : SPR.headS, FX - 6, by - 11);
      arm(FX - 1 + s, by + 1);
    } else {
      leg(FX - 4, f === 1 ? 1 : 0, false);
      leg(FX + 1, f === 3 ? 1 : 0, false);
      const sw = f === 1 ? 1 : f === 3 ? -1 : 0;
      arm(FX - 7, by + 1 - sw);
      arm(FX + 5, by + 1 + sw);
      cx.drawImage(up ? SPR.bodyU : SPR.bodyD, FX - 5, by);
      cx.drawImage(up ? SPR.headU : pl.blink ? SPR.headDb : SPR.headD, FX - 6, by - 11);
    }
    sx.clearRect(0, 0, CW, CH);
    sx.globalCompositeOperation = 'source-over';
    sx.drawImage(cc, 0, 0);
    sx.globalCompositeOperation = 'source-in';
    sx.fillStyle = OUTLINE;
    sx.fillRect(0, 0, CW, CH);
  }

  function drawPlayer() {
    b.globalAlpha = 0.3;
    R(pl.x - 4, pl.y - 1, 8, 1, '#000');
    R(pl.x - 5, pl.y, 10, 1, '#000');
    R(pl.x - 4, pl.y + 1, 8, 1, '#000');
    b.globalAlpha = 1;
    renderChar();
    const px = ox + Math.round(pl.x) - FX, py = oy + Math.round(pl.y) - FY;
    const flip = pl.dir === 'side' && pl.face < 0;
    b.save();
    if (flip) { b.translate(px * 2 + CW, 0); b.scale(-1, 1); }
    for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) b.drawImage(sil, px + ax, py + ay);
    b.drawImage(cc, px, py);
    b.restore();
  }

  function drawJoy() {
    if (!joy) return;
    b.globalAlpha = 0.25;
    disc(joy.sx, joy.sy, 16, '#ffffff');
    b.globalAlpha = 0.55;
    const [dx, dy] = joyVec(14);
    disc(joy.sx + dx, joy.sy + dy, 7, '#ffffff');
    b.globalAlpha = 1;
  }

  function disc(cx0, cy0, r, col) {
    b.fillStyle = col;
    for (let dy = -r; dy <= r; dy++) {
      const w = Math.floor(Math.sqrt(r * r - dy * dy));
      b.fillRect(Math.round(cx0 - w), Math.round(cy0 + dy), w * 2 + 1, 1);
    }
  }

  function joyVec(max) {
    let dx = joy.x - joy.sx, dy = joy.y - joy.sy;
    const d = Math.hypot(dx, dy);
    if (d > max) { dx *= max / d; dy *= max / d; }
    return [dx, dy];
  }

  const blocked = (x, y) => x < 5 || x > FW - 5 || y < 4 || y > FH - 1 ||
    SOLIDS.some(([sx0, sy0, w, d]) => x + 4 > sx0 && x - 4 < sx0 + w && y + 1 > sy0 && y - 3 < sy0 + d);

  function update(dt) {
    pl.t += dt;
    pl.blinkT -= dt;
    if (pl.blinkT <= 0) { pl.blink = 0.12; pl.blinkT = 2.5 + Math.random() * 1.5; }
    pl.blink = Math.max(0, pl.blink - dt);
    let vx = 0, vy = 0;
    if (joy) {
      const [dx, dy] = joyVec(14);
      vx = dx / 14; vy = dy / 14;
      if (Math.hypot(vx, vy) < 0.2) vx = vy = 0;
    } else {
      vx = (keys.has('ArrowRight') || keys.has('KeyD')) - (keys.has('ArrowLeft') || keys.has('KeyA'));
      vy = (keys.has('ArrowDown') || keys.has('KeyS')) - (keys.has('ArrowUp') || keys.has('KeyW'));
      const n = Math.hypot(vx, vy);
      if (n) { vx /= n; vy /= n; }
    }
    pl.moving = !!(vx || vy);
    if (!pl.moving) { pl.walkT = 0; return; }
    moved = true;
    pl.walkT += dt;
    if (Math.abs(vx) > Math.abs(vy) * 1.1) { pl.dir = 'side'; pl.face = vx > 0 ? 1 : -1; } else pl.dir = vy < 0 ? 'up' : 'down';
    const nx = pl.x + vx * SPEED * dt, ny = pl.y + vy * SPEED * dt;
    if (!blocked(nx, pl.y)) pl.x = nx;
    if (!blocked(pl.x, ny)) pl.y = ny;
  }

  function draw() {
    b.fillStyle = '#0d0b10';
    b.fillRect(0, 0, W, H);
    drawBackWall();
    drawFloor();
    drawDoormat();
    const items = [
      [62, drawDesk], [36, drawChair], [45, drawShelf], [52, drawGuitar], [61, drawDumbbell],
      [FH, drawMattress], [pl.y, drawPlayer],
    ].sort((a, z) => a[0] - z[0]);
    for (const [, fn] of items) fn();
    drawWallCaps();
    drawJoy();
    g.drawImage(buf, 0, 0, W * scale, H * scale);
    if (!moved) {
      g.fillStyle = 'rgba(255,255,255,.85)';
      g.font = `800 ${7 * scale}px system-ui, sans-serif`;
      g.textAlign = 'center';
      g.fillText('Веди пальцем слева, чтобы идти', W * scale / 2, (H - 8) * scale);
    }
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  const toBuf = e => [e.clientX / scale, e.clientY / scale];
  let full = false;
  function goFull() {
    if (full) return;
    full = true;
    const tg = window.Telegram && Telegram.WebApp;
    if (tg && tg.initData && tg.isVersionAtLeast('8.0')) { tg.requestFullscreen(); tg.lockOrientation(); return; }
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().then(() => screen.orientation.lock('landscape')).catch(() => {});
  }

  function init() {
    const tg = window.Telegram && Telegram.WebApp;
    if (tg && tg.initData) {
      tg.ready();
      tg.expand();
      if (tg.isVersionAtLeast('7.7')) tg.disableVerticalSwipes();
    }
    resize();
    addEventListener('resize', resize);
    cv.addEventListener('pointerdown', e => {
      if (e.pointerType === 'touch') goFull();
      const [x, y] = toBuf(e);
      if (x < W * 0.55 && !joy) { joy = { id: e.pointerId, sx: x, sy: y, x, y }; cv.setPointerCapture(e.pointerId); }
    });
    cv.addEventListener('pointermove', e => { if (joy && e.pointerId === joy.id) [joy.x, joy.y] = toBuf(e); });
    const end = e => { if (joy && e.pointerId === joy.id) joy = null; };
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);
    addEventListener('keydown', e => keys.add(e.code));
    addEventListener('keyup', e => keys.delete(e.code));
    requestAnimationFrame(loop);
  }

  init();
})();
