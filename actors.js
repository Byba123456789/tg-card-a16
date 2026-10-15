// чиби-персонажи сюжетки (вид сверху 3/4): голова и тело строками-массивами, руки и ноги кодом.
// Кадр собирается один раз и кэшируется вместе с обводкой.
const Actors = (() => {
  const BASE = { ...Char.PAL, Y: '#c8a060', y: '#8a6a3a', T: '#f2f2f2', C: '#1e1e24', c: '#33333c', V: '#101014', Z: '#ead7b8', z: '#c9a585' };

  // Артемий: каштановая чёлка, смокинг
  const ART_HEAD = {
    D: [
      '...hhhhhh...', '.hhhHHHHhhh.', 'hhHHHHHHHHHh', 'HHHdHHHHdHHH', 'HdHHHdHHHHdH', 'HHSdHHHdHdSH',
      'HSSSSdSSSSSH', 'HSwESSSSwESH', 'HSwESSSSwESH', '.SrSSSSSSrS.', '..SSSmmSSS..', '...SSSSSS...',
    ],
    U: [
      '...hhhhhh...', '.hhhhhhhhhh.', 'hhhhHhhHhhhh', 'hHHhHHhHHhHh', 'HHHHHHHHHHHH', 'HHdHHHHHHdHH',
      'HHdHHdHdHHdH', 'HdHHHdHdHHdH', 'SdHHHdHdHHHS', 'SHHdHHHHdHHS', '.dHHHdHdHHd.', '..dHdHHdHd..',
    ],
    S: [
      '...hhhhhh...', '..hhHHHHhhh.', '.hHHHHHHHHHh', 'hHHHHHHHHHHH', 'HHHdHHHHHdHH', 'HHdHHHHSdHSH',
      'HHHdHHSSSSSS', 'HHdHHSSSSwES', 'HHHHHSSSSwES', '.HdHSSSSrSSS', '..HdSSSSSmS.', '...SSSSSSS..',
    ],
  };
  const ART_BODY = {
    D: ['.jjJWWJJq.', 'jjJJBBJJJq', 'jjJJWWJJJq', 'jjJJWxJJJq', 'jjJJWWJJJq', 'qqJJxWJJqq', '.qqqWWqqq.'],
    U: ['.jjJJJJJq.', 'jjJJJJJJJq', 'jjJJJJJJJq', 'jjJJJqJJJq', 'jjJJJqJJJq', 'qqJJJqJJqq', '.qqqq.qqq.'],
    S: ['.jJJJJq.', 'jJJJJWWq', 'jJJJJBWq', 'jJJJJWWq', 'jJJJJJWq', 'qJJJJJqq', '.qqqqqq.'],
  };

  // короткая стрижка, лоб открыт (Рома, пацаны)
  const SHORT_HEAD = {
    D: [
      '...dddddd...', '.dddHHHHddd.', 'dHHhHHHHhHHd', 'HHSSSSSSSSHH', 'HSSSSSSSSSSH', 'SSSSSSSSSSSS',
      'SSssSSSSssSS', 'SSwESSSSwESS', 'SSwESSSSwESS', '.SrSSSSSSrS.', '..SSSmmSSS..', '...SSSSSS...',
    ],
    U: [
      '...dddddd...', '.dddHHHHddd.', 'dHHhHHHHhHHd', 'HHHHhHHhHHHH', 'HHHHHHHHHHHH', 'HHHhHHHHhHHH',
      'dHHHHHHHHHHd', 'SdHHHHHHHHdS', 'SSdHHHHHHdSS', 'SSSddddddSSS', '.SSSSSSSSSS.', '..SSSSSSSS..',
    ],
    S: [
      '...dddddd...', '..dHHHHHHdd.', '.dHHhHHHHHHd', 'dHHHHHHSSSSS', 'HHHHHSSSSSSS', 'HHHHSSSSSsSS',
      'HHHSSSSSSSSS', 'dHHSSSSSSwES', '.dHSSSSSSwES', '.SSSSSSSrSSS', '..SSSSSSSmS.', '...SSSSSSS..',
    ],
  };
  // жирный: голова шире, щёки и второй подбородок
  const FAT_HEAD = {
    D: [
      '....dddddd....', '..dddHHHHddd..', '.dHHhHHHHhHHd.', 'dHSSSSSSSSSSHd', 'SSSSSSSSSSSSSS', 'SSssSSSSSSssSS',
      'SSwESSSSSSwESS', 'SSwESSSSSSwESS', 'rrSSSSSSSSSSrr', 'SSSSSmmmmSSSSS', '.SSSSSSSSSSSS.', '..ssSSSSSSss..',
    ],
    U: [
      '....dddddd....', '..dddHHHHddd..', '.dHHhHHHHhHHd.', 'dHHHHHHHHHHHHd', 'HHHHHHHHHHHHHH', 'HHHhHHHHHHhHHH',
      'dHHHHHHHHHHHHd', 'SdHHHHHHHHHHdS', 'SSddHHHHHHddSS', 'SSSSddddddSSSS', '.SSSSSSSSSSSS.', '..ssSSSSSSss..',
    ],
    S: [
      '....dddddd....', '..ddHHHHHHdd..', '.dHHhHHHHHHHd.', 'dHHHHHHHSSSSSS', 'HHHHHHSSSSSSSS', 'HHHHHSSSSSSsSS',
      'HHHHSSSSSSSwES', 'dHHSSSSSSSSwES', '.HSSSSSSSSSrSS', '.SSSSSSSSSSmSS', '..SSSSSSSSSSS.', '...ssSSSSSSs..',
    ],
  };
  // кепка поверх волос: верхние ряды
  const CAP = {
    D: ['...CCCCCC...', '.CCCcCCcCCC.', 'CCCCCCCCCCCC', 'cVVVVVVVVVVc'],
    U: ['...CCCCCC...', '.CCCCCCCCCC.', 'CCCCCCCCCCCC', 'CCCCcVVcCCCC'],
    S: ['...CCCCCC...', '..CCCCCCCCC.', '.CCCCCCCCCCC', 'cCCCCCCVVVVV'],
  };
  // плюшевые ушки на ободке: сидят сверху на макушке (Рома)
  const EARS = {
    D: ['...Z....Z...', '..ZZZ..ZZZ..', '..ZzZ..ZzZ..'],
    U: ['...Z....Z...', '..ZZZ..ZZZ..', '..ZZZ..ZZZ..'],
    S: ['...Z...Z....', '..ZZZ.ZZZ...', '..ZZZ.ZzZ...'],
  };
  const capify = (head, cap) => head.map((r, i) => cap[i] ? [...r].map((ch, x) => cap[i][x] === '.' ? ch : cap[i][x]).join('') : r);

  // тело кодом: куртка/олимпийка; hood — серый капюшон у шеи, zip — молния
  function genBody(w, h, view, o) {
    const rows = [];
    const mid = w >> 1;
    for (let y = 0; y < h; y++) {
      let row = '';
      for (let x = 0; x < w; x++) {
        let c = x <= (view === 'S' ? 0 : 1) ? 'j' : x >= w - 1 || y === h - 1 ? 'q' : 'J';
        if ((y === 0 || y === h - 1) && (x === 0 || x === w - 1)) c = '.';
        else if (view === 'D') {
          if (o.hood && y < 2 && x >= 2 && x <= w - 3) c = y === 0 ? 'W' : 'x';
          else if (o.hood && y >= 2 && y < h - 1 && (x === mid - 1 || x === mid)) c = 'W';
          else if (o.zip && y > 0 && y < h - 1 && x === mid) c = 'x';
          if (o.stripe && y === 1 && (x === 2 || x === w - 3)) c = 'T';
          if (o.belly && y >= 2 && y < h - 1 && x >= mid - 2 && x <= mid + 1) c = 'W';
          if (o.print && y > 0 && y < h - 1 && x > 1 && x < w - 1 && (x * 3 + y * 5) % 7 === 0) c = 'x';
        } else if (view === 'U') {
          if (o.hood && y < 3 && x >= 3 && x <= w - 4) c = y < 2 ? 'W' : 'x';
          if (o.stripe && y === 1 && (x === 1 || x === w - 2)) c = 'T';
        } else if (view === 'S') {
          if (o.hood && y < 3 && x >= 1 && x <= 3) c = y < 2 ? 'W' : 'x';
          if (o.zip && y > 0 && y < h - 1 && x === w - 2) c = 'x';
        }
        row += c;
      }
      rows.push(row);
    }
    return rows;
  }
  const bodies = (w, h, o) => ({ D: genBody(w, h, 'D', o), U: genBody(w, h, 'U', o), S: genBody(w - 2, h, 'S', o) });

  // палитры: J/j/q — верх, W/x — капюшон/рубашка, P/p — штаны, B — обувь, H/h/d — волосы
  const TRACK = (top, dark, light) => ({ J: top, j: light, q: dark, A: dark, a: top, Q: dark, P: top, p: light, L: dark });
  const DEFS = {
    artemiy: { head: ART_HEAD, body: ART_BODY, pal: {} },
    roma: {
      head: SHORT_HEAD, ears: EARS, body: bodies(10, 7, { hood: true }),
      pal: {
        H: '#d1b07a', h: '#ead2a0', d: '#a2804e', S: '#f2cdb0', s: '#d9ab8e', E: '#5f6f5a',
        J: '#2b2b33', j: '#3d3d47', q: '#1c1c22', A: '#24242b', a: '#34343d', Q: '#17171c',
        W: '#a9a9ad', x: '#86868c', P: '#3b4256', p: '#4f5870', L: '#262b38', B: '#e6e2da',
      },
    },
    gop: {
      head: SHORT_HEAD, cap: CAP, body: bodies(10, 7, { zip: true, stripe: true }), stripes: true,
      pal: { ...TRACK('#26262c', '#16161a', '#36363e'), H: '#3a2a1c', h: '#4e3a28', d: '#241810', E: '#4a3a2a', x: '#b8b8c0', B: '#f0f0f0' },
    },
    gop2: {
      head: SHORT_HEAD, body: bodies(10, 7, { zip: true, stripe: true }), stripes: true,
      pal: { ...TRACK('#2a3550', '#1a2236', '#3a4868'), H: '#6a4a2c', h: '#86603a', d: '#4a321c', S: '#eebfa0', x: '#c0c6d2', B: '#202024' },
    },
    gop3: {
      head: SHORT_HEAD, cap: CAP, body: bodies(10, 7, { zip: true, stripe: true }), stripes: true,
      pal: { ...TRACK('#5a5e66', '#3e4148', '#73777f'), C: '#a8262a', c: '#c43a3c', V: '#6a1214', H: '#2a1e14', d: '#1a120c', x: '#e0e0e0', B: '#f0f0f0' },
    },
    fat: {
      head: FAT_HEAD, body: bodies(14, 9, { zip: true, stripe: true }), stripes: true, fat: true,
      pal: { ...TRACK('#1f1f24', '#121215', '#2f2f36'), H: '#2e2218', h: '#45342a', d: '#1c140e', S: '#f0c0a0', s: '#d49c80', x: '#b0b0b8', B: '#f0f0f0' },
    },
  };

  // Антон: светлая растрёпанная чёлка до глаз
  const MOP_HEAD = {
    D: [
      '..hhhhhhhh..', '.hhHHhHHhhh.', 'hhHHHHHHHHhh', 'hHHdHHHdHHHh', 'HHdHHdHHdHHH', 'HdHHdHHdHHdH',
      'HdSdHdSdHdSH', 'HSwESdSSwESH', 'HSwESSSSwESH', '.SrSSSSSSrS.', '..SSSmmSSS..', '...SSSSSS...',
    ],
    U: SHORT_HEAD.U.map(r => r.replace(/S/g, 'H')).map((r, i) => i > 8 ? SHORT_HEAD.U[i] : r),
    S: [
      '...hhhhhhh..', '..hhHHHHhhh.', '.hHHHHHHHHHh', 'hHHHHdHHdHHH', 'HHHHdHHdHHdH', 'HHHdHHdSdHSH',
      'HHHHHdSSSdSS', 'HHdHHSSSSwES', 'HHHHHSSSSwES', '.HdHSSSSrSSS', '..HdSSSSSmS.', '...SSSSSSS..',
    ],
  };
  // аниматроники: голова-маска с мордой и светящимися глазами, уши отдельно
  const ANIM_HEAD = {
    D: [
      '..dHHHHHHd..', '.dHHHHHHHHd.', 'dHHHhHHhHHHd', 'HHHHHHHHHHHH', 'HwwHHHHHHwwH', 'HwEHHHHHHwEH',
      'HHHHSSSSHHHH', 'HHHSSBBSSHHH', 'dHHSSSSSSHHd', '.dHSmmmmSHd.', '..dSSSSSSd..', '...dddddd...',
    ],
    U: [
      '..dHHHHHHd..', '.dHHHHHHHHd.', 'dHHHhHHhHHHd', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH',
      'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'dHHHHHHHHHHd', '.dHHHHHHHHd.', '..dHHHHHHd..', '...dddddd...',
    ],
    S: [
      '..dHHHHHHd..', '.dHHHHHHHHd.', 'dHHHHhHHHHHd', 'HHHHHHHHHHHH', 'HHHHHHHHwwHH', 'HHHHHHHHwEHH',
      'HHHHHHHSSSSS', 'HHHHHHSSSSBB', 'dHHHHHSSSSSS', '.dHHHHHSmmmS', '..dHHHHSSSS.', '...ddddddd..',
    ],
  };
  const ANIM_EARS = {
    bear: { D: ['.dd......dd.', 'dHHd....dHHd'], U: ['.dd......dd.', 'dHHd....dHHd'], S: ['..dd..dd....', '.dHHddHHd...'] },
    bunny: {
      D: ['..hd....dh..', '..Hh....hH..', '..Hh....hH..', '..HH....HH..', '..dd....dd..'],
      U: ['..dd....dd..', '..HH....HH..', '..HH....HH..', '..HH....HH..', '..dd....dd..'],
      S: ['...hd.dh....', '...Hh.hH....', '...Hh.hH....', '...HH.HH....', '...dd.dd....'],
    },
    fox: { D: ['.d........d.', 'dHd......dHd', 'dHHd....dHHd'], U: ['.d........d.', 'dHd......dHd', 'dHHd....dHHd'], S: ['..d...d.....', '.dHd.dHd....', '.dHHddHHd...'] },
    chick: { D: ['.....hh.....', '....hHHh....'], U: ['.....hh.....', '....hHHh....'], S: ['....hh......', '...hHHh.....'] },
  };
  // уши фурри (ульта Андрея)
  const FUR_EARS = { D: ['.Z........Z.', 'ZzZ......ZzZ', 'ZzzZ....ZzzZ'], U: ['.Z........Z.', 'ZZZ......ZZZ', 'ZZZZ....ZZZZ'], S: ['..Z...Z.....', '.ZzZ.ZzZ....', '.ZzzZZzzZ...'] };
  const EMPTY_HEAD = { D: Array(12).fill('.'.repeat(12)), U: Array(12).fill('.'.repeat(12)), S: Array(12).fill('.'.repeat(12)) };
  const ANIM = (fur, light, dark, muzzle, eye, ears, more = {}) => ({
    head: ANIM_HEAD, ears: ANIM_EARS[ears], body: bodies(10, 7, { belly: true }), anim: true,
    pal: { H: fur, h: light, d: dark, S: muzzle, s: muzzle, w: '#fff6d0', E: eye, m: '#2a1a14', B: '#1a1a1e',
      J: fur, j: light, q: dark, A: dark, a: fur, Q: dark, W: muzzle, P: dark, p: fur, L: dark, r: muzzle, ...more },
  });
  Object.assign(DEFS, {
    anton: {
      head: MOP_HEAD, body: bodies(12, 7, {}),
      pal: { H: '#c7b48a', h: '#e2d3ac', d: '#9a875e', S: '#f6d2b8', s: '#ddb194', E: '#5f7f96',
        J: '#5b2fc9', j: '#7449e0', q: '#3f1f96', A: '#4a25ad', a: '#6a3ed8', Q: '#33187a', P: '#2e3442', p: '#434a5c', L: '#1f242e', B: '#ececec' },
    },
    andrey: {
      head: SHORT_HEAD, body: bodies(10, 7, { print: true }),
      pal: { H: '#c9a878', h: '#e0c49a', d: '#9a7a50', S: '#f4d0b6', s: '#dbae92', E: '#4a6a8a', m: '#c47d6c',
        J: '#22222a', j: '#33333d', q: '#141418', A: '#1b1b22', a: '#2a2a33', Q: '#101014', x: '#8a8a94', P: '#2f3646', p: '#444c60', L: '#1e2230', B: '#d8d8d8' },
    },
    andreyF: {
      head: SHORT_HEAD, ears: FUR_EARS, body: bodies(10, 7, { belly: true }),
      pal: { H: '#e07a2e', h: '#f29a4a', d: '#a8521c', S: '#f4d0b6', s: '#dbae92', E: '#2a4a2a', Z: '#e07a2e', z: '#f7c9a0',
        J: '#e07a2e', j: '#f29a4a', q: '#a8521c', A: '#a8521c', a: '#e07a2e', Q: '#7a3a12', W: '#f7e0c4', P: '#a8521c', p: '#e07a2e', L: '#7a3a12', B: '#3a2416' },
    },
    lg1: {
      head: SHORT_HEAD, cap: CAP, body: bodies(10, 7, { zip: true }),
      pal: { C: '#d63031', c: '#ff5a5a', V: '#7a1414', H: '#6a4a2c', d: '#4a321c', J: '#e8372c', j: '#ff5b4f', q: '#a8201a', A: '#a8201a', a: '#e8372c', Q: '#7a1410',
        x: '#ffd23f', P: '#f0c4a2', p: '#f6d2b8', L: '#d6a083', B: '#f2f2f2', T: '#ffffff' },
    },
    lg2: {
      head: SHORT_HEAD, body: bodies(10, 7, { zip: true }),
      pal: { H: '#2a1e14', h: '#3e2c1c', d: '#1a120c', S: '#eebfa0', J: '#e8372c', j: '#ff5b4f', q: '#a8201a', A: '#a8201a', a: '#e8372c', Q: '#7a1410',
        x: '#ffd23f', P: '#2a3550', p: '#3a4868', L: '#1a2236', B: '#f2f2f2' },
    },
    bear: ANIM('#8a5a32', '#a8743f', '#5e3a1e', '#d9b48a', '#ff3b3b', 'bear'),
    bunny: ANIM('#7a5cc0', '#9a7ee0', '#4e3a86', '#c8b8f0', '#ff3b3b', 'bunny'),
    chick: ANIM('#f2c230', '#ffe066', '#b88a10', '#f08a24', '#ffffff', 'chick', { W: '#fff6d0', m: '#c0392b' }),
    fox: ANIM('#c0392b', '#e05a4a', '#7a1f16', '#e8c8a8', '#ffd23f', 'fox'),
    bossbody: {
      head: EMPTY_HEAD, body: bodies(12, 8, { zip: true, stripe: true }), stripes: true,
      pal: { ...TRACK('#2b2f3a', '#1a1d24', '#3c414f'), x: '#c8ccd6', B: '#f0f0f0' },
    },
  });
  for (const [id, d] of Object.entries(DEFS)) {
    d.id = id;
    d.P = { ...BASE, ...d.pal };
    d.hw = d.head.D[0].length;
    d.bw = d.body.D[0].length;
    d.bh = d.body.D.length;
    d.CW = d.fat ? 22 : 18;
    d.CH = 28;
    d.FX = d.CW >> 1;
    d.FY = 26;
    d.heads = {};
    for (const v of ['D', 'U', 'S']) {
      let h = d.head[v];
      if (d.cap) h = capify(h, d.cap[v]);
      d.heads[v] = h;
      d.heads[v + 'b'] = v === 'U' ? h : blinkRows(h);
    }
  }
  function blinkRows(rows) {
    // моргание: верхний ряд глаз — кожа, нижний — ресницы
    let n = 0;
    return rows.map(r => r.includes('wE') ? r.replace(/wE/g, n++ ? 'ss' : 'SS') : r);
  }

  const cache = new Map();
  // st: { dir: down|up|side, f: кадр ходьбы 0..3 или -1, bob, blink, pose: idle|tied|windup|punch, flash }
  function frame(d, st) {
    const key = `${d.id}|${st.dir}|${st.f}|${st.bob}|${st.blink ? 1 : 0}|${st.pose || ''}|${st.flash ? 1 : 0}`;
    let c = cache.get(key);
    if (c) return c;
    c = render(d, st);
    cache.set(key, c);
    return c;
  }

  function render(d, st) {
    const P = d.P, { CW, CH, FX, FY, bw, bh, hw } = d;
    const raw = document.createElement('canvas');
    raw.width = CW; raw.height = CH;
    const x = raw.getContext('2d');
    const px = (col, X, Y, w = 1, h = 1) => { x.fillStyle = P[col] || col; x.fillRect(X, Y, w, h); };
    const blit = (rows, X, Y) => rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.') px(ch, X + i, Y + j); }));
    const side = st.dir === 'side', up = st.dir === 'up', v = side ? 'S' : up ? 'U' : 'D';
    const f = st.f < 0 ? 0 : st.f, moving = st.f >= 0;
    const by = FY - 3 - bh + st.bob;
    const leg = (X, lift, dark) => {
      px(dark ? 'L' : 'P', X, FY - 4, 3, 3 - lift);
      if (!dark) px('p', X, FY - 4, 1, 3 - lift);
      if (d.stripes && !dark) px('T', X + 2, FY - 4, 1, 3 - lift);
      px('B', X, FY - 1 - lift, side ? 4 : 3, 1);
    };
    const arm = (X, Y, stripeAt) => {
      px('J', X, Y, 2, 4);
      if (d.stripes) px('T', X + stripeAt, Y, 1, 3);
      px('q', X, Y + 3, 2, 1);
      px('S', X, Y + 4, 2, 2);
    };
    const fist = (X, Y) => { px('S', X, Y, 3, 3); px('s', X, Y + 2, 3, 1); };
    const pose = st.pose || 'idle';
    const lg = d.fat ? 3 : 0;
    if (side) {
      const s = moving ? (f === 1 ? 1 : f === 3 ? -1 : 0) : 0;
      leg(FX - 2 - s, moving && f === 3 ? 1 : 0, true);
      leg(FX - 2 + s, moving && f === 1 ? 1 : 0, false);
      const bx = FX - (bw - 2) / 2;
      blit(d.body.S, bx, by);
      if (pose === 'tied') { px('Y', bx, by + 2, bw - 2, 1); px('Y', bx, by + 4, bw - 2, 1); px('y', bx, by + 3, 1, 1); }
      blit(d.heads[st.blink ? 'Sb' : 'S'], FX - hw / 2, by - 11);
      if (d.ears) blit(d.ears.S, FX - hw / 2, by - 11 - d.ears.S.length);
      // замах: рука поднята за головой
      if (pose === 'windup') { px('J', FX - hw / 2 - 1, by - 6, 2, 7); fist(FX - hw / 2 - 2, by - 9); }
      if (pose === 'punch') { px('J', FX, by + 2, 6, 2); fist(FX + 6, by + 1); }
      else if (pose !== 'windup' && pose !== 'tied') arm(FX - 1 + s, by + 1, 0);
    } else {
      const bx = FX - bw / 2;
      leg(FX - 4 - lg, moving && f === 1 ? 1 : 0, false);
      leg(FX + 1 + lg, moving && f === 3 ? 1 : 0, false);
      const sw = moving ? (f === 1 ? 1 : f === 3 ? -1 : 0) : 0;
      if (pose !== 'tied') {
        arm(bx - 2, by + 1 - sw, 0);
        // правая рука при замахе рисуется поверх головы, ниже
        if (pose === 'punch' && !up) { px('J', bx + bw - 1, by + 2, 2, 3); fist(bx + bw - 2, by + 4); }
        else if (pose === 'punch') { px('J', bx + bw - 1, by - 3, 2, 4); fist(bx + bw - 2, by - 6); }
        else if (pose !== 'windup') arm(bx + bw, by + 1 + sw, 1);
      }
      blit(d.body[v], bx, by);
      if (pose === 'tied') {
        px('Y', bx, by + 2, bw, 1); px('Y', bx, by + 4, bw, 1);
        if (up) { px('S', FX - 2, by + 3, 4, 2); px('Y', FX - 2, by + 3, 4, 1); }
      }
      blit(d.heads[up ? 'U' : st.blink ? 'Db' : 'D'], FX - hw / 2, by - 11);
      if (d.ears) blit(d.ears[v], FX - hw / 2, by - 11 - d.ears[v].length);
      if (pose === 'windup') { px('J', FX + hw / 2, by - 6, 2, 7); fist(FX + hw / 2 - 1, by - 9); }
    }
    // обводка силуэтом по 4 сторонам (+1 px поля)
    const out = document.createElement('canvas');
    out.width = CW + 2; out.height = CH + 2;
    const o = out.getContext('2d');
    const sil = document.createElement('canvas');
    sil.width = CW; sil.height = CH;
    const s = sil.getContext('2d');
    s.drawImage(raw, 0, 0);
    s.globalCompositeOperation = 'source-in';
    s.fillStyle = BASE.k;
    s.fillRect(0, 0, CW, CH);
    for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) o.drawImage(sil, 1 + ax, 1 + ay);
    if (st.flash) {
      s.globalCompositeOperation = 'source-over';
      s.clearRect(0, 0, CW, CH);
      s.drawImage(raw, 0, 0);
      s.globalCompositeOperation = 'source-in';
      s.fillStyle = '#ffffff';
      s.fillRect(0, 0, CW, CH);
      o.drawImage(sil, 1, 1);
    } else o.drawImage(raw, 1, 1);
    return out;
  }

  // ctx — буфер; (x, y) — точка между стоп на экране; a.face < 0 — зеркало при виде сбоку
  function draw(ctx, d, x, y, a) {
    x = Math.round(x);
    y = Math.round(y);
    const fat = d.fat ? 3 : 0;
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#000';
    ctx.fillRect(x - 4 - fat, y - 1, 8 + fat * 2, 1);
    ctx.fillRect(x - 5 - fat, y, 10 + fat * 2, 1);
    ctx.fillRect(x - 4 - fat, y + 1, 8 + fat * 2, 1);
    ctx.globalAlpha = 1;
    const img = frame(d, a), s = a.scale || 1;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(x, y - Math.round(a.z || 0));
    if (a.rot) ctx.rotate(a.rot);
    ctx.scale(a.dir === 'side' && a.face < 0 ? -s : s, s);
    ctx.drawImage(img, -d.FX - 1, -d.FY - 1);
    ctx.restore();
  }

  return { DEFS, frame, draw };
})();
