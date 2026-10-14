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
    [0, 0, 30, 64], [33, 21, 16, 18], [FW - 14, 0, 14, 46],
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
    if (st.hasGuitar) return;
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

  const BOX = [100, 62, 14, 10];
  const GUITAR_AT = [FW - 21, 52];
  const solids = () => [...SOLIDS, ...(st.hasGuitar ? [] : [[FW - 25, 46, 9, 6]]), ...(st.box ? [BOX] : [])];
  const blocked = (x, y) => x < 5 || x > FW - 5 || y < 4 || y > FH - 1 ||
    solids().some(([sx0, sy0, w, d]) => x + 4 > sx0 && x - 4 < sx0 + w && y + 1 > sy0 && y - 3 < sy0 + d);

  const st = {
    mode: 'title', t: 0, fade: 0, dateA: 0, task: '', marker: null, icon: null, lock: false,
    hasGuitar: false, box: true, swing: 0, hit: false, stop: 0, shake: 0, parts: [], phone: null,
    wake: { lids: 0, blur: 1, rot: 0, hand: 0, lift: 0, buzz: false },
  };
  let dlg = null, tapWait = null;

  // фоновые задачи сценария: ожидание, плавная смена значения, ожидание условия
  const jobs = [];
  const ease = k => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  const wait = s => new Promise(r => jobs.push({ t: s, r }));
  const until = check => new Promise(r => jobs.push({ check, r }));
  const tap = () => new Promise(r => { tapWait = r; });
  function tween(obj, key, to, dur) {
    const from = obj[key];
    return new Promise(r => jobs.push({ t: dur, dur, f: k => { obj[key] = from + (to - from) * ease(k); }, r }));
  }
  function runJobs(dt) {
    for (const j of [...jobs]) {
      let done;
      if (j.check) done = j.check();
      else {
        j.t -= dt;
        if (j.f) j.f(Math.min(1, 1 - j.t / j.dur));
        done = j.t <= 0;
      }
      if (done) { jobs.splice(jobs.indexOf(j), 1); j.r(); }
    }
  }
  const say = (emo, text, who = 'Артемий') => new Promise(r => { dlg = { emo, text, who, shown: 0, r }; });

  function vib() {
    const tg = window.Telegram && Telegram.WebApp;
    if (tg && tg.initData) tg.HapticFeedback.impactOccurred('medium');
    else if (navigator.vibrate) navigator.vibrate(60);
  }

  // телефон: чат или звонок; экран рисуется поверх в полном разрешении
  const PHW = 104;
  const PX = () => W - PHW - 8;
  const NOTE = [
    'С днюхой 🎂', 'Твои друзья у меня', 'Хочешь увидеть их живыми — найди сам', 'Так уж и быть, подсказки:',
    '— там, где вы обосрались, держа дверь', '— там, куда вы вечно катались', '— туда лезли все, кроме Андрея',
  ];
  const AVA = { 'Неизвестный': '#6c7883', 'Рома': '#e17055', 'Андрей': '#00b894', 'Антон': '#6c5ce7', 'Пацаны': '#0984e3' };
  const chat = (title, sub, msgs = []) => { st.phone = { kind: 'chat', title, sub, msgs, typing: false }; };
  async function incoming(text) {
    st.phone.typing = true;
    await wait(0.8);
    st.phone.typing = false;
    st.phone.msgs.push({ text, out: false });
    vib();
    await wait(0.6);
  }
  async function outgoing(text) {
    st.phone.msgs.push({ text, out: true });
    await wait(0.7);
  }
  async function call(name) {
    st.phone = { kind: 'call', title: name, sub: 'Вызов…' };
    await wait(1.4);
    st.phone.sub = 'Абонент недоступен';
    st.phone.fail = true;
    vib();
    await wait(1.1);
  }

  async function quest1() {
    await tap();
    st.mode = 'date';
    await tween(st, 'dateA', 1, 0.8);
    await wait(1.2);
    await tween(st, 'dateA', 0, 0.6);
    st.mode = 'wake';
    const w = st.wake;
    await tween(w, 'lids', 0.25, 1.2);
    await tween(w, 'lids', 0, 0.4);
    await tween(w, 'lids', 0.55, 1);
    await tween(w, 'lids', 0.1, 0.25);
    await Promise.all([tween(w, 'lids', 1, 0.9), tween(w, 'blur', 0.4, 1.5)]);
    w.buzz = true;
    vib();
    await wait(1.4);
    await tween(w, 'blur', 0, 0.6);
    await tween(w, 'rot', 1, 1.1);
    await wait(0.6);
    await tween(w, 'hand', 1, 1);
    w.buzz = false;
    await tween(w, 'lift', 1, 0.6);
    st.mode = 'phone';
    w.blur = 0.6;
    chat('Неизвестный', 'в сети');
    await incoming(NOTE[0]);
    await say('sleepy', 'Кто это блять…');
    for (const t of NOTE.slice(1)) await incoming(t);
    await wait(0.4);
    await say('shock', 'Че за хуйня');
    for (const n of ['Рома', 'Андрей', 'Антон']) await call(n);
    chat('Пацаны', '4 участника');
    for (const t of ['вы где', 'алооо', 'ау']) await outgoing(t);
    await wait(0.6);
    await say('angry', 'Вот же сука');
    await say('shock', 'Походу не наебали');
    chat('Неизвестный', 'был(а) только что', NOTE.map(text => ({ text, out: false })));
    await say('think', 'Так… подсказки');
    await say('smirk', 'А. Понял');
    await tween(st, 'fade', 1, 0.6);
    st.mode = 'room';
    st.phone = null;
    Object.assign(pl, { x: FW - 62, y: FH - 34, dir: 'side', face: -1 });
    await tween(st, 'fade', 0, 0.6);
    st.icon = { sym: '…', t: 1.4 };
    st.task = 'Возьми гитару';
    st.marker = [GUITAR_AT[0], GUITAR_AT[1] - 30];
    await until(() => st.hasGuitar);
    st.marker = null;
    st.icon = { sym: '!', t: 1 };
    await say('smirk', 'Ну, кто на меня');
    st.task = 'Ударь коробку';
    st.marker = [BOX[0] + 7, BOX[1] - 18];
    await until(() => !st.box);
    st.marker = null;
    st.task = '';
    await wait(0.6);
    st.task = 'Выйди из комнаты';
    st.marker = [26, FH - 22];
    await until(() => pl.y > FH - 6 && pl.x > 13 && pl.x < 39);
    st.task = '';
    st.marker = null;
    st.lock = true;
    await say('normal', 'Ладно, погнали');
    await tween(st, 'fade', 1, 0.8);
    st.mode = 'end';
    await tween(st, 'fade', 0, 0.6);
  }

  const nearGuitar = () => !st.hasGuitar && Math.hypot(pl.x - GUITAR_AT[0], pl.y - GUITAR_AT[1]) < 20;
  const BTN = { atk: () => [W - 32, H - 32, 17], act: () => [W - 30, H - 76, 12] };
  const DIRS = { down: Math.PI / 2, up: -Math.PI / 2 };
  const baseAngle = () => pl.dir === 'side' ? (pl.face > 0 ? 0 : Math.PI) : DIRS[pl.dir];

  function attack() {
    if (st.swing > 0) return;
    st.swing = 0.27;
    st.hit = false;
  }

  function update(dt) {
    st.t += dt;
    pl.t += dt;
    pl.blinkT -= dt;
    if (pl.blinkT <= 0) { pl.blink = 0.12; pl.blinkT = 2.5 + Math.random() * 1.5; }
    pl.blink = Math.max(0, pl.blink - dt);
    if (st.stop > 0) { st.stop -= dt; return; }
    runJobs(dt);
    if (dlg) dlg.shown = Math.min(dlg.text.length, dlg.shown + dt * 30);
    if (st.icon && (st.icon.t -= dt) <= 0) st.icon = null;
    st.shake = Math.max(0, st.shake - dt);
    for (const p of st.parts) { p.life -= dt; p.vy += 220 * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    st.parts = st.parts.filter(p => p.life > 0);
    if (st.swing > 0) {
      st.swing -= dt;
      const a = baseAngle(), tx = pl.x + Math.cos(a) * 12, ty = pl.y - 6 + Math.sin(a) * 10;
      if (!st.hit && st.swing < 0.17 && st.box && Math.hypot(tx - (BOX[0] + 7), ty - (BOX[1] + 2)) < 16) {
        st.hit = true;
        st.box = false;
        st.stop = 0.08;
        st.shake = 0.2;
        vib();
        for (let i = 0; i < 14; i++) {
          st.parts.push({ x: BOX[0] + 7, y: BOX[1] - 2, vx: (Math.random() - 0.5) * 120, vy: -Math.random() * 90 - 20, life: 0.5 + Math.random() * 0.3, col: ['#d9b273', '#b88a4a', '#c9a35c'][i % 3] });
        }
      }
    }
    let vx = 0, vy = 0;
    if (st.mode === 'room' && !dlg && !st.lock) {
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

  // первое лицо: потолок, поворот на бок, рука тянется к телефону на полу
  const scA = document.createElement('canvas'), scB = document.createElement('canvas'), fp = document.createElement('canvas');
  const small = document.createElement('canvas');
  const F = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  function cdisc(c, x0, y0, r, col) {
    c.fillStyle = col;
    for (let dy = -r; dy <= r; dy++) {
      const w = Math.floor(Math.sqrt(r * r - dy * dy));
      c.fillRect(Math.round(x0 - w), Math.round(y0 + dy), w * 2 + 1, 1);
    }
  }

  function drawCeiling(c) {
    F(c, 0, 0, W, H, '#e6e1d7');
    for (let i = 0; i < 6; i++) F(c, 0, 24 + i * 28, W, 28, ['#ece8df', '#e9e4db', '#e6e1d7', '#e2ddd2', '#ded8cc', '#d9d3c6'][i]);
    F(c, 0, 0, W, 22, '#f4f2ed');
    F(c, W * 0.36, 0, W * 0.28, 15, '#ffffff');
    F(c, W * 0.36 + 2, 0, W * 0.28 - 4, 13, '#a7d6f2');
    F(c, W / 2 - 1, 0, 2, 13, '#ffffff');
    F(c, 0, 22, W, 2, '#cfc8bb');
    const lx = W / 2, ly = H * 0.52;
    cdisc(c, lx, ly, 16, '#b9b2a5');
    cdisc(c, lx, ly, 15, '#ffffff');
    cdisc(c, lx, ly, 10, '#f3efe7');
    cdisc(c, lx - 4, ly - 4, 3, '#ffffff');
    F(c, W * 0.2, H * 0.4, 18, 1, '#d6d0c4');
    F(c, W * 0.2 + 18, H * 0.4 + 1, 9, 1, '#d6d0c4');
    for (let x = 0; x < W; x++) {
      const top = H - 20 + Math.round(Math.sin(x * 0.04) * 4 + Math.sin(x * 0.11) * 2);
      F(c, x, top - 1, 1, 1, OUTLINE);
      F(c, x, top, 1, H - top, x % 37 < 2 ? '#4a5d86' : '#5a6f9a');
      F(c, x, top, 1, 1, '#7088b8');
    }
  }

  function phonePos() {
    const w = st.wake, p0 = [W * 0.6, H * 0.74];
    return [p0[0] + (W / 2 - p0[0]) * w.lift, p0[1] + (H / 2 - p0[1]) * w.lift, 1 + w.lift * 2.5];
  }

  function drawSide(c) {
    const hz = Math.round(H * 0.42);
    F(c, 0, 0, W, hz, '#f2f0ea');
    F(c, 0, hz - 6, W, 6, '#d4cdbf');
    F(c, 0, hz - 6, W, 1, '#e6e0d4');
    F(c, W * 0.08, hz - 40, 4, 34, '#5e3d24');
    F(c, W * 0.08 + 30, hz - 40, 4, 34, '#5e3d24');
    F(c, W * 0.05, hz - 44, 46, 5, '#865632');
    let y = hz;
    for (let i = 0; y < H; i++) {
      const hgt = 2 + i * 1.6;
      F(c, 0, y, W, hgt, i % 2 ? '#7f5233' : '#875838');
      F(c, 0, y + hgt - 1, W, 1, '#5e3a22');
      for (let x = (i * 53) % 90; x < W; x += 90) F(c, x, y, 1, hgt, '#5e3a22');
      y += hgt;
    }
    for (let x = 0; x < W * 0.4; x++) {
      const top = H * 0.62 + x * 0.55;
      F(c, x, top - 1, 1, 1, OUTLINE);
      F(c, x, top, 1, H - top, '#f2efe8');
      F(c, x, top + 6, 1, H, '#cfc9bd');
    }
    const w = st.wake, [px, py, s] = phonePos();
    if (st.mode === 'phone') return;
    const jit = w.buzz ? Math.round(Math.sin(st.t * 60)) : 0;
    c.globalAlpha = 0.25;
    cdisc(c, px, py, 22 * s, '#7fd0ff');
    c.globalAlpha = 1;
    F(c, px - 15 * s - 1 + jit, py - 5 * s - 1, 30 * s + 2, 10 * s + 2, OUTLINE);
    F(c, px - 15 * s + jit, py - 5 * s, 30 * s, 10 * s, '#1c1c22');
    F(c, px - 13 * s + jit, py - 4 * s, 26 * s, 8 * s, '#7fd0ff');
    F(c, px - 11 * s + jit, py - 3 * s, 10 * s, 2 * s, '#ffffff');
    if (w.hand > 0) {
      const hx = W * 1.05 + (px + 6 - W * 1.05) * w.hand, hy = H * 1.15 + (py + 4 - H * 1.15) * w.hand;
      const along = (k, r, col) => cdisc(c, hx + (W + 30 - hx) * k, hy + (H + 40 - hy) * k, r, col);
      for (let k = 0; k <= 1; k += 0.04) along(k, 11, OUTLINE);
      for (let k = 0; k <= 1; k += 0.04) along(k, 10, k < 0.5 ? '#949eae' : '#858fa1');
      cdisc(c, hx + 6, hy + 6, 6, '#f6f4ef');
      cdisc(c, hx, hy, 8, OUTLINE);
      cdisc(c, hx, hy, 7, '#f0c4a2');
      for (let f = 0; f < 4; f++) F(c, hx - 9 + f * 3, hy - 9 + Math.abs(f - 1.5), 2, 6, '#f0c4a2');
      F(c, hx + 3, hy - 2, 4, 6, '#d6a083');
    }
  }

  function drawWake() {
    const w = st.wake;
    for (const c of [scA, scB, fp]) { c.width = W; c.height = H; }
    const a = scA.getContext('2d'), z = scB.getContext('2d'), f = fp.getContext('2d');
    if (w.rot < 1) drawCeiling(a);
    if (w.rot > 0) drawSide(z);
    f.fillStyle = '#000';
    f.fillRect(0, 0, W, H);
    if (w.rot < 1) {
      f.save();
      f.translate(W / 2, H / 2);
      f.rotate(-w.rot * Math.PI / 2);
      f.scale(1 + w.rot * 1.2, 1 + w.rot * 1.2);
      f.drawImage(scA, -W / 2, -H / 2);
      f.restore();
    }
    f.globalAlpha = w.rot;
    f.drawImage(scB, 0, 0);
    f.globalAlpha = 1;
    b.drawImage(fp, 0, 0);
    if (w.blur > 0) {
      small.width = Math.ceil(W / 6);
      small.height = Math.ceil(H / 6);
      const s = small.getContext('2d');
      s.imageSmoothingEnabled = true;
      s.drawImage(fp, 0, 0, small.width, small.height);
      b.imageSmoothingEnabled = true;
      b.globalAlpha = w.blur;
      b.drawImage(small, 0, 0, W, H);
      b.globalAlpha = 1;
      b.imageSmoothingEnabled = false;
    }
    // веки: края экрана закрываются раньше центра
    b.fillStyle = '#000';
    for (let x = 0; x < W; x++) {
      const k = (x - W / 2) / (W / 2);
      const lid = Math.ceil((1 - w.lids) * (H / 2 + 4) + H * 0.22 * k * k * (1 - w.lids * 0.7));
      b.fillRect(x, 0, 1, lid);
      b.fillRect(x, H - lid, 1, lid);
    }
  }

  function drawPhoneFrame() {
    const x = PX(), y = 6, h = H - 12;
    b.fillStyle = OUTLINE;
    b.fillRect(x + 2, y - 1, PHW - 4, h + 2);
    b.fillRect(x - 1, y + 2, PHW + 2, h - 4);
    b.fillStyle = '#26262e';
    b.fillRect(x + 2, y, PHW - 4, h);
    b.fillRect(x, y + 2, PHW, h - 4);
    b.fillStyle = '#3a3a46';
    b.fillRect(x + 1, y + 3, 1, h - 6);
  }

  function drawBox() {
    if (!st.box) return;
    const [x, y, w, d] = BOX;
    box(x, y, w, d, 11, '#d9b273', '#b88a4a');
    R(x + 6, y - 11, 2, d, '#c9a35c');
    R(x + 2, y + d - 8, 5, 3, '#f2efe8');
  }

  function drawCarried() {
    if (!st.hasGuitar || st.swing > 0) return;
    b.save();
    b.translate(ox + Math.round(pl.x) + 1, oy + Math.round(pl.y) - 9);
    b.rotate(pl.dir === 'side' ? -pl.face * 0.7 : 0.9);
    b.drawImage(SPR.guitar, -4, -11);
    b.restore();
  }

  function drawSwing() {
    if (st.swing <= 0) return;
    const k = 1 - st.swing / 0.27, base = baseAngle();
    const ang = q => base - 1.1 + 2.2 * (1 - (1 - q) * (1 - q));
    const pxp = ox + Math.round(pl.x), pyp = oy + Math.round(pl.y) - 9;
    b.fillStyle = '#ffffff';
    for (let i = 1; i <= 3; i++) {
      const a = ang(Math.max(0, k - i * 0.08));
      b.globalAlpha = 0.5 / i;
      for (let r = 10; r < 20; r += 2) b.fillRect(Math.round(pxp + Math.cos(a) * r), Math.round(pyp + Math.sin(a) * r), 2, 2);
    }
    b.globalAlpha = 1;
    b.save();
    b.translate(pxp, pyp);
    b.rotate(ang(k) - Math.PI / 2);
    b.drawImage(SPR.guitar, -4, -6);
    b.restore();
  }

  function drawPlayerAll() {
    const back = pl.dir === 'up';
    if (!back) drawCarried();
    if (back) drawSwing();
    drawPlayer();
    if (back) drawCarried();
    if (!back) drawSwing();
  }

  function drawMarker() {
    if (!st.marker || dlg) return;
    const [mx, my] = st.marker, y = my + Math.round(Math.sin(st.t * 5) * 2);
    R(mx - 4, y - 1, 9, 6, OUTLINE);
    R(mx - 3, y, 7, 2, '#ffd23f');
    R(mx - 2, y + 2, 5, 1, '#ffd23f');
    R(mx - 1, y + 3, 3, 1, '#ffd23f');
    R(mx - 3, y, 7, 1, '#fff2a8');
  }

  // мини-иконка над головой: «!», «…», «?»
  function drawIcon() {
    if (!st.icon) return;
    const x = Math.round(pl.x) - 5, y = Math.round(pl.y) - 41 + Math.round(Math.sin(st.t * 6));
    R(x - 1, y - 1, 13, 11, OUTLINE);
    R(x, y, 11, 9, '#ffffff');
    R(x + 4, y + 9, 3, 2, OUTLINE);
    R(x + 5, y + 9, 1, 1, '#ffffff');
    const s = st.icon.sym;
    if (s === '!') { R(x + 5, y + 2, 1, 4, OUTLINE); R(x + 5, y + 7, 1, 1, OUTLINE); }
    else if (s === '?') { R(x + 4, y + 2, 3, 1, OUTLINE); R(x + 7, y + 3, 1, 2, OUTLINE); R(x + 5, y + 5, 2, 1, OUTLINE); R(x + 5, y + 7, 1, 1, OUTLINE); }
    else for (let i = 0; i < 3; i++) R(x + 2 + i * 3, y + 5, 1, 1, OUTLINE);
  }

  function drawButtons() {
    if (dlg || st.lock) return;
    const btn = ([x, y, r], ring, on) => {
      disc(x, y, r + 1, OUTLINE);
      b.globalAlpha = on ? 0.95 : 0.6;
      disc(x, y, r, '#2c2a40');
      b.globalAlpha = 1;
      b.fillStyle = ring;
      for (let a = 0; a < 6.28; a += 0.08) b.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 1, 1);
    };
    if (st.hasGuitar) btn(BTN.atk(), '#ffd23f', st.swing <= 0);
    if (nearGuitar()) btn(BTN.act(), '#7bd389', true);
  }

  function drawRoom() {
    const sh = st.shake ? Math.round((Math.random() * 2 - 1) * 2) : 0;
    ox += sh;
    drawBackWall();
    drawFloor();
    drawDoormat();
    const items = [
      [62, drawDesk], [36, drawChair], [45, drawShelf], [52, drawGuitar], [61, drawDumbbell],
      [FH, drawMattress], [BOX[1] + BOX[3], drawBox], [pl.y, drawPlayerAll],
    ].sort((a, z) => a[0] - z[0]);
    for (const [, fn] of items) fn();
    for (const p of st.parts) R(p.x, p.y, 2, 2, p.col);
    drawWallCaps();
    drawMarker();
    drawIcon();
    ox -= sh;
    drawButtons();
    drawJoy();
  }

  function dlgRect() {
    const h = 56, x0 = 6;
    return { x0, y0: H - h - 6, w: (st.mode === 'phone' ? PX() - 8 : W - 6) - x0, h };
  }

  function drawDialogBox() {
    if (!dlg) return;
    const { x0, y0, w, h } = dlgRect();
    b.fillStyle = OUTLINE;
    b.fillRect(x0 - 1, y0 - 1, w + 2, h + 2);
    b.fillStyle = '#e8e0d0';
    b.fillRect(x0, y0, w, h);
    b.fillStyle = '#1e1c2c';
    b.fillRect(x0 + 2, y0 + 2, w - 4, h - 4);
    b.fillStyle = '#34314a';
    b.fillRect(x0 + 4, y0 + 4, Portrait.W, h - 8);
    const talking = dlg.shown < dlg.text.length && Math.floor(st.t * 9) % 2 === 0;
    b.drawImage(Portrait.render(dlg.emo, talking), x0 + 4, y0 + h - 4 - Portrait.H);
    b.fillStyle = OUTLINE;
    b.fillRect(x0 + 3, y0 - 12, 48, 12);
    b.fillStyle = '#ffd23f';
    b.fillRect(x0 + 4, y0 - 11, 46, 10);
  }

  const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
  function text(str, x, y, size, col, align = 'left', weight = 800) {
    g.font = `${weight} ${size * scale}px ${FONT}`;
    g.fillStyle = col;
    g.textAlign = align;
    g.fillText(str, x * scale, y * scale);
  }
  function wrap(str, maxW, size, weight) {
    g.font = `${weight} ${size * scale}px ${FONT}`;
    const lines = [];
    let cur = '';
    for (const word of str.split(' ')) {
      const t = cur ? cur + ' ' + word : word;
      if (cur && g.measureText(t).width > maxW * scale) { lines.push(cur); cur = word; } else cur = t;
    }
    if (cur) lines.push(cur);
    return lines;
  }
  function rr(x, y, w, h, r, col) {
    g.fillStyle = col;
    g.beginPath();
    g.roundRect(x * scale, y * scale, w * scale, h * scale, r * scale);
    g.fill();
  }
  const rect = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x * scale, y * scale, w * scale, h * scale); };
  function circle(x, y, r, col) {
    g.fillStyle = col;
    g.beginPath();
    g.arc(x * scale, y * scale, r * scale, 0, Math.PI * 2);
    g.fill();
  }

  function drawPhoneUI() {
    const p = st.phone;
    const x0 = PX() + 3, y0 = 9, w = PHW - 6, h = H - 18;
    g.save();
    g.beginPath();
    g.roundRect(x0 * scale, y0 * scale, w * scale, h * scale, 6 * scale);
    g.clip();
    if (p.kind === 'call') {
      rect(x0, y0, w, h, '#1b2836');
      rect(x0, y0, w, h * 0.55, '#22364a');
      circle(x0 + w / 2, y0 + 46, 17, AVA[p.title]);
      text(p.title[0], x0 + w / 2, y0 + 52, 15, '#fff', 'center');
      text(p.title, x0 + w / 2, y0 + 80, 9, '#fff', 'center');
      text(p.sub, x0 + w / 2, y0 + 91, 6, p.fail ? '#ff6b6b' : '#c8d6e5', 'center', 600);
      circle(x0 + w / 2, y0 + h - 22, 9, '#e5484d');
      text('✕', x0 + w / 2, y0 + h - 18.5, 9, '#fff', 'center');
    } else {
      rect(x0, y0, w, h, '#0e1621');
      rect(x0, y0, w, 19, '#17212b');
      text('‹', x0 + 5, y0 + 13, 10, '#6ab3f3', 'center', 600);
      circle(x0 + 17, y0 + 9.5, 6, AVA[p.title]);
      text(p.title[0], x0 + 17, y0 + 12, 6, '#fff', 'center');
      text(p.title, x0 + 26, y0 + 8.5, 6.5, '#fff');
      text(p.typing ? 'печатает…' : p.sub, x0 + 26, y0 + 15, 5, p.typing ? '#6ab3f3' : '#7d8b99', 'left', 600);
      rect(x0, y0 + h - 13, w, 13, '#17212b');
      text('Сообщение', x0 + 6, y0 + h - 4.5, 5.5, '#6c7883', 'left', 600);
      g.beginPath();
      g.rect(x0 * scale, (y0 + 19) * scale, w * scale, (h - 32) * scale);
      g.clip();
      let yb = y0 + h - 16;
      for (let i = p.msgs.length - 1; i >= 0 && yb > y0 + 19; i--) {
        const m = p.msgs[i], lines = wrap(m.text, 62, 5.8, 600);
        const tw = Math.max(...lines.map(l => g.measureText(l).width)) / scale;
        const bw = Math.min(w - 8, tw + 20), bh = lines.length * 7.4 + 5;
        const bx = m.out ? x0 + w - 3 - bw : x0 + 3, by = yb - bh;
        rr(bx, by, bw, bh, 3.5, m.out ? '#2b5278' : '#182533');
        lines.forEach((l, j) => text(l, bx + 4, by + 7.4 + j * 7.4, 5.8, '#fff', 'left', 600));
        text(m.out ? '✓' : '9:41', bx + bw - 2.5, by + bh - 1.8, 3.8, m.out ? '#7fb2e0' : '#6d7f8f', 'right', 600);
        yb = by - 2.5;
      }
    }
    g.restore();
  }

  function drawOverlayText() {
    if (st.mode === 'title') {
      text('АРТЕМИЙ', W / 2, H / 2 - 8, 18, '#ffd23f', 'center', 900);
      text('Глава 1 · Осознание', W / 2, H / 2 + 6, 7, '#f4f1ea', 'center', 700);
      if (Math.floor(st.t * 2) % 2) text('тапни, чтобы начать', W / 2, H - 20, 6, '#9a96a8', 'center', 700);
    }
    if (st.mode === 'date') {
      g.globalAlpha = st.dateA;
      text('13 октября', W / 2, H / 2, 12, '#f4f1ea', 'center', 800);
      g.globalAlpha = 1;
    }
    if (st.mode === 'wake' && st.wake.buzz && Math.floor(st.t * 3) % 2) {
      const [px, py] = st.wake.rot > 0.5 ? phonePos() : [W * 0.78, H * 0.8];
      text('бзз… бзз…', px, py - 16, 6, '#3a3a46', 'center', 800);
    }
    if (st.mode === 'phone') drawPhoneUI();
    if (st.mode === 'end') {
      text('Продолжение следует…', W / 2, H / 2 - 2, 11, '#f4f1ea', 'center', 800);
      text('Квест 1 · Осознание пройден', W / 2, H / 2 + 12, 6, '#9a96a8', 'center', 700);
    }
    if (st.mode === 'room' && !dlg) {
      if (st.task) {
        g.font = `800 ${6.5 * scale}px ${FONT}`;
        const tw = g.measureText('Задание: ' + st.task).width / scale + 14;
        rr(W / 2 - tw / 2, 4, tw, 12, 4, 'rgba(20,18,32,.82)');
        text('Задание: ' + st.task, W / 2, 12.3, 6.5, '#ffd23f', 'center', 800);
      }
      if (st.hasGuitar && !st.lock) { const [x, y] = BTN.atk(); text('Удар', x, y + 2.5, 6, '#ffd23f', 'center', 900); }
      if (nearGuitar()) { const [x, y] = BTN.act(); text('Взять', x, y + 2, 5, '#7bd389', 'center', 900); }
      if (!moved) text('Веди пальцем слева, чтобы идти', W / 2, H - 8, 6.5, 'rgba(255,255,255,.85)', 'center', 800);
    }
    if (dlg) {
      const { x0, y0, w, h } = dlgRect();
      text(dlg.who, x0 + 27, y0 - 3.5, 6.5, '#1e1c2c', 'center', 900);
      const tx = x0 + Portrait.W + 10;
      const lines = wrap(dlg.text.slice(0, Math.floor(dlg.shown)), w - Portrait.W - 18, 8, 700);
      lines.forEach((l, i) => text(l, tx, y0 + 16 + i * 11, 8, '#f4f1ea', 'left', 700));
      if (dlg.shown >= dlg.text.length && Math.floor(st.t * 3) % 2) text('▼', x0 + w - 8, y0 + h - 6, 6, '#ffd23f', 'center', 900);
    }
    if (st.fade > 0) {
      g.fillStyle = `rgba(0,0,0,${st.fade})`;
      g.fillRect(0, 0, cv.width, cv.height);
    }
  }

  function draw() {
    b.fillStyle = '#000';
    b.fillRect(0, 0, W, H);
    if (st.mode === 'wake') drawWake();
    if (st.mode === 'phone') {
      drawWake();
      b.globalAlpha = 0.55;
      b.fillStyle = '#000';
      b.fillRect(0, 0, W, H);
      b.globalAlpha = 1;
      drawPhoneFrame();
    }
    if (st.mode === 'room') drawRoom();
    drawDialogBox();
    g.drawImage(buf, 0, 0, W * scale, H * scale);
    drawOverlayText();
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

  const takeGuitar = () => { st.hasGuitar = true; vib(); };

  function onDown(e) {
    if (e.pointerType === 'touch') goFull();
    if (tapWait) { const r = tapWait; tapWait = null; r(); return; }
    if (dlg) {
      if (dlg.shown < dlg.text.length) dlg.shown = dlg.text.length;
      else { const r = dlg.r; dlg = null; r(); }
      return;
    }
    if (st.mode !== 'room' || st.lock || e.pointerType === 'key') return;
    const [x, y] = toBuf(e);
    const hitBtn = ([bx, by, r]) => Math.hypot(x - bx, y - by) < r + 6;
    if (st.hasGuitar && hitBtn(BTN.atk())) return attack();
    if (nearGuitar() && hitBtn(BTN.act())) return takeGuitar();
    if (x < W * 0.55 && !joy) { joy = { id: e.pointerId, sx: x, sy: y, x, y }; cv.setPointerCapture(e.pointerId); }
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
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', e => { if (joy && e.pointerId === joy.id) [joy.x, joy.y] = toBuf(e); });
    const end = e => { if (joy && e.pointerId === joy.id) joy = null; };
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);
    // с клавиатуры: пробел — тап, J — удар, E — взять
    addEventListener('keydown', e => {
      keys.add(e.code);
      if (e.code === 'Space') onDown({ pointerType: 'key', clientX: 0, clientY: 0 });
      if (st.mode !== 'room' || dlg || st.lock) return;
      if (e.code === 'KeyJ' && st.hasGuitar) attack();
      if (e.code === 'KeyE' && nearGuitar()) takeGuitar();
    });
    addEventListener('keyup', e => keys.delete(e.code));
    requestAnimationFrame(loop);
    quest1();
  }

  init();
})();
