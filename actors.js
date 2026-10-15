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
  // кошачьи ушки над головой (Рома)
  const EARS = {
    D: ['.Z........Z.', 'ZzZ......ZzZ', 'ZzzZ....ZzzZ'],
    U: ['.Z........Z.', 'ZZZ......ZZZ', 'ZZZZ....ZZZZ'],
    S: ['...Z....Z...', '..ZZZ..ZzZ..', '..ZZZZZzzZ..'],
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
      if (d.ears) blit(d.ears.S, FX - hw / 2, by - 14);
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
      if (d.ears) blit(d.ears[v], FX - hw / 2, by - 14);
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
    const img = frame(d, a);
    const px = Math.round(x) - d.FX - 1, py = Math.round(y) - d.FY - 1;
    if (a.dir === 'side' && a.face < 0) {
      ctx.save();
      ctx.translate(px * 2 + img.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, px, py);
      ctx.restore();
    } else ctx.drawImage(img, px, py);
  }

  return { DEFS, frame, draw };
})();
