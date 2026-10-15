(() => {
  const COL = { ...Char.PAL, N: '#3a2418', g: '#5a3a22', O: '#d9822b', o: '#a85a1c', Y: '#f2b25a' };
  const OUTLINE = COL.k;
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
  const SPR = { guitar: sprite(GUITAR) };

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
    const w = cv.clientWidth || innerWidth, h = cv.clientHeight || innerHeight;
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

  function drawPlayer() {
    if (st.mode === 'arena' && fight.S.inv > 0 && Math.floor(st.t / 0.08) % 2) return;
    const f = pl.moving ? Math.floor(pl.walkT / 0.115) % 4 : -1;
    const bob = pl.moving ? (f % 2 ? -1 : 0) : (Math.floor(pl.t / 0.55) % 2);
    Actors.draw(b, Actors.DEFS.artemiy, ox + pl.x, oy + pl.y, { dir: pl.dir, face: pl.face, f, bob, blink: pl.blink > 0, pose: st.heroPose, z: st.heroZ, rot: st.heroRot });
  }

  function drawNpc(n) {
    Actors.draw(b, Actors.DEFS[n.def], ox + n.x, oy + n.y, { dir: n.dir, face: n.face, f: -1, bob: Math.floor(st.t / 0.6) % 2, blink: false, pose: n.pose, z: n.z, rot: n.rot });
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
  const solids = () => st.mode === 'arena'
    ? [...places[st.place].solids, ...st.npcs.map(n => [n.x - 5, n.y - 3, 10, 4])]
    : [...SOLIDS, ...(st.hasGuitar ? [] : [[FW - 25, 46, 9, 6]]), ...(st.box ? [BOX] : [])];
  const blocked = (x, y) => x < 5 || x > FW - 5 || y < 4 || y > FH - 1 ||
    solids().some(([sx0, sy0, w, d]) => x + 4 > sx0 && x - 4 < sx0 + w && y + 1 > sy0 && y - 3 < sy0 + d);

  const st = {
    mode: 'title', t: 0, fade: 0, dateA: 0, task: '', marker: null, icon: null, lock: false,
    hasGuitar: false, box: true, swing: 0, hit: false, stop: 0, shake: 0, parts: [], phone: null,
    wake: { lids: 0, blur: 1, rot: 0, hand: 0, lift: 0, buzz: false },
    place: null, hasKey: false, bkOpen: false, auto: null, npcs: [], card: null, cardA: 0, hurtFlash: 0, ultFlash: 0,
    swingId: 0, map: null, done: {}, pop: null, heroPose: null, untie: null, deadMsg: false,
    heroZ: 0, heroRot: 0, bike: null, tramp: null, credits: 0, skip: false,
    fp: null, camX: 0, camY: 0, tendrils: null, portal: null, claude: null, orb: null, boom: null,
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

  const view = () => ({ W, H, ox, oy });
  const C = { st, pl, R, box, disc, b, OUTLINE, vib, view, blocked: (x, y) => blocked(x, y) };
  const places = Places(C);
  const fight = Fight(C);

  // прогресс сюжета: Telegram CloudStorage, вне Телеги — localStorage; ?reset — начать заново
  const TG = window.Telegram && Telegram.WebApp;
  const cloud = TG && TG.initData && TG.isVersionAtLeast('6.9') ? TG.CloudStorage : null;
  const TESTER = !(TG && TG.initData) || ['omanns'].includes(((TG.initDataUnsafe.user || {}).username || '').toLowerCase());
  const parseDone = v => { try { return JSON.parse(v || '{}') || {}; } catch { return {}; } };
  function saveDone() {
    const v = JSON.stringify(st.done);
    if (cloud) cloud.setItem('story', v);
    else try { localStorage.setItem('bday_story', v); } catch {}
  }
  function loadDone() {
    if (/[?&]reset/.test(location.search)) { st.done = {}; saveDone(); return Promise.resolve({}); }
    if (cloud) return new Promise(r => cloud.getItem('story', (e, v) => r(parseDone(e ? '' : v))));
    try { return Promise.resolve(parseDone(localStorage.getItem('bday_story'))); } catch { return Promise.resolve({}); }
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
    Sfx.play.ping();
    await wait(0.6);
  }
  async function outgoing(text) {
    st.phone.msgs.push({ text, out: true });
    Sfx.play.send();
    await wait(0.7);
  }
  async function call(name) {
    st.phone = { kind: 'call', title: name, sub: 'Вызов…' };
    Sfx.play.ring();
    await wait(1.4);
    st.phone.sub = 'Абонент недоступен';
    st.phone.fail = true;
    Sfx.play.fail();
    vib();
    await wait(1.1);
  }

  async function quest1() {
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
    st.lock = false;
    st.done.q1 = 1;
    saveDone();
  }

  // ---------- карта ----------
  const PINS = [
    { id: 'home', name: 'Дом', sub: 'Колпино. Тут всё началось', at: [0.55, 0.68], home: true },
    { id: 'oka', name: 'ОКА', sub: '«там, куда вы вечно катались»', at: [0.67, 0.48], save: 'roma' },
    { id: 'fnaf', name: 'Квест ФНАФ', sub: '«там, где вы обосрались, держа дверь»', at: [0.37, 0.2], save: 'andrey' },
    { id: 'tower', name: 'Вышка', sub: '«туда лезли все, кроме Андрея»', at: [0.16, 0.6], save: 'anton' },
    { id: 'yam', name: '???', sub: 'Сначала спаси всех', at: [0.87, 0.8], locked: true, save: 'yam' },
  ];
  const yamOpen = () => ['roma', 'anton', 'andrey'].every(k => st.done[k]);
  const locked = p => p.locked && !yamOpen();
  const playable = p => !p.home && (TESTER || (!st.done[p.save] && !locked(p)));
  const pinName = p => p.id === 'yam' && st.done.yam ? 'Космос' : p.name;
  const pinSub = p => p.id === 'yam' && yamOpen() ? 'Что-то тут не так…' : p.sub;
  const pinXY = p => [Math.round(p.at[0] * W), Math.round(22 + p.at[1] * (H - 40))];
  const mapCard = () => { const cw = Math.min(230, W - 20); return [Math.round(W / 2 - cw / 2), H - 46, cw, 40]; };
  const mapBtn = () => { const [x, y, w] = mapCard(); return [x + w - 60, y + 22, 52, 13]; };

  async function openMap() {
    await tween(st, 'fade', 1, 0.5);
    st.mode = 'map';
    st.task = '';
    st.marker = null;
    st.map = { sel: null, pick: null };
    await tween(st, 'fade', 0, 0.5);
    await until(() => st.map.pick);
    await tween(st, 'fade', 1, 0.6);
    return st.map.pick;
  }

  function mapTap(x, y) {
    const m = st.map;
    if (m.sel) {
      const [bx, by, bw, bh] = mapBtn();
      if (x >= bx - 4 && x <= bx + bw + 4 && y >= by - 4 && y <= by + bh + 4) {
        if (playable(m.sel)) { m.pick = m.sel.id; Sfx.play.go(); }
        else vib();
        return;
      }
    }
    for (const q of PINS) {
      const [px, py] = pinXY(q);
      if (Math.hypot(x - px, y - py + 9) < 15) { m.sel = q; Sfx.play.pop(); return; }
    }
    if (y < mapCard()[1]) m.sel = null;
  }

  function line(x0, y0, x1, y1, w, col) {
    b.fillStyle = col;
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0)) || 1;
    for (let i = 0; i <= n; i++) b.fillRect(Math.round(x0 + (x1 - x0) * i / n - w / 2), Math.round(y0 + (y1 - y0) * i / n - w / 2), w, w);
  }
  const MP = (fx, fy) => [fx * W, 22 + fy * (H - 40)];
  function path(pts, w, col) { for (let i = 1; i < pts.length; i++) line(...MP(...pts[i - 1]), ...MP(...pts[i]), w, col); }

  function drawMap() {
    b.fillStyle = '#1b2029';
    b.fillRect(0, 0, W, H);
    b.fillStyle = '#222836';
    for (let y = 12, r = 0; y < H; y += 17, r++) for (let x = (r % 2) * 12 - 12; x < W; x += 25) b.fillRect(x + 2, y + 2, 20, 13);
    for (const [fx, fy, r] of [[0.08, 0.32, 16], [0.46, 0.44, 11], [0.76, 0.24, 13], [0.3, 0.82, 12], [0.62, 0.86, 9]]) disc(...MP(fx, fy), r, '#1f3a2b');
    path([[0, 0.06], [0.3, 0.02], [0.55, 0.05], [0.8, 0.0], [1, 0.04]], 8, '#1f4b73');
    path([[0.5, 1.1], [0.53, 0.84], [0.6, 0.6], [0.63, 0.36], [0.62, 0.05]], 4, '#1f4b73');
    path([[0, 0.45], [0.3, 0.5], [0.55, 0.68], [0.87, 0.8], [1, 0.86]], 2, '#3b4558');
    path([[0.37, 0.2], [0.45, 0.42], [0.55, 0.68]], 3, '#56627a');
    path([[0.16, 0.6], [0.35, 0.64], [0.55, 0.68]], 3, '#56627a');
    path([[0.55, 0.68], [0.67, 0.48]], 3, '#56627a');
    path([[0.1, 0.0], [0.37, 0.2], [0.75, 0.15], [1, 0.25]], 2, '#3b4558');
    path([[0.16, 0.6], [0.2, 1.1]], 2, '#3b4558');
    const sel = st.map.sel;
    if (sel && !sel.home) {
      const [x0, y0] = pinXY(PINS[0]), [x1, y1] = pinXY(sel), n = Math.hypot(x1 - x0, y1 - y0) / 4;
      b.fillStyle = '#7fd0ff';
      for (let i = 0; i < n; i += 2) {
        const k = (i + (st.t * 3) % 2) / n;
        if (k <= 1) b.fillRect(Math.round(x0 + (x1 - x0) * k) - 1, Math.round(y0 + (y1 - y0) * k) - 1, 2, 2);
      }
    }
    for (const q of PINS) {
      const [x, y] = pinXY(q), on = sel === q, bob = on ? Math.round(Math.sin(st.t * 6)) : 0;
      const col = q.home ? '#4a90e2' : locked(q) ? '#6c7883' : st.done[q.save] ? '#2ecc71' : q.id === 'yam' ? '#e74c3c' : '#f0a020';
      b.globalAlpha = 0.35;
      b.fillStyle = '#000';
      b.fillRect(x - 3, y, 7, 1);
      b.globalAlpha = 1;
      const top = y - 10 + bob;
      for (let i = 0; i < 6; i++) { b.fillStyle = OUTLINE; b.fillRect(x - 3 + Math.floor(i / 2), top + 4 + i, 7 - Math.floor(i / 2) * 2, 1); }
      disc(x, top, on ? 7 : 6, OUTLINE);
      disc(x, top, on ? 6 : 5, col);
      for (let i = 0; i < 5; i++) { b.fillStyle = col; b.fillRect(x - 2 + Math.floor(i / 2), top + 4 + i, 5 - Math.floor(i / 2) * 2, 1); }
      disc(x, top, 2, '#ffffff');
    }
  }

  function drawMapUI() {
    rect(0, 0, W, 14, '#151a22');
    text('Карты', 8, 10, 6.5, '#ffffff', 'left', 900);
    rr(44, 2.5, W - 120, 9, 4, '#232a36');
    text('Куда едем?', 50, 8.8, 5.2, '#7d8b99', 'left', 600);
    const saved = ['roma', 'andrey', 'anton'].filter(k => st.done[k]).length;
    text(`Спасены: ${saved}/3`, W - 8, 9.5, 6, '#7bd389', 'right', 900);
    for (const q of PINS) {
      const [x, y] = pinXY(q);
      g.font = `800 ${5.5 * scale}px ${FONT}`;
      const tw = g.measureText(pinName(q)).width / scale + 8;
      rr(x - tw / 2, y + 3, tw, 9, 3, 'rgba(15,18,24,.85)');
      text(pinName(q) + (st.done[q.save] ? ' ✓' : ''), x, y + 9.7, 5.5, st.done[q.save] ? '#7bd389' : '#ffffff', 'center', 800);
    }
    const p = st.map.sel;
    if (!p) {
      const hint = st.done.yam ? 'Игра пройдена. С днём рождения!' : 'Выбери точку на карте';
      text(hint, W / 2, H - 8, 6.5, 'rgba(255,255,255,.85)', 'center', 800);
      return;
    }
    const [cx, cy, cw, ch] = mapCard();
    rr(cx, cy, cw, ch, 6, 'rgba(21,26,34,.95)');
    text(pinName(p), cx + 8, cy + 12, 8, '#ffffff', 'left', 900);
    text(pinSub(p), cx + 8, cy + 22, 5.5, '#c8d6e5', 'left', 600);
    if (p.home) return;
    const [bx, by, bw, bh] = mapBtn();
    const done = st.done[p.save], go = playable(p);
    rr(bx, by, bw, bh, 4, go ? '#f0a020' : done ? '#1f5a3a' : '#2c3442');
    text(go ? 'Поехали' : done ? 'Пройдено ✓' : 'Закрыто', bx + bw / 2, by + 9, 6, go ? '#1a1620' : '#c8d6e5', 'center', 900);
  }

  // ---------- квест «Рома»: ОКА ----------
  const PID = { 'Артемий': 'artemiy', 'Рома': 'roma', 'Пацан': 'gop', 'Жирный': 'fat', 'Спасатель': 'lg', 'Антон': 'anton', 'Андрей': 'andrey', 'Развитие': 'boss', 'Клод': 'claude' };
  const DOOR = [FW / 2, -2];

  async function card(title, sub) {
    st.card = { title, sub };
    st.mode = 'card';
    Sfx.play.whoosh();
    st.fade = 0;
    await tween(st, 'cardA', 1, 0.6);
    await wait(1.6);
    await tween(st, 'cardA', 0, 0.5);
    st.fade = 1;
  }

  function enterArena(id, x, y, dir = 'up', allies) {
    st.mode = 'arena';
    st.place = id;
    Object.assign(pl, { x, y, dir, face: 1, kbt: 0 });
    st.npcs = [];
    st.marker = null;
    st.task = '';
    const keep = fight.allies().map(a => a.id);
    fight.start([]);
    fight.setAllies(allies || keep);
  }
  const walkTo = (x, y) => { st.auto = [x, y]; return until(() => !st.auto); };

  async function goTo(id, from, to, dir) {
    st.lock = true;
    Sfx.play.door();
    await tween(st, 'fade', 1, 0.5);
    enterArena(id, from[0], from[1], dir);
    await tween(st, 'fade', 0, 0.5);
    await walkTo(...to);
    st.lock = false;
  }

  // драка до победы; при смерти — затемнение и та же драка заново с полными сердцами
  async function brawl(retry, from, started) {
    for (;;) {
      if (!started) fight.start(retry);
      started = false;
      Sfx.music('fight');
      st.task = 'Отбейся';
      await until(() => {
        if (st.skip) { st.skip = false; fight.skip(); }
        return fight.cleared() || fight.S.dead;
      });
      if (!fight.S.dead) { st.task = ''; Sfx.stopMusic(); Sfx.play.win(); return; }
      Sfx.stopMusic();
      Sfx.play.lose();
      st.lock = true;
      st.task = '';
      await wait(0.6);
      await tween(st, 'fade', 1, 0.6);
      st.deadMsg = true;
      await wait(1.3);
      st.deadMsg = false;
      Object.assign(pl, { x: from[0], y: from[1], dir: 'up', kbt: 0 });
      st.lock = false;
      await tween(st, 'fade', 0, 0.5);
    }
  }

  const R_ = (look, at, to, more = {}) => ({ t: 'runner', look, at, to, ...more });
  const STK = (look, at, to, more = {}) => ({ t: 'stick', look, at, to, ...more });
  const FAT = (at, to, more = {}) => ({ t: 'fat', look: 'fat', at, to, ...more });

  async function questRoma() {
    st.hasKey = false;
    st.bkOpen = false;
    st.untie = null;
    await card('ОКА', 'Колпино · там, куда вы вечно катались');
    enterArena('oka', 112, FH + 10, 'up', friends('roma'));
    st.lock = true;
    await tween(st, 'fade', 0, 0.7);
    await walkTo(112, 96);
    // пацан выходит из ОКА и идёт навстречу
    fight.start([[R_('gop', DOOR, [112, 62])], [STK('gop2', [-10, 60], [30, 60]), R_('gop3', [FW + 10, 60], [190, 60])]], { calm: true });
    await until(() => fight.arrived());
    st.icon = { sym: '!', t: 0.8 };
    await wait(0.5);
    await say('angry', 'Это ты меня на хуй послал?', 'Пацан');
    await say('shock', 'Нет, когда такое было');
    await say('angry', 'Да вот когда мы из школы выходили. Ты будешь извиняться?', 'Пацан');
    await say('normal', '…');
    await say('smirk', 'Ща, я позову кентов', 'Пацан');
    fight.spawn(FAT(DOOR, [112, 44]));
    fight.spawn(R_('gop2', DOOR, [80, 54]));
    fight.spawn(R_('gop3', DOOR, [146, 54]));
    await until(() => fight.arrived());
    await say('facepalm', 'Ну пиздец');
    st.lock = false;
    fight.engage();
    await brawl([[R_('gop', DOOR, [112, 60]), FAT(DOOR, [112, 44]), R_('gop2', DOOR, [80, 54]), R_('gop3', DOOR, [146, 54])],
      [STK('gop2', [-10, 60], [30, 60]), R_('gop3', [FW + 10, 60], [190, 60])]], [112, 96], true);
    await wait(0.4);
    await say('think', 'Ромы тут нет. Значит, внутри');
    st.task = 'Зайди в ОКА';
    st.marker = [112, -24];
    await goal(() => pl.y < 9 && Math.abs(pl.x - 112) < 14);
    st.marker = null;

    // фудкорт
    await goTo('food', [-10, 70], [26, 70], 'side');
    fight.start([[R_('gop', [FW + 10, 70], [176, 58]), R_('gop3', [FW + 10, 72], [200, 70]), STK('gop2', [FW + 10, 70], [160, 72])],
      [STK('gop', [FW + 10, 64], [170, 64]), R_('gop2', [FW + 10, 76], [180, 80]), R_('gop3', [-10, 64], [20, 64]), STK('gop3', [-10, 74], [24, 100])],
      [FAT([FW + 10, 70], [170, 70]), R_('gop', [-10, 70], [24, 60]), R_('gop2', [FW + 10, 70], [190, 100])]], { calm: true });
    await until(() => fight.arrived());
    await say('angry', 'Да сколько вас');
    fight.engage();
    await brawl([
      [R_('gop', [FW + 10, 70], [176, 58]), R_('gop3', [FW + 10, 72], [200, 70]), STK('gop2', [FW + 10, 70], [160, 72])],
      [STK('gop', [FW + 10, 64], [170, 64]), R_('gop2', [FW + 10, 76], [180, 80]), R_('gop3', [-10, 64], [20, 64]), STK('gop3', [-10, 74], [24, 100])],
      [FAT([FW + 10, 70], [170, 70]), R_('gop', [-10, 70], [24, 60]), R_('gop2', [FW + 10, 70], [190, 100])],
    ], [26, 70], true);
    await wait(0.4);
    await say('think', 'Так… а Бургер Кинг дальше');
    st.task = 'Иди дальше';
    st.marker = [FW - 10, 54];
    await goal(() => pl.x > FW - 9 && pl.y > 48 && pl.y < 94);
    st.marker = null;

    // перед Бургер Кингом
    await goTo('bk', [-10, 70], [30, 70], 'side');
    st.task = 'Подойди к Бургер Кингу';
    st.marker = [112, -32];
    await goal(() => pl.y < 30 && Math.abs(pl.x - 112) < 30);
    st.marker = null;
    st.task = '';
    st.icon = { sym: '?', t: 1 };
    await say('think', 'Закрыто. На цепи');
    fight.start([[FAT([FW + 10, 60], [180, 64], { key: true, hp: 12 }), STK('gop', [-10, 60], [30, 60]), R_('gop3', [-10, 90], [40, 92])],
      [R_('gop2', [FW + 10, 90], [190, 92]), STK('gop3', [-10, 70], [24, 70])]], { calm: true });
    await until(() => fight.arrived());
    await say('smirk', 'Ключ, значит, у жирного');
    await say('angry', 'Попробуй забери', 'Жирный');
    fight.engage();
    await brawl([
      [FAT([FW + 10, 60], [180, 64], { key: true, hp: 12 }), STK('gop', [-10, 60], [30, 60]), R_('gop3', [-10, 90], [40, 92])],
      [R_('gop2', [FW + 10, 90], [190, 92]), STK('gop3', [-10, 70], [24, 70])],
    ], [112, 60], true);
    if (!st.hasKey) {
      st.task = 'Подбери ключ';
      await goal(() => st.hasKey, () => { st.hasKey = true; });
    }
    st.task = 'Открой дверь';
    st.marker = [112, -32];
    await goal(() => pl.y < 9 && Math.abs(pl.x - 112) < 14);
    st.marker = null;
    st.task = '';
    st.lock = true;
    Sfx.play.key();
    Sfx.play.door();
    st.bkOpen = true;
    st.shake = 0.15;
    await wait(0.6);

    // внутри: Рома связан на стуле
    await tween(st, 'fade', 1, 0.5);
    enterArena('bkin', 112, FH + 10);
    const roma = { def: 'roma', x: 112, y: 40, dir: 'down', face: 1, pose: 'tied' };
    st.npcs = [roma];
    await tween(st, 'fade', 0, 0.5);
    await walkTo(112, 92);
    st.lock = false;
    st.task = 'Развяжи Рому';
    st.untie = { x: roma.x, y: roma.y + 8, done: false };
    await goal(() => st.untie.done);
    st.task = '';
    st.lock = true;
    roma.pose = null;
    Sfx.play.rope();
    for (let i = 0; i < 10; i++) st.parts.push({ x: roma.x, y: roma.y - 8, vx: (Math.random() - 0.5) * 100, vy: -Math.random() * 70, life: 0.5, col: ['#c8a060', '#8a6a3a'][i % 2] });
    await wait(0.5);
    await say('shock', 'Это пиздец, каким хуем я тут оказался?', 'Рома');
    await say('normal', 'Не знаю. Мне просто какой-то олух написал, что вас всех поймали и держат где-то');
    await say('smirk', 'Погнали спасать пацанов');
    // братское рукопожатие с хлопком
    await walkTo(roma.x - 16, roma.y);
    Object.assign(pl, { dir: 'side', face: 1 });
    Object.assign(roma, { dir: 'side', face: -1 });
    await wait(0.4);
    st.heroPose = roma.pose = 'windup';
    await wait(0.35);
    st.heroPose = roma.pose = 'punch';
    Sfx.play.clap();
    st.shake = 0.35;
    st.stop = 0.08;
    vib();
    for (let i = 0; i < 12; i++) st.parts.push({ x: roma.x - 8, y: roma.y - 12, vx: (Math.random() - 0.5) * 140, vy: -Math.random() * 90, life: 0.4, col: '#ffffff' });
    st.pop = { text: 'ХЛОП!', x: roma.x - 8, y: roma.y - 34, t: 0.9 };
    await wait(0.9);
    st.heroPose = roma.pose = null;
    await say('smirk', 'Ну всё, пошли', 'Рома');
    await rescued('Рома', 'roma');
  }

  // ---------- общее для квестов друзей ----------
  const FRIENDS = ['roma', 'anton', 'andrey'];
  const ACC = { roma: 'Рому', anton: 'Антона', andrey: 'Андрея' };
  const friends = except => FRIENDS.filter(k => st.done[k] && k !== except);
  const allFree = () => FRIENDS.every(k => st.done[k]);
  // прыжок: дуга по высоте (z), на земле остаётся тень
  const arc = (obj, key, h, dur) => new Promise(r => jobs.push({ t: dur, dur, f: k => { obj[key] = h * 4 * k * (1 - k); }, r }));
  // ждать условия; кнопка «⏭» у тестера выполняет задание сразу
  const goal = (cond, onSkip) => until(() => {
    if (st.skip) { st.skip = false; if (onSkip) onSkip(); return true; }
    return cond();
  });

  async function rescued(name, key) {
    st.done[key] = 1;
    saveDone();
    st.lock = false;
    await tween(st, 'fade', 1, 0.8);
    st.npcs = [];
    st.tramp = null;
    st.bike = null;
    const left = FRIENDS.filter(k => !st.done[k]).length;
    await card(`${name} спасён`, left ? `Осталось спасти: ${left}` : 'Вся компашка в сборе');
    if (!left) await questFinal(name);
  }

  // ---------- квест «Антон»: вышка у Пушкина ----------
  const LG = (look, at, to, more = {}) => ({ t: 'stick', look, at, to, o: { reach: 28 }, ...more });
  const BUOY = (look, at, to) => ({ t: 'ranged', look, at, to });
  async function questAnton() {
    const TOP = places.TOWER_TOP;
    await card('Вышка', 'Пушкин · туда лезли все, кроме Андрея');
    enterArena('tower', -30, 100, 'side', friends('anton'));
    for (const [i, a] of fight.allies().entries()) { a.x = -60 - i * 16; a.y = 104 + i * 6; }
    const anton = { def: 'anton', x: 112, y: TOP - 1, dir: 'down', face: 1, pose: 'tied' };
    st.npcs = [anton];
    st.bike = { x: -30, y: 100, ride: true, lie: false };
    st.lock = true;
    await tween(st, 'fade', 0, 0.5);
    // въезд на велике и эпичный прыжок: велик катится дальше и падает
    Sfx.play.bike();
    await tween(pl, 'x', 64, 0.9);
    st.bike.ride = false;
    st.bike.x = pl.x;
    Sfx.play.whoosh();
    await Promise.all([tween(st.bike, 'x', 118, 0.7), arc(st, 'heroZ', 22, 0.7), tween(pl, 'x', 76, 0.7)]);
    st.bike.lie = true;
    st.shake = 0.25;
    Sfx.play.land();
    Sfx.play.crash();
    for (const [i, a] of fight.allies().entries()) { a.x = pl.x - 22 - i * 14; a.y = pl.y + 6 + i * 4; a.dir = 'side'; a.face = 1; }
    await wait(0.3);
    st.icon = { sym: '!', t: 1 };
    await say('shock', 'Антон?!');
    await say('angry', 'ПАЦАНЫ СНИМИТЕ МЕНЯ БЛЯТЬ', 'Антон');
    fight.start([[LG('lg1', [-10, 60], [40, 64]), LG('lg2', [FW + 10, 60], [184, 64]), BUOY('lg1', [FW + 10, 90], [190, 96])],
      [LG('lg2', [-10, 40], [30, 40]), BUOY('lg2', [-10, 96], [30, 100]), LG('lg1', [FW + 10, 40], [196, 40]), BUOY('lg1', [FW + 10, 70], [200, 74])]], { calm: true });
    await until(() => fight.arrived());
    await say('angry', 'Купаться запрещено!', 'Спасатель');
    await say('think', 'Тут даже воды нет');
    st.lock = false;
    fight.engage();
    await brawl([[LG('lg1', [-10, 60], [40, 64]), LG('lg2', [FW + 10, 60], [184, 64]), BUOY('lg1', [FW + 10, 90], [190, 96])],
      [LG('lg2', [-10, 40], [30, 40]), BUOY('lg2', [-10, 96], [30, 100]), LG('lg1', [FW + 10, 40], [196, 40]), BUOY('lg1', [FW + 10, 70], [200, 74])]], [76, 100], true);
    await wait(0.4);
    await say('think', 'Как его туда блять подняли с его то весом?');
    if (st.done.roma) await say('shock', 'Да пизде, с таким то весом поднять его? Что там за чудище то', 'Рома');
    if (st.done.andrey) await say('normal', 'хз', 'Андрей');
    const helper = fight.allies()[0];
    if (helper) {
      await say('smirk', 'Лезь, я ща батут сделаю по фасту', helper.id === 'roma' ? 'Рома' : 'Андрей');
      helper.x = 140; helper.y = 64;
      st.tramp = [112, 62];
      Sfx.play.boing();
    }
    st.task = 'Залезь на вышку';
    st.marker = [112, places.TOWER_TOP - 24];
    await goal(() => Math.abs(pl.x - 112) < 16 && pl.y < 34 && pl.y > 16);
    st.marker = null;
    st.task = '';
    st.lock = true;
    await walkTo(112, 26);
    await walkTo(112, TOP - 1);
    await walkTo(104, TOP - 1);
    Object.assign(pl, { dir: 'side', face: 1 });
    await say('normal', 'Держись');
    anton.pose = null;
    Sfx.play.rope();
    for (let i = 0; i < 10; i++) st.parts.push({ x: anton.x, y: anton.y - 8, vx: (Math.random() - 0.5) * 100, vy: -Math.random() * 70, life: 0.5, col: ['#c8a060', '#8a6a3a'][i % 2] });
    await wait(0.5);
    if (st.tramp) {
      await say('shock', 'Прыгаем?!', 'Антон');
      await say('smirk', 'Прыгаем');
      Sfx.play.whoosh();
      await Promise.all([tween(pl, 'y', 60, 0.6), tween(anton, 'y', 62, 0.6), tween(pl, 'x', 108, 0.6), tween(anton, 'x', 118, 0.6)]);
      Sfx.play.boing();
      st.shake = 0.2;
      await Promise.all([arc(st, 'heroZ', 26, 0.7), arc(anton, 'z', 30, 0.75), tween(pl, 'y', 84, 0.7), tween(anton, 'y', 86, 0.75), tween(anton, 'x', 128, 0.75)]);
    } else {
      await walkTo(112, TOP - 1);
      await walkTo(112, 84);
      Object.assign(anton, { x: 128, y: 86 });
    }
    Object.assign(pl, { dir: 'side', face: 1 });
    Object.assign(anton, { dir: 'side', face: -1 });
    await say('shock', 'Пацаны спасибо блять, как там высоко то было', 'Антон');
    const left = FRIENDS.filter(k => !st.done[k] && k !== 'anton').map(k => ACC[k]);
    await say('normal', left.length ? `Да блять, нам еще спасать ${left.join(' и ')}` : 'Да блять. Ну всё, вся компашка в сборе');
    await rescued('Антон', 'anton');
  }

  // ---------- квест «Андрей»: хоррор-квест с аниматрониками ----------
  const BEAR = (at, to, hp = 8) => ({ t: 'fat', look: 'bear', at, to, hp });
  const BUNNY = (at, to) => ({ t: 'runner', look: 'bunny', at, to });
  const FOX = (at, to) => ({ t: 'runner', look: 'fox', at, to, o: { speed: 46, wind: 0.26 } });
  const CHICK = (at, to) => ({ t: 'ranged', look: 'chick', at, to, o: { proj: 'cake' } });
  async function questAndrey() {
    await card('Полтора часа спустя', 'Квест ФНАФ · Санкт-Петербург');
    enterArena('pizza1', -10, 70, 'side', friends('andrey'));
    await tween(st, 'fade', 0, 0.6);
    st.lock = true;
    await walkTo(26, 70);
    const show = [[BEAR([112, 6], [112, 6]), BUNNY([88, 8], [88, 8]), CHICK([136, 8], [136, 8])],
      [FOX([FW + 10, 64], [196, 64]), BUNNY([FW + 10, 76], [190, 80]), CHICK([-10, 100], [24, 100])]];
    fight.start(show, { calm: true });
    await say('think', 'Тут же квест был… а это чо такое');
    if (st.done.roma) await say('shock', 'Только не говори, что они живые', 'Рома');
    if (st.done.anton) await say('shock', 'ЭТО ЧО МИШКА', 'Антон');
    st.shake = 0.3;
    Sfx.play.slam();
    await wait(0.4);
    await say('shock', 'Они живые');
    st.lock = false;
    fight.engage();
    await brawl(show, [26, 70], true);
    await say('think', 'Андрей где-то дальше');
    st.task = 'Иди в подсобку';
    st.marker = [FW - 10, 52];
    await goal(() => pl.x > FW - 9 && pl.y > 48 && pl.y < 84);
    st.marker = null;
    await goTo('pizza2', [-10, 70], [26, 70], 'side');
    const andrey = { def: 'andrey', x: 112, y: 40, dir: 'down', face: 1, pose: 'tied' };
    st.npcs = [andrey];
    fight.start([[BEAR([FW + 10, 70], [170, 70], 14), FOX([FW + 10, 90], [190, 96]), CHICK([-10, 100], [30, 104])]], { calm: true });
    await until(() => fight.arrived());
    await say('angry', 'бля пацаны сзади', 'Андрей');
    fight.engage();
    await brawl([[BEAR([FW + 10, 70], [170, 70], 14), FOX([FW + 10, 90], [190, 96]), CHICK([-10, 100], [30, 104])]], [26, 70], true);
    st.task = 'Развяжи Андрея';
    st.untie = { x: andrey.x, y: andrey.y + 8, done: false };
    await goal(() => st.untie.done);
    st.task = '';
    st.lock = true;
    andrey.pose = null;
    Sfx.play.rope();
    for (let i = 0; i < 10; i++) st.parts.push({ x: andrey.x, y: andrey.y - 8, vx: (Math.random() - 0.5) * 100, vy: -Math.random() * 70, life: 0.5, col: ['#c8a060', '#8a6a3a'][i % 2] });
    await wait(0.5);
    await say('normal', 'бля пацаны, наконец то', 'Андрей');
    await say('angry', 'они мне всю ночь песенки пели', 'Андрей');
    await say('smirk', 'Ну и как, понравилось?');
    await say('angry', 'иди нахуй', 'Андрей');
    await rescued('Андрей', 'andrey');
  }

  // ---------- финал: записка, удар по голове, космос, босс «Развитие», Махорага, дом ----------
  const BOSS_HP = 170, DARK_HP = 60;
  async function questFinal(who = 'Рома') {
    // записка от первого лица — и удар сзади
    st.lock = true;
    st.fp = { k: 0, text: 0, fall: 0 };
    st.mode = 'fpnote';
    st.fade = 0;
    Sfx.play.rope();
    await say('normal', 'Пацаны, тут записка', who);
    await tween(st.fp, 'k', 1, 0.7);
    await tween(st.fp, 'text', 1, 2.4);
    await wait(1.4);
    Sfx.play.crash();
    Sfx.play.land();
    st.shake = 0.5;
    st.ultFlash = 0.2;
    vib();
    await tween(st.fp, 'fall', 1, 0.9);
    st.fade = 1;
    await wait(1.2);
    // космос: все лежат, потом поднимаются
    enterArena('space', 112, 92, 'up', FRIENDS);
    for (const [i, a] of fight.allies().entries()) Object.assign(a, { x: [80, 146, 112][i], y: [96, 98, 108][i], rot: Math.PI / 2 * (i % 2 ? -1 : 1) });
    st.heroRot = Math.PI / 2;
    await tween(st, 'fade', 0, 1.6);
    await wait(0.6);
    st.heroRot = 0;
    for (const a of fight.allies()) a.rot = 0;
    Sfx.play.land();
    await say('shock', 'бля где мы', 'Андрей');
    await say('shock', 'ЭТО ЧЁРНАЯ ДЫРА?!', 'Антон');
    await say('normal', 'Мы в космосе. Без скафандров. Охуенно', 'Рома');
    let hp = BOSS_HP;
    const wave = () => [[{ t: 'boss', look: 'boss', at: [112, -20], to: [112, 40], hp }]];
    fight.start(wave(), { calm: true });
    await until(() => fight.arrived());
    await say('smirk', 'Я — Развитие', 'Развитие');
    await say('smirk', 'Тебе 16. Пора развиваться', 'Развитие');
    await say('angry', 'Это ты нас вырубил?');
    await say('smirk', 'Я вас развил. Почти', 'Развитие');
    await say('angry', 'Слышь, голова, ты чо, в себя поверил?', 'Рома');
    await say('shock', 'АХАХАХА НУ И БАШКА', 'Антон');
    await say('smirk', 'Ща я вас всех прокачаю', 'Развитие');
    await say('angry', 'Иди нахуй');
    st.lock = false;
    fight.engage();
    Sfx.music('fight');
    // 1. бой на земле до первой «смерти»; проиграл — та же драка, босс не лечится
    st.task = 'Победи Развитие';
    for (;;) {
      await until(() => {
        if (st.skip) { st.skip = false; fight.skip(); }
        return fight.S.event === 'down' || fight.S.dead;
      });
      if (!fight.S.dead) break;
      hp = Math.max(Math.ceil(BOSS_HP * 0.3), fight.boss().hp);
      st.lock = true;
      st.task = '';
      Sfx.stopMusic();
      Sfx.play.lose();
      await wait(0.6);
      await tween(st, 'fade', 1, 0.6);
      st.deadMsg = true;
      await wait(1.3);
      st.deadMsg = false;
      Object.assign(pl, { x: 112, y: 92, dir: 'up', kbt: 0 });
      fight.start(wave());
      fight.setAllies(FRIENDS);
      st.lock = false;
      st.task = 'Победи Развитие';
      Sfx.music('fight');
      await tween(st, 'fade', 0, 0.5);
    }
    // 2. падает, тьма его поглощает, он взлетает
    const bs = fight.boss();
    st.task = '';
    st.lock = true;
    fight.S.script = true;
    fight.S.event = null;
    fight.clearShots();
    Sfx.play.kill();
    st.shake = 0.3;
    await tween(bs, 'rot', Math.PI / 2, 0.5);
    Sfx.play.land();
    await wait(0.8);
    await say('smirk', 'Изи', 'Антон');
    Sfx.play.grow();
    await tween(bs, 'dark', 1, 1.4);
    await tween(bs, 'rot', 0, 0.4);
    bs.max = bs.hp = DARK_HP;
    bs.head = 17;
    await tween(bs, 'z', 34, 1);
    fight.pop('ТЁМНОЕ РАЗВИТИЕ', bs.x, bs.y - 84);
    await say('shock', 'бля он чо, воскрес', 'Андрей');
    await say('shock', 'И летает. Пиздец', 'Рома');
    await say('angry', 'ЧТО ДЕЛАТЬ ТО', 'Антон');
    await say('think', 'Уворачиваться от его умных слов. А когда сядет — бить');
    // 3. летает и стреляет словами; садится и кастует
    Object.assign(bs, { stage: 'air', airT: 7, cool: 1 });
    fight.S.script = false;
    fight.S.noDeath = true;
    st.lock = false;
    st.task = 'Уворачивайся от умных слов';
    const nextEvent = () => until(() => {
      if (st.skip) { st.skip = false; fight.skip(); }
      return !!fight.S.event;
    });
    await nextEvent();
    // первый каст «Выгорание»: у всех половина HP
    fight.S.event = null;
    fight.pop('ВЫГОРАНИЕ!', bs.x, bs.y - 74);
    Sfx.play.slam();
    Sfx.play.grow();
    st.shake = 0.4;
    st.hurtFlash = 0.3;
    fight.S.hp = Math.max(1, Math.ceil(fight.S.hp / 2));
    for (const a of fight.allies()) fight.pop('-50%', a.x, a.y - 30);
    await say('angry', 'Сука… полхп снёс');
    st.task = 'Бей, когда он кастует';
    await nextEvent();
    // второй каст должен был всех добить — катсцена
    fight.S.event = null;
    await mahoraga(bs);
  }

  async function mahoraga(bs) {
    st.task = '';
    st.lock = true;
    fight.S.script = true;
    fight.clearShots();
    Sfx.stopMusic();
    Object.assign(bs, { atk: null, z: 0, stage: 'hold' });
    // босс встаёт слева, справа будет портал
    await Promise.all([tween(bs, 'x', 86, 0.6), tween(bs, 'y', 50, 0.6)]);
    fight.pop('ПОРА РАЗВИВАТЬСЯ!', bs.x, bs.y - 74);
    // тьма хватает всех, кроме Артемия, и раскидывает
    const al = fight.allies();
    st.tendrils = al;
    Sfx.play.grow();
    await Promise.all(al.map(a => tween(a, 'z', 22, 0.8)));
    await wait(0.3);
    const spots = [[26, 44], [200, 56], [44, 112]];
    Sfx.play.whoosh();
    await Promise.all(al.map((a, i) => Promise.all([tween(a, 'x', spots[i][0], 0.5), tween(a, 'y', spots[i][1], 0.5), tween(a, 'z', 0, 0.5)])));
    st.tendrils = null;
    for (const [i, a] of al.entries()) a.rot = Math.PI / 2 * (i % 2 ? -1 : 1);
    Sfx.play.crash();
    st.shake = 0.5;
    vib();
    Object.assign(pl, { x: 112, y: 92, dir: 'up' });
    await say('smirk', 'Вот щас и будем развиваться', 'Развитие');
    await say('angry', 'Отпусти их, уёбок');
    await say('smirk', 'Развитие требует жертв', 'Развитие');
    await say('angry', 'Да пошёл ты нахуй со своим развитием');
    // камера на Рому
    const roma = al.find(a => a.id === 'roma');
    await Promise.all([tween(st, 'camX', roma.x - 112, 0.9), tween(st, 'camY', roma.y - 70, 0.9)]);
    fight.pop('!', roma.x, roma.y - 22);
    Sfx.play.pop();
    await wait(0.8);
    await say('hurt', 'With this treasure…', 'Рома');
    await say('angry', 'Ты чо, аниме насмотрелся?! Помоги мне!');
    await say('hurt', 'I summon…', 'Рома');
    await say('facepalm', 'Вот еблан');
    await say('hurt', 'MAHORAGA!', 'Рома');
    // оранжевые пальцы рвут пространство, из портала выходит Клод
    const P0 = { x: 178, y: 60 };
    await Promise.all([tween(st, 'camX', 30, 0.8), tween(st, 'camY', -8, 0.8)]);
    st.portal = { x: P0.x, y: P0.y - 24, fingers: 0, open: 0 };
    Sfx.play.charge();
    st.shake = 0.3;
    await tween(st.portal, 'fingers', 1, 1.2);
    Sfx.play.grow();
    st.shake = 0.5;
    vib();
    await tween(st.portal, 'open', 1, 1);
    st.claude = { x: P0.x, y: P0.y, k: 0, aim: 0, snap: false };
    Sfx.play.land();
    await tween(st.claude, 'k', 1, 0.8);
    await tween(st.portal, 'open', 0, 0.6);
    st.portal = null;
    await say('normal', '#%{€~€\\£', 'Клод');
    // поза: рука к боссу, на кончиках пальцев зелёный шар с нулём
    await tween(st.claude, 'aim', 1, 0.4);
    st.orb = { x: P0.x - 54, y: P0.y - 37, r: 0 };
    Sfx.play.charge();
    await tween(st.orb, 'r', 6, 0.8);
    await say('hurt', 'Он щас умножит тебя на ноль', 'Рома');
    await say('facepalm', 'Ебанная отсылка…');
    await Promise.all([tween(st, 'camX', 0, 0.5), tween(st, 'camY', 0, 0.5)]);
    // выстрел: шар летит, босс испаряется со взрывом
    Sfx.play.zap();
    await Promise.all([tween(st.orb, 'x', bs.x, 0.55), tween(st.orb, 'y', bs.y - 22, 0.55)]);
    st.orb = null;
    st.boom = { x: bs.x, y: bs.y - 22, t: 0 };
    Sfx.play.boom();
    st.shake = 0.8;
    st.ultFlash = 0.5;
    vib();
    fight.puff(bs.x, bs.y - 22, 44, ['#4ade80', '#ffffff', '#2a0a3a', '#f2c4a4'], 170);
    fight.remove(bs);
    await tween(st.boom, 't', 1, 1.2);
    st.boom = null;
    await wait(0.6);
    // щелчок пальцами — и все дома
    st.claude.snap = true;
    await wait(0.4);
    Sfx.play.snap();
    st.ultFlash = 0.6;
    await tween(st, 'fade', 1, 0.8);
    st.claude = null;
    await homeEnding();
  }

  async function homeEnding() {
    enterArena('home', 46, 64, 'side', []);
    st.camX = st.camY = 0;
    st.heroRot = 0;
    st.npcs = [
      { def: 'roma', x: 178, y: 64, dir: 'side', face: -1 },
      { def: 'anton', x: 96, y: 84, dir: 'up', face: 1 },
      { def: 'andrey', x: 128, y: 84, dir: 'up', face: 1 },
    ];
    st.lock = true;
    await tween(st, 'fade', 0, 1);
    await say('shock', 'бля чо это было', 'Андрей');
    await say('shock', 'ЭТО БЫЛ КЛОД?!', 'Антон');
    await say('smirk', 'Не спрашивай', 'Рома');
    await say('smirk', 'Ладно. Лучший др');
    st.done.yam = 1;
    saveDone();
    st.credits = 0;
    Sfx.play.tada();
    await tween(st, 'credits', 1, 1.2);
    await wait(1.5);
    await tap();
    st.credits = 0;
    await tween(st, 'fade', 1, 0.8);
  }

  async function main() {
    st.done = await loadDone();
    await tap();
    if (!st.done.q1) await quest1();
    st.hasGuitar = true;
    st.box = false;
    const QUEST = { oka: questRoma, tower: questAnton, fnaf: questAndrey, yam: questFinal };
    for (;;) {
      const id = await openMap();
      await QUEST[id]();
    }
  }

  const nearGuitar = () => st.mode === 'room' && !st.hasGuitar && Math.hypot(pl.x - GUITAR_AT[0], pl.y - GUITAR_AT[1]) < 20;
  const BTN = { atk: () => [W - 32, H - 32, 17], act: () => [W - 30, H - 78, 14], ult: () => [W - 72, H - 24, 13], skip: () => [W - 14, 30, 8] };
  function action() {
    if (nearGuitar()) return { label: 'Взять', fn: takeGuitar };
    const u = st.untie;
    if (u && !u.done && Math.hypot(pl.x - u.x, pl.y - u.y) < 26) return { label: 'Развязать', fn: () => { u.done = true; } };
    return null;
  }
  const ultReady = () => st.mode === 'arena' && fight.S.ult >= 1 && !fight.S.piano;
  const DIRS = { down: Math.PI / 2, up: -Math.PI / 2 };
  const baseAngle = () => pl.dir === 'side' ? (pl.face > 0 ? 0 : Math.PI) : DIRS[pl.dir];

  const VOICE = { 'Артемий': 300, 'Рома': 410, 'Антон': 360, 'Андрей': 380, 'Пацан': 250, 'Жирный': 190, 'Спасатель': 280, 'Развитие': 150, 'Клод': 520 };
  function attack() {
    if (st.swing > 0) return;
    // автонаводка: в бою разворачиваемся к ближайшему врагу
    if (st.mode === 'arena') {
      const e = fight.nearest(44);
      if (e) {
        const dx = e.x - pl.x, dy = e.y - pl.y;
        if (Math.abs(dx) > Math.abs(dy)) { pl.dir = 'side'; pl.face = dx > 0 ? 1 : -1; } else pl.dir = dy < 0 ? 'up' : 'down';
      }
    }
    Sfx.play.swing();
    st.swing = 0.27;
    st.hit = false;
    st.swingId++;
  }

  function update(dt) {
    st.t += dt;
    pl.t += dt;
    pl.blinkT -= dt;
    if (pl.blinkT <= 0) { pl.blink = 0.12; pl.blinkT = 2.5 + Math.random() * 1.5; }
    pl.blink = Math.max(0, pl.blink - dt);
    if (st.stop > 0) { st.stop -= dt; return; }
    runJobs(dt);
    if (dlg) {
      const was = Math.floor(dlg.shown);
      dlg.shown = Math.min(dlg.text.length, dlg.shown + dt * 30);
      const now = Math.floor(dlg.shown);
      if (now !== was && now % 2 === 0 && /[^\s.,!?…]/.test(dlg.text[now - 1] || '')) Sfx.play.blip(VOICE[dlg.who] || 300);
    }
    // телефон вибрирует, ноутбук стучит клавишами
    if (st.mode === 'wake' && st.wake.buzz && Math.floor(st.t / 0.6) !== Math.floor((st.t - dt) / 0.6)) Sfx.play.buzz();
    if (st.icon && (st.icon.t -= dt) <= 0) st.icon = null;
    st.shake = Math.max(0, st.shake - dt);
    st.hurtFlash = Math.max(0, st.hurtFlash - dt);
    st.ultFlash = Math.max(0, st.ultFlash - dt);
    if (st.pop && (st.pop.t -= dt) <= 0) st.pop = null;
    if (st.mode === 'arena' && !dlg) fight.update(dt);
    for (const p of st.parts) { p.life -= dt; p.vy += 220 * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    st.parts = st.parts.filter(p => p.life > 0);
    if (st.swing > 0) {
      st.swing -= dt;
      const a = baseAngle(), tx = pl.x + Math.cos(a) * 12, ty = pl.y - 6 + Math.sin(a) * 10;
      if (st.mode === 'arena' && st.swing < 0.2 && st.swing > 0.04) fight.swingHit(tx, ty, st.swingId);
      if (st.mode === 'room' && !st.hit && st.swing < 0.17 && st.box && Math.hypot(tx - (BOX[0] + 7), ty - (BOX[1] + 2)) < 16) {
        st.hit = true;
        st.box = false;
        Sfx.play.crash();
        st.stop = 0.08;
        st.shake = 0.2;
        vib();
        for (let i = 0; i < 14; i++) {
          st.parts.push({ x: BOX[0] + 7, y: BOX[1] - 2, vx: (Math.random() - 0.5) * 120, vy: -Math.random() * 90 - 20, life: 0.5 + Math.random() * 0.3, col: ['#d9b273', '#b88a4a', '#c9a35c'][i % 3] });
        }
      }
    }
    let vx = 0, vy = 0, free = false;
    if (st.auto) {
      const dx = st.auto[0] - pl.x, dy = st.auto[1] - pl.y, d = Math.hypot(dx, dy);
      if (d < 1.5) st.auto = null;
      else { vx = dx / d; vy = dy / d; free = true; }
    } else if ((st.mode === 'room' || st.mode === 'arena') && !dlg && !st.lock) {
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
    if (!free) moved = true;
    const stepWas = Math.floor(pl.walkT / 0.23);
    pl.walkT += dt;
    if (Math.floor(pl.walkT / 0.23) !== stepWas) Sfx.play.step();
    if (Math.abs(vx) > Math.abs(vy) * 1.1) { pl.dir = 'side'; pl.face = vx > 0 ? 1 : -1; } else pl.dir = vy < 0 ? 'up' : 'down';
    const nx = pl.x + vx * SPEED * dt, ny = pl.y + vy * SPEED * dt;
    if (blocked(pl.x, pl.y)) free = true;
    if (free || !blocked(nx, pl.y)) pl.x = nx;
    if (free || !blocked(pl.x, ny)) pl.y = ny;
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
      // плечо — у нижнего края прямо под телефоном, рука короткая
      const sx = px + 38, sy = H + 16;
      const hx = sx + (px + 6 - sx) * w.hand, hy = sy + (py + 4 - sy) * w.hand;
      const along = (k, r, col) => cdisc(c, hx + (sx - hx) * k, hy + (sy - hy) * k, r, col);
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

  // удар всегда сверху вниз: [угол, длина гитары 0..1.3] на доле замаха q
  function swingAt(q) {
    const e = 1 - (1 - q) * (1 - q);
    if (pl.dir === 'side') return [baseAngle() + (pl.face > 0 ? 1 : -1) * (-1.1 + 2.2 * e), 1];
    // вверх/вниз: гитара над головой → об пол впереди, укорачивается к камере
    const dy = pl.dir === 'down' ? -1 + 2 * e : -1.8 + 0.9 * e, dx = 0.25;
    return [Math.atan2(dy, dx), Math.min(1.5, Math.max(0.35, Math.hypot(dx, dy)))];
  }

  function drawSwing() {
    if (st.swing <= 0) return;
    const k = 1 - st.swing / 0.27;
    const pxp = ox + Math.round(pl.x), pyp = oy + Math.round(pl.y) - 9;
    b.fillStyle = '#ffffff';
    for (let i = 1; i <= 3; i++) {
      const [a, len] = swingAt(Math.max(0, k - i * 0.08));
      b.globalAlpha = 0.5 / i;
      for (let r = 10; r < 20; r += 2) b.fillRect(Math.round(pxp + Math.cos(a) * r * len), Math.round(pyp + Math.sin(a) * r * len), 2, 2);
    }
    b.globalAlpha = 1;
    const [a, len] = swingAt(k);
    b.save();
    b.translate(pxp, pyp);
    b.rotate(a - Math.PI / 2);
    b.scale(1, len);
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
    if (dlg || st.lock || st.auto) return;
    const btn = ([x, y, r], ring, on) => {
      disc(x, y, r + 1, OUTLINE);
      b.globalAlpha = on ? 0.95 : 0.6;
      disc(x, y, r, '#2c2a40');
      b.globalAlpha = 1;
      b.fillStyle = ring;
      for (let a = 0; a < 6.28; a += 0.08) b.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 1, 1);
    };
    if (st.hasGuitar) btn(BTN.atk(), '#ffd23f', st.swing <= 0);
    if (ultReady()) btn(BTN.ult(), '#7fd0ff', true);
    if (TESTER && st.mode === 'arena') btn(BTN.skip(), '#ff8fb8', true);
    if (action()) btn(BTN.act(), '#7bd389', true);
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

  function drawArena() {
    const sh = st.shake ? Math.round((Math.random() * 2 - 1) * 2) : 0;
    ox += sh;
    const P = places[st.place];
    P.ground();
    fight.drawUnder();
    const items = [...P.props, ...fight.items(), ...st.npcs.map(n => [n.y, () => drawNpc(n)]), [pl.y, drawPlayerAll]];
    if (st.bike) items.push([st.bike.y - 0.5, drawBike]);
    items.sort((a, z) => a[0] - z[0]);
    for (const [, fn] of items) fn();
    for (const p of st.parts) R(p.x, p.y, 2, 2, p.col);
    fight.drawOver();
    drawCut();
    if (P.dark) darkness();
    drawMarker();
    drawIcon();
    ox -= sh;
    if (st.hurtFlash > 0) {
      b.globalAlpha = st.hurtFlash * 2.5;
      b.fillStyle = '#c0392b';
      b.fillRect(0, 0, W, 6); b.fillRect(0, H - 6, W, 6); b.fillRect(0, 0, 6, H); b.fillRect(W - 6, 0, 6, H);
      b.globalAlpha = 1;
    }
    if (st.ultFlash > 0) { b.globalAlpha = st.ultFlash * 2; b.fillStyle = '#ffffff'; b.fillRect(0, 0, W, H); b.globalAlpha = 1; }
    if (!st.lock) fight.hud();
    drawButtons();
    drawJoy();
  }

  // первое лицо: Артемий держит записку; удар — картинка заваливается, веки закрываются
  const fpPaper = () => [W / 2, H * 0.46 + (1 - st.fp.k) * H * 0.8 + st.fp.fall * H * 0.3];
  function drawFP() {
    const f = st.fp;
    if (st.place) drawArena();
    small.width = Math.ceil(W / 5);
    small.height = Math.ceil(H / 5);
    const s = small.getContext('2d');
    s.imageSmoothingEnabled = true;
    s.drawImage(buf, 0, 0, small.width, small.height);
    b.imageSmoothingEnabled = true;
    b.drawImage(small, 0, 0, W, H);
    b.imageSmoothingEnabled = false;
    b.fillStyle = 'rgba(0,0,0,.4)';
    b.fillRect(0, 0, W, H);
    const [cx, cy] = fpPaper();
    b.save();
    b.translate(Math.round(cx), Math.round(cy));
    b.rotate(-0.04 + f.fall * 0.7);
    b.fillStyle = 'rgba(0,0,0,.35)';
    b.fillRect(-58, -40, 120, 82);
    b.fillStyle = '#f4ecd8';
    b.fillRect(-62, -44, 120, 82);
    b.fillStyle = '#e2d6b8';
    b.fillRect(-62, -44, 120, 3);
    b.fillRect(-2, -44, 1, 82);
    // руки: рукава смокинга, ладони снизу, большие пальцы поверх бумаги
    for (const side of [-1, 1]) {
      const sx = side < 0 ? -86 : 52;
      b.fillStyle = '#949eae'; b.fillRect(sx, 30, 34, 70);
      b.fillStyle = '#6c7689'; b.fillRect(side < 0 ? sx : sx + 30, 30, 4, 70);
      b.fillStyle = '#f6f4ef'; b.fillRect(sx, 27, 34, 4);
      b.fillStyle = '#f0c4a2'; b.fillRect(side < 0 ? -80 : 46, 4, 28, 26);
      b.fillStyle = '#d6a083'; b.fillRect(side < 0 ? -58 : 46, 6, 5, 22);
      b.fillStyle = '#f0c4a2'; b.fillRect(side < 0 ? -62 : 48, -3, 14, 9);
      b.fillStyle = '#e8b090'; b.fillRect(side < 0 ? -52 : 50, -2, 4, 3);
    }
    b.restore();
    if (f.fall > 0) {
      const lid = Math.ceil(f.fall * (H / 2 + 4));
      b.fillStyle = '#000';
      b.fillRect(0, 0, W, lid);
      b.fillRect(0, H - lid, W, lid);
    }
  }

  // катсцены финала поверх сцены: щупальца тьмы, портал, Клод, шар, взрыв
  function drawCut() {
    const bs = fight.boss();
    if (st.tendrils && bs) for (const a of st.tendrils) {
      const x0 = bs.x, y0 = bs.y - 24, x1 = a.x, y1 = a.y - 10 - (a.z || 0);
      for (let i = 0; i <= 32; i++) {
        const k = i / 32, w = Math.sin(k * 12 + st.t * 10) * 3 * Math.sin(k * Math.PI);
        const x = Math.round(x0 + (x1 - x0) * k), y = Math.round(y0 + (y1 - y0) * k + w);
        R(x, y, 2, 2, '#12041c');
        R(x, y, 1, 1, '#7e22ce');
      }
    }
    if (st.portal) drawPortal(st.portal);
    if (st.claude) drawClaudeBig(st.claude);
    if (st.orb) drawOrb(st.orb);
    if (st.boom) drawBoom(st.boom);
  }

  function drawPortal(p) {
    const h = 40, X = ox + p.x, Y = oy + p.y;
    const half = y => Math.round(p.open * 16 * Math.sqrt(Math.max(0, 1 - (2 * y / h) ** 2)));
    for (let y = -h / 2; y < h / 2; y++) {
      const dx = Math.round(Math.sin(y * 0.9) * 1.5), w = half(y);
      b.fillStyle = '#d97757';
      b.fillRect(X + dx - w - 2, Y + y, w * 2 + 4, 1);
      b.fillStyle = '#05030a';
      b.fillRect(X + dx - w - 1, Y + y, w * 2 + 2, 1);
    }
    if (p.open > 0.2) for (let i = 0; i < 24; i++) {
      const a = i * 0.5 + st.t * 3, r = (i % 6) / 6 * 14 * p.open;
      b.fillStyle = i % 2 ? '#d97757' : '#f0a080';
      b.fillRect(Math.round(X + Math.cos(a) * r), Math.round(Y + Math.sin(a) * r * 1.3), 1, 1);
    }
    // пальцы вылезают из щели и тянут её края в стороны
    const len = Math.round(3 + p.fingers * 7);
    for (const s of [-1, 1]) for (let f = 0; f < 4; f++) {
      const fy = Y - 9 + f * 6, edge = X + s * (half(fy - Y) + 1), x0 = s < 0 ? edge - len : edge;
      b.fillStyle = OUTLINE; b.fillRect(x0 - 1, fy - 1, len + 2, 5);
      b.fillStyle = '#d97757'; b.fillRect(x0, fy, len, 3);
      b.fillStyle = '#f0a080'; b.fillRect(s < 0 ? x0 : x0 + len - 2, fy, 2, 2);
    }
  }

  // Клод-Махорага: рельефный торс, вместо головы — иконка-звёздочка; поза — рука вперёд, как на референсе
  function drawClaudeBig(c) {
    const x = Math.round(c.x), y = Math.round(c.y), skin = '#e8a07a', shade = '#c8785a', dark = '#a85e44';
    b.globalAlpha = 0.3 * c.k;
    R(x - 11, y - 1, 22, 3, '#000');
    b.globalAlpha = c.k;
    R(x - 8, y - 16, 7, 16, OUTLINE); R(x + 1, y - 16, 7, 16, OUTLINE);
    R(x - 7, y - 15, 5, 13, '#1e1e24'); R(x + 2, y - 15, 5, 13, '#1e1e24');
    R(x - 8, y - 2, 7, 2, '#0e0e12'); R(x + 1, y - 2, 7, 2, '#0e0e12');
    R(x - 9, y - 18, 18, 3, '#3a2416');
    for (let j = 0; j < 24; j++) {
      const yy = y - 18 - j, half = Math.round(7 + j * 0.5);
      R(x - half - 1, yy, half * 2 + 2, 1, OUTLINE);
      R(x - half, yy, half * 2, 1, skin);
      R(x + half - 3, yy, 3, 1, shade);
    }
    R(x - 12, y - 33, 10, 1, dark); R(x + 2, y - 33, 10, 1, dark);
    R(x, y - 40, 1, 22, shade);
    for (const yy of [y - 29, y - 25, y - 21]) { R(x - 6, yy, 5, 1, shade); R(x + 2, yy, 5, 1, shade); }
    for (const s of [-1, 1]) { disc(ox + x + s * 18, oy + y - 38, 6, OUTLINE); disc(ox + x + s * 18, oy + y - 38, 5, skin); }
    disc(ox + x + 19, oy + y - 37, 3, shade);
    // правая рука согнута, кулак у плеча; на щелчке — искра
    disc(ox + x + 22, oy + y - 30, 5, OUTLINE); disc(ox + x + 22, oy + y - 30, 4, skin);
    disc(ox + x + 24, oy + y - 41, 4, OUTLINE); disc(ox + x + 24, oy + y - 41, 3, skin);
    if (c.snap) for (let i = 0; i < 6; i++) { const a = i * 1.05 + st.t * 8; R(Math.round(x + 27 + Math.cos(a) * 5), Math.round(y - 46 + Math.sin(a) * 5), 1, 1, '#ffffff'); }
    // левая рука: висит, в позе — вытянута к боссу, два пальца вперёд
    const ax = Math.round(x - 20 - c.aim * 22), ay = Math.round(y - 21 - c.aim * 16);
    for (const [w, col] of [[7, OUTLINE], [5, skin]]) for (let i = 0; i <= 12; i++) {
      const px = Math.round(x - 18 + (ax - x + 18) * i / 12), py = Math.round(y - 37 + (ay - y + 37) * i / 12);
      R(px - (w >> 1), py - (w >> 1), w, w, col);
    }
    disc(ox + Math.round(x - 24 - c.aim * 6), oy + Math.round(y - 37 + (1 - c.aim) * 5), 4, skin);
    if (c.aim > 0.5) {
      R(ax - 10, ay - 4, 9, 7, OUTLINE);
      R(ax - 9, ay - 3, 8, 2, skin); R(ax - 9, ay + 1, 8, 1, skin);
      R(ax - 3, ay - 3, 4, 5, skin);
    }
    R(x - 3, y - 45, 6, 3, skin);
    const hx = ox + x, hy = oy + y - 52;
    for (const [w, col] of [[3, OUTLINE], [2, '#d97757']]) for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6 + 0.2, len = i % 2 ? 9 : 12;
      for (let r = 3; r <= len; r++) { b.fillStyle = r > len - 2 && w === 2 ? '#f0a080' : col; b.fillRect(Math.round(hx + Math.cos(a) * r) - (w >> 1), Math.round(hy + Math.sin(a) * r) - (w >> 1), w, w); }
    }
    disc(hx, hy, 5, '#d97757');
    b.globalAlpha = 1;
  }

  // зелёный шар с нулём внутри, блики и искрящееся кольцо
  function drawOrb(o) {
    if (o.r < 0.5) return;
    const X = ox + o.x, Y = oy + o.y, r = o.r;
    b.globalAlpha = 0.25; disc(X, Y, Math.round(r * 2.8), '#4ade80');
    b.globalAlpha = 0.5; disc(X, Y, Math.round(r * 1.7), '#86efac');
    b.globalAlpha = 0.8;
    b.fillStyle = '#dcfce7';
    b.fillRect(Math.round(X - r * 4), Y, Math.round(r * 8), 1);
    b.fillRect(X, Math.round(Y - r * 2.5), 1, Math.round(r * 5));
    for (let i = -r * 3; i <= r * 3; i++) { b.fillRect(Math.round(X + i), Math.round(Y + i * 0.6), 1, 1); b.fillRect(Math.round(X + i), Math.round(Y - i * 0.6), 1, 1); }
    b.globalAlpha = 1;
    disc(X, Y, Math.round(r), '#22c55e');
    disc(X - Math.round(r * 0.25), Y - Math.round(r * 0.25), Math.max(1, Math.round(r * 0.6)), '#bbf7d0');
    b.fillStyle = '#14532d';
    for (let a = 0; a < 6.28; a += 0.3) b.fillRect(Math.round(X + Math.cos(a) * r * 0.42), Math.round(Y + Math.sin(a) * r * 0.62), 1, 1);
    b.fillStyle = '#ffffff';
    for (let i = 0; i < 26; i++) {
      const a = i / 26 * 6.28 + st.t * 2;
      if (i % 3) b.fillRect(Math.round(X + Math.cos(a) * r * 2.4), Math.round(Y + Math.sin(a) * r * 2.4), 1, 1);
    }
  }

  function drawBoom(o) {
    const X = ox + o.x, Y = oy + o.y, t = o.t;
    b.globalAlpha = Math.max(0, 1 - t * 1.4);
    disc(X, Y, Math.round(10 + t * 50), '#ffffff');
    b.globalAlpha = Math.max(0, 1 - t);
    for (const [k, col] of [[1, '#4ade80'], [0.7, '#bbf7d0'], [0.45, '#2a0a3a']]) {
      const rr = t * 100 * k;
      b.fillStyle = col;
      for (let a = 0; a < 6.28; a += 1.5 / Math.max(8, rr)) b.fillRect(Math.round(X + Math.cos(a) * rr), Math.round(Y + Math.sin(a) * rr * 0.7), 2, 2);
    }
    b.globalAlpha = 1;
  }

  function drawBike() {
    const bk = st.bike, x = Math.round(bk.ride ? pl.x : bk.x), y = Math.round(bk.y);
    if (bk.lie) {
      R(x - 10, y - 3, 21, 4, OUTLINE); R(x - 9, y - 2, 19, 2, '#c0392b');
      disc(ox + x - 8, oy + y, 3, OUTLINE); disc(ox + x + 8, oy + y - 1, 3, OUTLINE);
      return;
    }
    for (const dx of [-7, 7]) { disc(ox + x + dx, oy + y - 4, 4, OUTLINE); disc(ox + x + dx, oy + y - 4, 3, '#3a3a40'); disc(ox + x + dx, oy + y - 4, 1, '#9aa0a8'); }
    R(x - 7, y - 9, 14, 2, '#c0392b'); R(x - 2, y - 8, 2, 5, '#c0392b');
    R(x + 5, y - 13, 2, 5, OUTLINE); R(x + 3, y - 13, 5, 1, OUTLINE); R(x - 5, y - 11, 5, 2, OUTLINE);
  }

  // темнота пиццерии: свет вокруг героя и друзей, глаза аниматроников светятся
  const dk = document.createElement('canvas'), dkx = dk.getContext('2d');
  function darkness() {
    dk.width = W; dk.height = H;
    dkx.fillStyle = 'rgba(4,2,8,0.9)';
    dkx.fillRect(0, 0, W, H);
    dkx.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r) => {
      const gr = dkx.createRadialGradient(x, y, r * 0.25, x, y, r);
      gr.addColorStop(0, 'rgba(0,0,0,1)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      dkx.fillStyle = gr;
      dkx.fillRect(x - r, y - r, r * 2, r * 2);
    };
    hole(ox + pl.x, oy + pl.y - 10, 78);
    for (const a of fight.allies()) hole(ox + a.x, oy + a.y - 10, 40);
    dkx.globalCompositeOperation = 'source-over';
    b.drawImage(dk, 0, 0);
    fight.drawEyes();
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
    b.drawImage(Portrait.render(dlg.emo, talking, PID[dlg.who]), x0 + 4, y0 + h - 4 - Portrait.H);
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
      // раскладка от высоты: на низком экране кнопка не наезжает на текст
      const r = Math.min(17, h * 0.11), avY = y0 + Math.max(r + 6, h * 0.27), nameY = avY + r + 15, subY = nameY + 11;
      const btnY = Math.min(y0 + h - 11, Math.max(subY + 20, y0 + h - 22));
      circle(x0 + w / 2, avY, r, AVA[p.title]);
      text(p.title[0], x0 + w / 2, avY + r * 0.35, r * 0.88, '#fff', 'center');
      text(p.title, x0 + w / 2, nameY, 9, '#fff', 'center');
      text(p.sub, x0 + w / 2, subY, 6, p.fail ? '#ff6b6b' : '#c8d6e5', 'center', 600);
      circle(x0 + w / 2, btnY, 9, '#e5484d');
      text('✕', x0 + w / 2, btnY + 3.5, 9, '#fff', 'center');
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
      text(st.done.q1 ? 'Глава 2 · Спасение' : 'Глава 1 · Осознание', W / 2, H / 2 + 6, 7, '#f4f1ea', 'center', 700);
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
    if (st.mode === 'map') drawMapUI();
    if (st.mode === 'fpnote' && !st.fp.fall) {
      const [cx, cy] = fpPaper(), L = ['Думали, это всё?', 'Обернись.'], n = Math.floor(st.fp.text * (L[0].length + L[1].length));
      text(L[0].slice(0, n), cx - 2, cy - 16, 9, '#3a2a22', 'center', 700);
      text(L[1].slice(0, Math.max(0, n - L[0].length)), cx - 2, cy + 4, 11, '#a8141e', 'center', 900);
    }
    if (st.mode === 'card') {
      g.globalAlpha = st.cardA;
      text(st.card.title, W / 2, H / 2 - 2, 16, '#ffd23f', 'center', 900);
      text(st.card.sub, W / 2, H / 2 + 12, 6.5, '#f4f1ea', 'center', 700);
      g.globalAlpha = 1;
    }
    if (st.mode === 'arena' && TESTER && !st.lock && !dlg) { const [x, y] = BTN.skip(); text('⏭', x, y + 2.5, 7, '#ff8fb8', 'center', 900); }
    if (st.mode === 'arena') {
      for (const [str, x, y, size, col] of places[st.place].signs) text(str, ox + x, oy + y, size, col, 'center', 900);
      if (st.pop) text(st.pop.text, ox + st.pop.x, oy + st.pop.y - (0.9 - st.pop.t) * 10, 9, '#ffd23f', 'center', 900);
      for (const q of fight.pops()) {
        g.globalAlpha = Math.min(1, q.t * 2);
        text(q.text, ox + q.x, oy + q.y, q.text.length > 2 ? 6.5 : 12, q.text === '!' ? '#ffffff' : '#ffd23f', 'center', 900);
        g.globalAlpha = 1;
      }
      // умные слова босса: летящие с уроном — на тёмной плашке, касты — просто текстом
      for (const sh of fight.words()) {
        g.font = `900 ${4.5 * scale}px ${FONT}`;
        const tw = g.measureText(sh.text).width / scale + 4;
        if (sh.fx) { g.globalAlpha = Math.min(1, sh.life); text(sh.text, ox + sh.x, oy + sh.y + 1.5, 4.5, '#d8b4fe', 'center', 900); g.globalAlpha = 1; continue; }
        rr(ox + sh.x - tw / 2, oy + sh.y - 4, tw, 7, 2, 'rgba(40,10,60,.9)');
        text(sh.text, ox + sh.x, oy + sh.y + 1.5, 4.5, '#f5d0fe', 'center', 900);
      }
      const bs = fight.boss();
      if (bs && bs.state !== 'enter' && !st.lock) {
        const k = Math.max(0, bs.hp / bs.max), bw = Math.min(160, W - 140), dark = bs.dark > 0.5;
        rr(W / 2 - bw / 2 - 2, 5, bw + 4, 13, 3, 'rgba(20,18,32,.85)');
        rect(W / 2 - bw / 2, 13, bw, 3, '#4a1a1e');
        rect(W / 2 - bw / 2, 13, bw * k, 3, dark ? '#a855f7' : '#e74c3c');
        text(dark ? 'ТЁМНОЕ РАЗВИТИЕ' : 'РАЗВИТИЕ', W / 2, 11.5, 5.5, dark ? '#e9d5ff' : '#ffd23f', 'center', 900);
      }
      if (st.credits > 0) {
        g.fillStyle = `rgba(10,8,16,${0.7 * st.credits})`;
        g.fillRect(0, 0, cv.width, cv.height);
        g.globalAlpha = st.credits;
        text('С ДНЁМ РОЖДЕНИЯ,', W / 2, H / 2 - 24, 12, '#ffd23f', 'center', 900);
        text('АРТЕМИЙ!', W / 2, H / 2 - 8, 16, '#ffd23f', 'center', 900);
        text('16 лет · от Ромы, Андрея и Антона', W / 2, H / 2 + 10, 6.5, '#f4f1ea', 'center', 700);
        if (Math.floor(st.t * 2) % 2) text('тапни, чтобы вернуться на карту', W / 2, H - 14, 5.5, '#9a96a8', 'center', 700);
        g.globalAlpha = 1;
      }
    }
    if (st.mode === 'end') {
      text('Продолжение следует…', W / 2, H / 2 - 2, 11, '#f4f1ea', 'center', 800);
      text('Квест 1 · Осознание пройден', W / 2, H / 2 + 12, 6, '#9a96a8', 'center', 700);
    }
    if ((st.mode === 'room' || st.mode === 'arena') && !dlg) {
      if (st.task) {
        g.font = `800 ${6.5 * scale}px ${FONT}`;
        const tw = g.measureText('Задание: ' + st.task).width / scale + 14;
        // в бою вывески на стене сверху по центру, поэтому задание справа
        const cx = st.mode === 'arena' ? W - tw / 2 - 6 : W / 2;
        rr(cx - tw / 2, 4, tw, 12, 4, 'rgba(20,18,32,.82)');
        text('Задание: ' + st.task, cx, 12.3, 6.5, '#ffd23f', 'center', 800);
      }
      const shown = !st.lock && !st.auto;
      if (st.hasGuitar && shown) { const [x, y] = BTN.atk(); text('Удар', x, y + 2.5, 6, '#ffd23f', 'center', 900); }
      if (ultReady() && shown) { const [x, y] = BTN.ult(); text('Ульта', x, y + 2, 5, '#7fd0ff', 'center', 900); }
      const act = shown && action();
      if (act) { const [x, y] = BTN.act(); text(act.label, x, y + 2, act.label.length > 6 ? 4.2 : 5, '#7bd389', 'center', 900); }
      if (!moved && shown && (st.mode === 'room' || !fight.foes().length)) text('Веди пальцем слева, чтобы идти', W / 2, H - 8, 6.5, 'rgba(255,255,255,.85)', 'center', 800);
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
    if (st.deadMsg) {
      text('Тебя вырубили', W / 2, H / 2 - 2, 11, '#e74c3c', 'center', 900);
      text('ещё раз', W / 2, H / 2 + 12, 6.5, '#9a96a8', 'center', 700);
    }
  }

  function draw() {
    // камера катсцен сдвигает всю сцену
    const cx = Math.round(st.camX), cy = Math.round(st.camY);
    ox -= cx;
    oy -= cy;
    b.fillStyle = '#000';
    b.fillRect(0, 0, W, H);
    if (st.mode === 'fpnote') drawFP();
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
    if (st.mode === 'arena') drawArena();
    if (st.mode === 'map') drawMap();
    drawDialogBox();
    g.drawImage(buf, 0, 0, W * scale, H * scale);
    drawOverlayText();
    ox += cx;
    oy += cy;
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  const toBuf = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / scale, (e.clientY - r.top) / scale]; };
  let full = false;
  function goFull() {
    if (full) return;
    full = true;
    const tg = window.Telegram && Telegram.WebApp;
    if (tg && tg.initData && tg.isVersionAtLeast('8.0')) { tg.requestFullscreen(); tg.lockOrientation(); return; }
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().then(() => screen.orientation.lock('landscape')).catch(() => {});
  }

  const takeGuitar = () => { st.hasGuitar = true; vib(); Sfx.play.strum(); };

  function onDown(e) {
    if (e.pointerType === 'touch') goFull();
    Sfx.unlock();
    if (tapWait) { const r = tapWait; tapWait = null; r(); return; }
    if (dlg) {
      if (dlg.shown < dlg.text.length) dlg.shown = dlg.text.length;
      else { const r = dlg.r; dlg = null; r(); }
      return;
    }
    if (st.mode === 'map' && e.pointerType !== 'key') return mapTap(...toBuf(e));
    if ((st.mode !== 'room' && st.mode !== 'arena') || st.lock || st.auto || e.pointerType === 'key') return;
    const [x, y] = toBuf(e);
    const hitBtn = ([bx, by, r]) => Math.hypot(x - bx, y - by) < r + 6;
    if (st.hasGuitar && hitBtn(BTN.atk())) return attack();
    if (ultReady() && hitBtn(BTN.ult())) return fight.ult();
    if (TESTER && st.mode === 'arena' && hitBtn(BTN.skip())) { st.skip = true; return; }
    const act = action();
    if (act && hitBtn(BTN.act())) return act.fn();
    if (x < W * 0.55 && !joy) { joy = { id: e.pointerId, sx: x, sy: y, x, y }; cv.setPointerCapture(e.pointerId); }
  }

  function init() {
    const tg = window.Telegram && Telegram.WebApp;
    if (tg && tg.initData) {
      tg.ready();
      tg.expand();
      if (tg.isVersionAtLeast('7.7')) tg.disableVerticalSwipes();
      if (tg.isVersionAtLeast('6.1')) {
        tg.BackButton.show();
        tg.BackButton.onClick(() => { location.href = 'index.html'; });
      }
    }
    resize();
    // холст сжимается под безопасную зону Telegram (кнопки «Назад», «⋯» в полноэкранном режиме)
    new ResizeObserver(resize).observe(cv);
    cv.addEventListener('pointerdown', onDown);
    document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
    cv.addEventListener('pointermove', e => { if (joy && e.pointerId === joy.id) [joy.x, joy.y] = toBuf(e); });
    const end = e => { if (joy && e.pointerId === joy.id) joy = null; };
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);
    // с клавиатуры: пробел — тап, J — удар, K — ульта, E — взять/развязать
    addEventListener('keydown', e => {
      keys.add(e.code);
      if (e.code === 'Space') onDown({ pointerType: 'key', clientX: 0, clientY: 0 });
      if ((st.mode !== 'room' && st.mode !== 'arena') || dlg || st.lock || st.auto) return;
      if (e.code === 'KeyJ' && st.hasGuitar) attack();
      if (e.code === 'KeyK' && ultReady()) fight.ult();
      if (e.code === 'KeyE' && action()) action().fn();
    });
    addEventListener('keyup', e => keys.delete(e.code));
    requestAnimationFrame(loop);
    main();
  }

  init();
})();
