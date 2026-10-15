const Portrait = (() => {
  const PAL = {
    k: '#1a1620',
    1: '#4e3d2c', 2: '#6e5840', 3: '#937a5a', 4: '#b59c76', 5: '#d6c29c',
    a: '#fbe0c8', S: '#f2cdb0', s: '#dcab8e', t: '#bf8a72', r: '#eba595',
    w: '#ffffff', e: '#9cb6cc', E: '#3e5670', l: '#5a3f34', b: '#3a2a1c',
    m: '#a65a52', M: '#6e3434', T: '#fbf7f0',
    6: '#8a6a3a', 7: '#b08d55', 8: '#d2b27a', 9: '#ecd6a2', Z: '#ead7b8', z: '#c9a585', Y: '#b89878',
    F: '#3d3d47', f: '#2b2b33', G: '#1c1c22', N: '#a9a9ad', n: '#86868c',
    U: '#34343c', u: '#26262c', V: '#16161a', C: '#1e1e24', K: '#33333c', O: '#0e0e12',
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

  // кто: лицо (ширина/высота), одежда, волосы, уши, цвет глаз
  const WHO = {
    artemiy: { rx: 11.5, ry: 12.5, outfit: 'tux', hair: 'bangs' },
    roma: { rx: 11.5, ry: 12.5, outfit: 'jacket', hair: 'back', ears: true, pal: { E: '#5f6f5a', e: '#a9b8a2' } },
    gop: { rx: 11.5, ry: 12.5, outfit: 'track', hair: 'cap', pal: { E: '#4a3a2a', e: '#8a7460', b: '#2a1e14', l: '#3a2a1c' } },
    fat: { rx: 13.8, ry: 12.5, outfit: 'track', hair: 'buzz', chin: true, pal: { E: '#3e3226', e: '#7a6650', b: '#1c140e', l: '#2e2218' } },
    anton: { rx: 12, ry: 12.5, outfit: 'tee', hair: 'bangs', tips: 3, hairMap: { 1: '6', 2: '6', 3: '7', 4: '8', 5: '9' },
      pal: { E: '#5f7f96', e: '#a8c0d0', b: '#9a875e', U: '#6a3ed8', u: '#5b2fc9', V: '#3f1f96' } },
    andrey: { rx: 11.5, ry: 12.5, outfit: 'shirt', hair: 'back', hairMap: { 6: '3', 7: '4', 8: '5', 9: '5' },
      pal: { E: '#4a6a8a', e: '#9ab4cc', b: '#3a2a1c', U: '#2a2a33', u: '#1c1c22', V: '#101014' } },
    boss: { rx: 17, ry: 14.5, outfit: 'track', hair: 'buzz', veins: true, pal: { E: '#2a1a14', e: '#ffffff', b: '#1c140e', l: '#2e2218', S: '#f2c4a4', s: '#dca487', t: '#c08870', a: '#fbd8bc' } },
  };

  const SLEEVE = { tux: ['J', 'q'], jacket: ['f', 'G'], track: ['u', 'V'], tee: ['u', 'V'], shirt: ['u', 'V'] };

  function outfit(set, who) {
    const kind = WHO[who].outfit;
    for (let y = 30; y < 39; y++) for (let x = 15; x < 25; x++) set(x, y, y < 33 ? 't' : 's');
    for (let y = 36; y < PH; y++) {
      const half = Math.min(19, 8 + (y - 36) * 2);
      for (let x = Math.ceil(CX - half); x <= CX + half; x++) {
        const edge = x < CX - half + 3 ? 0 : x > CX + half - 4 ? 2 : 1;
        if (kind === 'tux') set(x, y, ['j', 'J', 'q'][edge]);
        else if (kind === 'jacket') set(x, y, ['F', 'f', 'G'][edge]);
        else set(x, y, ['U', 'u', 'V'][edge]);
      }
      if (kind === 'tux') {
        const v = Math.max(1, Math.floor((y - 36) * 0.6) + 1);
        for (let x = Math.ceil(CX - v); x <= CX + v; x++) set(x, y, Math.abs(x - CX) > v - 1 ? 'x' : 'W');
        set(Math.ceil(CX - v) - 1, y, 'Q');
        set(Math.floor(CX + v) + 1, y, 'Q');
      } else if (kind === 'jacket') {
        // серый капюшон худи: воротник вокруг шеи и полоса по центру
        const v = Math.max(2, Math.floor((y - 36) * 0.5) + 2);
        for (let x = Math.ceil(CX - v); x <= CX + v; x++) set(x, y, Math.abs(x - CX) > v - 1.5 ? 'n' : 'N');
        if (y < 40) for (let x = 12; x < 28; x++) if (Math.abs(x - CX) > 4) set(x, y, y === 36 ? 'N' : 'n');
      } else if (kind === 'tee' || kind === 'shirt') {
        // футболка: круглый ворот; рубашка: серый принт точками
        if (y === 36) for (let x = 14; x < 26; x++) set(x, y, 'V');
        if (kind === 'shirt') for (let x = 2; x < PW - 2; x++) if ((x * 3 + y * 5) % 9 === 0 && y > 37) set(x, y, 'n');
      } else {
        // олимпийка: молния по центру, белые полосы по плечам
        set(Math.round(CX), y, 'T');
        const sx = Math.round(CX - 6 - (y - 36) * 1.3), ex = Math.round(CX + 6 + (y - 36) * 1.3);
        for (const x0 of [sx, ex]) for (let dx = 0; dx < 2; dx++) set(x0 + (x0 < CX ? -dx : dx), y, 'T');
      }
    }
    if (kind === 'tux') for (const [x, y] of [[16, 37], [17, 37], [17, 38], [18, 38], [19, 38], [20, 38], [21, 38], [22, 37], [23, 37], [16, 38], [23, 38], [16, 39], [17, 39], [22, 39], [23, 39]]) set(x, y, 'B');
  }

  function face(set, who) {
    const w = WHO[who];
    for (let y = 8; y < 35 + (w.chin ? 2 : 0); y++) {
      for (let x = 0; x < PW; x++) {
        const dx = (x - CX) / w.rx, dy = (y - 21) / w.ry;
        const d = dx * dx + dy * dy;
        if (d > 1 && !(w.chin && y >= 31 && Math.abs(x - CX) < 9 - (y - 31))) continue;
        let c = 'S';
        if (dx > 0.55 || (dy > 0.7 && Math.abs(dx) > 0.35)) c = 's';
        if (d > 0.82 && (dx > 0.2 || dy > 0.6)) c = 't';
        if (dx < -0.45 && dx > -0.75 && dy > -0.1 && dy < 0.35) c = 'a';
        if (w.chin && y >= 33) c = y === 33 ? 't' : 's';
        set(x, y, c);
      }
    }
    const L = Math.round(CX - w.rx - 1), Rr = Math.round(CX + w.rx);
    for (let y = 20; y < 26; y++) { set(L, y, y > 21 && y < 25 ? 's' : 'S'); set(L + 1, y, 'S'); set(Rr, y, 's'); set(Rr + 1, y, y > 21 && y < 25 ? 't' : 's'); }
    set(20, 24, 's'); set(20, 25, 's'); set(19, 26, 's'); set(20, 26, 't'); set(21, 26, 's'); set(18, 25, 'a');
    for (const x of w.chin ? [10, 11, 12, 27, 28, 29] : [12, 13, 26, 27]) set(x, 26, 'r');
  }

  function hair(set0, who) {
    const kind = WHO[who].hair, map = WHO[who].hairMap || {}, more = WHO[who].tips || 0;
    // свои оттенки волос: те же пряди, другие цвета
    const set = (x, y, c) => set0(x, y, map[c] || c);
    if (kind === 'bangs') {
      // шапка + чёлка прядями до бровей, отдельные пряди падают на глаза
      // пряди идут наискосок (чёлка зачёсана вбок), у каждой свой кончик; свет сверху слева
      const TIPS = [18, 16, 20, 17, 21, 16, 19, 22, 17, 20, 16, 19, 21, 17];
      for (let y = 0; y < 28; y++) {
        for (let x = 0; x < PW; x++) {
          const dx = (x - CX) / 15.5, dy = (y - 12.5) / 12;
          const tuft = y < 3 && rnd(x * 3) > 0.55 && Math.abs(x - CX) < 9;
          if (dx * dx + dy * dy > 1 && !tuft) continue;
          const sx = x + y * 0.45, id = Math.floor(sx / 4), inS = sx - id * 4;
          let end = TIPS[((id % TIPS.length) + TIPS.length) % TIPS.length] + more;
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
    } else if (kind === 'back') {
      // светлые, зачёсаны назад: лоб открыт, пряди вертикально, у висков ниже
      for (let y = 1; y < 24; y++) {
        for (let x = 0; x < PW; x++) {
          const dx = (x - CX) / 14, dy = (y - 13) / 12;
          if (dx * dx + dy * dy > 1) continue;
          const side = Math.abs(x - CX);
          const end = side > 10 ? 21 : side > 8 ? 15 : 10 + Math.round(rnd(x) * 1.5);
          if (y > end) continue;
          let c = x % 3 === 0 ? '7' : '8';
          if (y >= end) c = '6';
          const hl = Math.abs(Math.hypot(x - 15, y - 12) - 8);
          if (hl < 1.3 && y < 9 && x % 3) c = '9';
          if (x > 27 && c !== '6') c = '7';
          set(x, y, c);
        }
      }
    } else if (kind === 'buzz') {
      for (let y = 4; y < 22; y++) for (let x = 0; x < PW; x++) {
        const dx = (x - CX) / 14.5, dy = (y - 15) / 11;
        if (dx * dx + dy * dy > 1) continue;
        const side = Math.abs(x - CX);
        if (y > (side > 12 ? 20 : side > 9 ? 14 : 11)) continue;
        set(x, y, (x * 7 + y * 3) % 5 === 0 || x > 28 ? 'l' : 'b');
      }
    } else if (kind === 'cap') {
      // кепка: купол + козырёк над бровями
      for (let y = 3; y < 15; y++) for (let x = 0; x < PW; x++) {
        const dx = (x - CX) / 14, dy = (y - 14) / 11;
        if (dx * dx + dy * dy > 1) continue;
        set(x, y, x > 27 || (x + y) % 9 === 0 ? 'K' : 'C');
      }
      for (let x = 5; x < 35; x++) set(x, 14, 'O');
      for (let x = 9; x < 31; x++) set(x, 15, 'O');
      set(Math.round(CX), 4, 'K');
      for (let y = 16; y < 24; y++) { set(8, y, 'b'); set(31, y, 'b'); }
    }
  }

  function ears(set) {
    // ободок с плюшевыми ушками: сидят сверху на макушке, кончики чуть наружу и скруглены
    for (const [cx0, dir] of [[13, -1], [26, 1]]) {
      for (let y = 0; y < 10; y++) {
        const cx = cx0 + dir * (9 - y) * 0.22, half = y < 2 ? y * 0.8 + 0.6 : Math.min(4.2, 1.6 + (y - 2) * 0.55);
        // тёмный контур, чтобы ухо не сливалось со светлыми волосами
        set(Math.round(cx - half) - 1, y, '6');
        set(Math.round(cx + half) + 1, y, '6');
        if (y === 0) set(Math.round(cx), y - 1, '6');
        for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) {
          const k = Math.abs(x - cx) / half;
          set(x, y, y === 0 ? '6' : y > 3 && k < 0.45 ? 'z' : k > 0.75 && (x - cx) * dir > 0 ? 'Y' : 'Z');
        }
      }
    }
  }

  function base(who) {
    const G = Array.from({ length: PH }, () => Array(PW).fill(null));
    const set = (x, y, c) => { if (x >= 0 && x < PW && y >= 0 && y < PH) G[y][x] = c; };
    outfit(set, who);
    face(set, who);
    hair(set, who);
    if (WHO[who].ears) ears(set);
    // вздутые вены на огромном лбу
    if (WHO[who].veins) for (const [x, y] of [[9, 10], [10, 11], [10, 12], [11, 13], [29, 9], [28, 10], [28, 11], [27, 12], [19, 8], [20, 9]]) set(x, y, 'm');
    return { G, set };
  }

  function overlay(set, rows, x0, y0) {
    rows.forEach((row, y) => [...row].forEach((c, x) => { if (c !== '.') set(x0 + x, y0 + y, c); }));
  }

  const cache = new Map();
  function render(emo, talking, who = 'artemiy') {
    if (!WHO[who]) who = 'artemiy';
    const key = who + emo + talking;
    if (cache.has(key)) return cache.get(key);
    const e = EMO[emo] || EMO.normal;
    const pal = { ...PAL, ...(WHO[who].pal || {}) };
    const { G, set } = base(who);
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
      for (let y = 27; y < 46; y++) for (let x = 20 + Math.floor((y - 27) * 0.6); x < 30 + Math.floor((y - 27) * 0.4); x++) set(x, y, y < 33 ? (x > 26 ? 's' : 'S') : SLEEVE[WHO[who].outfit][x > 28 ? 1 : 0]);
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
      g.fillStyle = pal[v];
      g.fillRect(x + 1, y + 1, 1, 1);
    }
    cache.set(key, c);
    return c;
  }

  return { render, W: PW + 2, H: PH + 2 };
})();
