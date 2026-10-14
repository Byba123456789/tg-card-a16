const Portrait = (() => {
  const PAL = {
    k: '#1a1620',
    1: '#4e3d2c', 2: '#6e5840', 3: '#937a5a', 4: '#b59c76', 5: '#d6c29c',
    a: '#fbe0c8', S: '#f2cdb0', s: '#dcab8e', t: '#bf8a72', r: '#eba595',
    w: '#ffffff', e: '#9cb6cc', E: '#3e5670', l: '#5a3f34', b: '#3a2a1c',
    m: '#a65a52', M: '#6e3434', T: '#fbf7f0',
    J: '#949eae', j: '#b4bdcb', q: '#6c7689', Q: '#4c5466', W: '#f6f4ef', x: '#d3d7de', B: '#141418',
  };
  const PW = 40, PH = 46, CX = 19.5;

  const EYES = {
    normal: ['.lllll.', 'lwEEewl', '.wEeEw.', '..sss..'],
    sleepy: ['.......', '.......', 'lllllll', '.wEEew.'],
    closed: ['.......', '.......', '.lllll.', '..sss..'],
    narrow: ['.......', '.lllll.', 'lwEEewl', '..sss..'],
    shock: ['lllllll', 'wwwwwww', 'wwwEwww', '.wwwww.'],
    up: ['.lllll.', 'lwEEEwl', '.wwwww.', '..sss..'],
    side: ['.lllll.', 'lwwwEEl', '.wwwwe.', '..sss..'],
  };
  const BROWS = {
    normal: ['.bbbbbb', '.......'],
    low: ['.......', '.bbbbb.'],
    high: ['.bbbbb.', 'b.....b'],
    angry: ['bb.....', '.bbbbbb'],
  };
  const MOUTHS = {
    flat: ['..........', '...mmmm...', '..........', '..........'],
    small: ['..........', '....mm....', '..........', '..........'],
    talk: ['...mmmm...', '...mMMm...', '....mm....', '..........'],
    O: ['...mmmm...', '..mMMMMm..', '..mMMMMm..', '...mmmm...'],
    clench: ['..mmmmmm..', '..mTTTTm..', '..mmmmmm..', '..........'],
    yell: ['..mmmmmm..', '..mTTTTm..', '..mMMMMm..', '...mmmm...'],
    smirk: ['........m.', '..mmmmmm..', '..........', '..........'],
    pout: ['..........', '.....mmm..', '..........', '..........'],
    frown: ['..........', '...mmmm...', '..m....m..', '..........'],
  };
  // эмоция: глаза (левый, правый), брови (левая, правая, сдвиг), рот, рот при речи
  const EMO = {
    sleepy: { eyes: ['sleepy', 'sleepy'], brows: ['low', 'low'], mouth: 'small', talk: 'talk' },
    normal: { eyes: ['normal', 'normal'], brows: ['normal', 'normal'], mouth: 'flat', talk: 'talk' },
    shock: { eyes: ['shock', 'shock'], brows: ['high', 'high'], browUp: 2, mouth: 'O', talk: 'O' },
    angry: { eyes: ['narrow', 'narrow'], brows: ['angry', 'angry'], mouth: 'clench', talk: 'yell' },
    smirk: { eyes: ['normal', 'narrow'], brows: ['normal', 'high'], mouth: 'smirk', talk: 'smirk' },
    think: { eyes: ['side', 'side'], same: true, brows: ['normal', 'high'], mouth: 'pout', talk: 'talk' },
    roll: { eyes: ['up', 'up'], brows: ['high', 'high'], mouth: 'frown', talk: 'talk' },
    facepalm: { eyes: ['closed', 'closed'], brows: ['low', 'low'], mouth: 'frown', talk: 'talk', hand: true },
  };

  const rnd = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const mirror = rows => rows.map(r => [...r].reverse().join(''));

  // база: смокинг, шея, лицо, уши, чёлка прядями, как на фото
  function base() {
    const G = Array.from({ length: PH }, () => Array(PW).fill(null));
    const set = (x, y, c) => { if (x >= 0 && x < PW && y >= 0 && y < PH) G[y][x] = c; };
    for (let y = 30; y < 39; y++) for (let x = 15; x < 25; x++) set(x, y, y < 33 ? 't' : 's');
    for (let y = 36; y < PH; y++) {
      const half = Math.min(19, 8 + (y - 36) * 2);
      for (let x = Math.ceil(CX - half); x <= CX + half; x++) set(x, y, x < CX - half + 3 ? 'j' : x > CX + half - 4 ? 'q' : 'J');
      const v = Math.max(1, Math.floor((y - 36) * 0.6) + 1);
      for (let x = Math.ceil(CX - v); x <= CX + v; x++) set(x, y, Math.abs(x - CX) > v - 1 ? 'x' : 'W');
      set(Math.ceil(CX - v) - 1, y, 'Q');
      set(Math.floor(CX + v) + 1, y, 'Q');
    }
    for (const [x, y] of [[16, 37], [17, 37], [17, 38], [18, 38], [19, 38], [20, 38], [21, 38], [22, 37], [23, 37], [16, 38], [23, 38], [16, 39], [17, 39], [22, 39], [23, 39]]) set(x, y, 'B');
    for (let y = 8; y < 35; y++) {
      for (let x = 0; x < PW; x++) {
        const dx = (x - CX) / 11.5, dy = (y - 21) / 12.5;
        const d = dx * dx + dy * dy;
        if (d > 1) continue;
        let c = 'S';
        if (dx > 0.55 || (dy > 0.7 && Math.abs(dx) > 0.35)) c = 's';
        if (d > 0.82 && (dx > 0.2 || dy > 0.6)) c = 't';
        if (dx < -0.45 && dx > -0.75 && dy > -0.1 && dy < 0.35) c = 'a';
        set(x, y, c);
      }
    }
    for (let y = 20; y < 26; y++) { set(7, y, y > 21 && y < 25 ? 's' : 'S'); set(8, y, 'S'); set(31, y, 's'); set(32, y, y > 21 && y < 25 ? 't' : 's'); }
    set(20, 24, 's'); set(20, 25, 's'); set(19, 26, 's'); set(20, 26, 't'); set(21, 26, 's'); set(18, 25, 'a');
    for (const x of [12, 13, 26, 27]) set(x, 26, 'r');
    // волосы: шапка + чёлка прядями до бровей, отдельные пряди падают на глаза
    // пряди идут наискосок (чёлка зачёсана вбок), у каждой свой кончик; свет сверху слева
    const TIPS = [18, 16, 20, 17, 21, 16, 19, 22, 17, 20, 16, 19, 21, 17];
    for (let y = 0; y < 28; y++) {
      for (let x = 0; x < PW; x++) {
        const dx = (x - CX) / 15.5, dy = (y - 12.5) / 12;
        const tuft = y < 3 && rnd(x * 3) > 0.55 && Math.abs(x - CX) < 9;
        if (dx * dx + dy * dy > 1 && !tuft) continue;
        const sx = x + y * 0.45, id = Math.floor(sx / 4), inS = sx - id * 4;
        let end = TIPS[((id % TIPS.length) + TIPS.length) % TIPS.length];
        if (inS < 1 || inS > 3) end -= 1;
        if (inS > 3.4) end -= 1;
        if (x < 9 || x > 30) end = 24 + (id % 3);
        else if (x < 11 || x > 28) end = 20 + (id % 2);
        if (y > end) continue;
        let c = inS < 1 ? '2' : '3';
        if (y >= end - 1) c = '2';
        const hl = Math.abs(Math.hypot(x - 15, y - 13) - 9);
        if (hl < 1.2 && y < 11 && inS >= 1) c = '5';
        else if (hl < 2.6 && y < 13 && inS >= 1) c = '4';
        if (x > 26 && y > 4 && c !== '2') c = inS < 1.5 ? '1' : '2';
        set(x, y, c);
      }
    }
    return { G, set };
  }

  function overlay(set, rows, x0, y0) {
    rows.forEach((row, y) => [...row].forEach((c, x) => { if (c !== '.') set(x0 + x, y0 + y, c); }));
  }

  const cache = new Map();
  function render(emo, talking) {
    const key = emo + talking;
    if (cache.has(key)) return cache.get(key);
    const e = EMO[emo] || EMO.normal;
    const { G, set } = base();
    const eyeR = e.same ? EYES[e.eyes[1]] : mirror(EYES[e.eyes[1]]);
    const up = e.browUp || 0;
    overlay(set, EYES[e.eyes[0]], 11, 19 - (e.eyes[0] === 'shock' ? 1 : 0));
    overlay(set, eyeR, 22, 19 - (e.eyes[1] === 'shock' ? 1 : 0));
    overlay(set, BROWS[e.brows[0]], 11, 16 - up);
    overlay(set, mirror(BROWS[e.brows[1]]), 22, 16 - up - (e.brows[1] === 'high' && e.brows[0] !== 'high' ? 1 : 0));
    overlay(set, MOUTHS[talking ? e.talk : e.mouth], 15, 28);
    // facepalm: ладонь на глазах, четыре пальца веером вверх, запястье уходит вниз вправо в рукав
    if (e.hand) {
      for (let f = 0; f < 4; f++) {
        const x0 = 10 + f * 4, top = 13 + Math.abs(f - 1.5) * 1.5;
        for (let y = Math.round(top); y < 21; y++) for (let x = x0; x < x0 + 3; x++) set(x, y, x === x0 + 2 ? 's' : y === Math.round(top) ? 'a' : 'S');
      }
      for (let y = 21; y < 27; y++) for (let x = 10 + (y - 21); x < 29; x++) set(x, y, x === 28 ? 's' : 'S');
      for (let y = 27; y < 46; y++) for (let x = 20 + Math.floor((y - 27) * 0.6); x < 30 + Math.floor((y - 27) * 0.4); x++) set(x, y, y < 33 ? (x > 26 ? 's' : 'S') : x > 28 ? 'q' : 'J');
    }
    const c = document.createElement('canvas');
    c.width = PW + 2; c.height = PH + 2;
    const g = c.getContext('2d');
    // обводка силуэта, потом сам рисунок
    g.fillStyle = PAL.k;
    for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
      if (!G[y][x]) continue;
      g.fillRect(x, y + 1, 3, 1);
      g.fillRect(x + 1, y, 1, 3);
    }
    for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
      const v = G[y][x];
      if (!v) continue;
      g.fillStyle = PAL[v];
      g.fillRect(x + 1, y + 1, 1, 1);
    }
    cache.set(key, c);
    return c;
  }

  return { render, W: PW + 2, H: PH + 2 };
})();
