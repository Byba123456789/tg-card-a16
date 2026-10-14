const Char = (() => {
  const PAL = {
    k: '#1a1620', H: '#7a593b', h: '#9a7550', d: '#523c28',
    S: '#f0c4a2', s: '#d6a083', r: '#e8a08c', E: '#5b7896', w: '#ffffff', m: '#c47d6c',
    J: '#949eae', j: '#b4bdcb', q: '#6c7689', o: '#4b5366',
    W: '#f6f4ef', x: '#d3d7de', P: '#2e3039', p: '#4a4d5a', B: '#141418', b: '#3a3a44', L: '#101014',
  };
  const HEAD_F = [
    '...hhhhhh...',
    '.hhhHHHHhhh.',
    'hhHHHHHHHHHh',
    'HHHHHHHHHHHH',
    'HHHdHHHHdHHH',
    'HdHHHdHHHHdH',
    'HHSdHHHdHdSH',
    'HSSSSdSSSSSH',
    'HSddSSSSddSH',
    'HSwESSSSwESH',
    '.SSSSSsSSSS.',
    '.SrSSSSSSrS.',
    '..SSSmmSSS..',
    '...SSSSSS...',
    '....SSSS....',
  ];
  const HEAD_F_WINK = HEAD_F.map((row, i) => i === 9 ? 'HSwESSSSddSH' : row);
  const HEAD_B = [
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
    '.HHdHHHHdHH.',
    '.dHHHdHdHHd.',
    '..dHdHHdHd..',
    '...SSSSSS...',
    '....SSSS....',
  ];
  const TORSO_F = [
    '..jjqWWqJq..',
    '.jjjqWWqJJq.',
    'jjjJqWWqJJJq',
    'jjJJqWWqJJJq',
    'jjJJJWWJJJJq',
    'jjJJJWWJJJJq',
    '.jJJJWWJJJq.',
    '.jJJJWWJJJq.',
    '.jJJJWWJJJq.',
    '.jJJJWxJJJq.',
    '.jJJJWWJJJq.',
    '.jJJJxWJJJq.',
    '.jqqJWWJqqq.',
    'jjJJJWWJJJJq',
    'jjJJJWWJJJJq',
    'jJJJJxxJJJJq',
    'jJJJq..qJJJq',
    'qqqq....qqqq',
  ];
  const TORSO_B = [
    '..jjqqqqJq..',
    '.jjjJJJJJJq.',
    'jjjJJJJJJJJq',
    'jjJJJJJJJJJq',
    'jjJJJJJJJJJq',
    'jjJJJJJJJJJq',
    '.jJJJJJJJJq.',
    '.jJJJJJJJJq.',
    '.jJJJJJJJJq.',
    '.jJJJJqJJJq.',
    '.jJJJJqJJJq.',
    '.jJJJJqJJJq.',
    '.jJJJJqJJJq.',
    'jjJJJJqJJJJq',
    'jjJJJJqJJJJq',
    'jJJJJJqJJJJq',
    'jJJJJq.qJJJq',
    'qqqqqq.qqqqq',
  ];
  const HAND = ['SSS', 'SSs', '.s.'];
  const SHOE = ['BBb...', 'BBBBBb', 'LLLLLL'];
  const HEEL = ['BBBB', 'BBbB', 'LLLL'];

  function sprite(rows, flip) {
    const c = document.createElement('canvas');
    c.width = rows[0].length;
    c.height = rows.length;
    const g = c.getContext('2d');
    rows.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch === '.') return;
      g.fillStyle = PAL[ch];
      g.fillRect(flip ? c.width - 1 - x : x, y, 1, 1);
    }));
    return c;
  }
  const SPR = {
    headF: sprite(HEAD_F), headFWink: sprite(HEAD_F_WINK), headB: sprite(HEAD_B),
    torsoF: sprite(TORSO_F), torsoB: sprite(TORSO_B), hand: sprite(HAND), handL: sprite(HAND, true),
    shoeR: sprite(SHOE), shoeL: sprite(SHOE, true), heel: sprite(HEEL),
  };

  const UPPER = 10, FORE = 9, THIGH = 12, SHIN = 12;
  const OW = 80, OH = 90, OX = 40, OY = 52;
  const clamp = (v, a, z) => Math.max(a, Math.min(z, v));
  const lerp = (a, z, k) => a + (z - a) * k;
  const ease = k => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  const backOut = k => 1 + 2.70158 * Math.pow(k - 1, 3) + 1.70158 * Math.pow(k - 1, 2);
  const phase = (t, a, z) => clamp((t - a) / (z - a), 0, 1);

  // двухзвенный IK: сустав (локоть/колено) сгибается в сторону bend (+1 по часовой, -1 против)
  function ik(rx, ry, tx, ty, a, b, bend) {
    let dx = tx - rx, dy = ty - ry, dist = Math.hypot(dx, dy);
    const max = a + b - 0.05;
    if (dist > max) { dx *= max / dist; dy *= max / dist; dist = max; }
    dist = Math.max(dist, 0.05);
    const th = Math.atan2(dy, dx);
    const al = Math.acos(clamp((a * a + dist * dist - b * b) / (2 * a * dist), -1, 1)) * bend;
    return [rx + Math.cos(th + al) * a, ry + Math.sin(th + al) * a, rx + dx, ry + dy];
  }

  function seg(g, x1, y1, x2, y2, w, col, from = 0) {
    g.fillStyle = col;
    const n = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) * 2));
    for (let i = Math.ceil(n * from); i <= n; i++) {
      const x = x1 + (x2 - x1) * i / n, y = y1 + (y2 - y1) * i / n;
      g.fillRect(Math.round(x - w / 2), Math.round(y - w / 2), w, w);
    }
  }

  // конечность: тёмная внутренняя линия (кроме места крепления к телу), заливка, свет и тень
  function limb(g, pts, w, fill, light, dark, line) {
    seg(g, ...pts[0], ...pts[1], w + 2, line, 0.4);
    seg(g, ...pts[1], ...pts[2], w + 2, line);
    for (let i = 0; i < 2; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
      seg(g, x1, y1, x2, y2, w, fill);
      const len = Math.hypot(x2 - x1, y2 - y1) || 1;
      let nx = -(y2 - y1) / len, ny = (x2 - x1) / len;
      if (nx > 0) { nx = -nx; ny = -ny; }
      const o = w / 2 - 0.5;
      seg(g, x1 + nx * o, y1 + ny * o, x2 + nx * o, y2 + ny * o, 1, light);
      seg(g, x1 - nx * o, y1 - ny * o, x2 - nx * o, y2 - ny * o, 1, dark);
    }
  }

  // позы танца: смещение таза, руки/ноги относительно таза, наклон головы
  const DANCE = [
    { hip: [0, 4], hl: [-12, -33], hr: [12, -33], fl: [-11, 21], fr: [11, 21] },
    { hip: [-2, 1], hl: [-7, -2], hr: [9, -35], fl: [-6, 24], fr: [5, 24], head: -1 },
    { hip: [2, 1], hl: [-9, -35], hr: [7, -2], fl: [-5, 24], fr: [6, 24], head: 1 },
    { hip: [0, 1], hl: [-7, -2], hr: [23, -16], fl: [-5, 24], fr: [9, 23], head: 1 },
    { hip: [-1, 0], hl: [-5, -30], hr: [9, -4], fl: [-5, 25], fr: [5, 25], head: -1 },
    { hip: [0, 1], hl: [-21, -14], hr: [21, -14], fl: [-6, 24], fr: [6, 24], back: true },
    { hip: [0, 4], hl: [-22, -12], hr: [22, -12], fl: [-11, 21], fr: [11, 21] },
    { hip: [0, 4], hl: [-12, -33], hr: [12, -33], fl: [-11, 21], fr: [11, 21], wink: true },
  ];

  // holdAt(i) — зацепка i ({x, y, side}); для i < 0 — точка на земле. Руки на зацепках k и k-1, ноги на k-3 (согнутая) и k-4 (прямая)
  function create(holdAt) {
    const off = document.createElement('canvas');
    off.width = OW; off.height = OH;
    const oc = off.getContext('2d');
    const sil = document.createElement('canvas');
    sil.width = OW; sil.height = OH;
    const sc = sil.getContext('2d');

    const c = {
      mode: 'stand', view: 'back', t: 0, k: 1,
      hip: { x: 0, y: 0 }, hand: { L: { x: 0, y: 0 }, R: { x: 0, y: 0 } }, foot: { L: { x: 0, y: 0 }, R: { x: 0, y: 0 } },
      handOn: { L: 0, R: 0 }, footOn: { L: 0, R: 0 },
      lean: 0, wink: false, hem: 0, hemV: 0, prevVx: 0, prevX: 0,
      tr: null, rest: null, fallV: 0, danceBase: null, danceT: 0, onDone: null,
    };

    const grip = i => { const h = holdAt(i); return { x: h.x, y: h.y - 1 }; };
    const step = i => { const h = holdAt(i); return { x: h.x, y: h.ground ? h.y : h.y - 3 }; };
    function restHip() {
      const hl = grip(c.handOn.L), hr = grip(c.handOn.R), fl = step(c.footOn.L), fr = step(c.footOn.R);
      return { x: (hl.x + hr.x) * 0.3 + (fl.x + fr.x) * 0.2, y: Math.max(hl.y, hr.y) + 12 };
    }

    c.hangAt = k => {
      c.mode = 'hang'; c.view = 'back'; c.k = k; c.t = 0;
      const top = holdAt(k);
      const topHand = top.side < 0 ? 'L' : 'R';
      c.handOn[topHand] = k;
      c.handOn[topHand === 'L' ? 'R' : 'L'] = k - 1;
      c.footOn.L = k - 4 + (k % 2 ? 1 : 0);
      c.footOn.R = k - 3 - (k % 2 ? 1 : 0);
      c.hand.L = grip(c.handOn.L); c.hand.R = grip(c.handOn.R);
      c.foot.L = step(c.footOn.L); c.foot.R = step(c.footOn.R);
      c.rest = restHip();
      c.hip = { ...c.rest };
    };

    // шаг вверх: толчок согнутой ногой → нижняя рука перехватывает зацепку k+1 → нижняя нога переступает на k-2
    c.climbUp = (dur = 0.8) => {
      const k = c.k + 1;
      const hand = c.handOn.L < c.handOn.R ? 'L' : 'R';
      const foot = c.footOn.L < c.footOn.R ? 'L' : 'R';
      const swing = holdAt(k).side !== holdAt(k - 1).side;
      const h0 = { ...c.hand[hand] }, f0 = { ...c.foot[foot] }, hip0 = { ...c.hip };
      c.handOn[hand] = k;
      c.footOn[foot] = k - 2;
      c.k = k;
      const hip1 = restHip();
      c.tr = { dur, t: 0, hand, foot, swing, side: holdAt(k).side, h0, h1: grip(k), f0, f1: step(k - 2), hip0, hip1 };
      c.mode = 'climb';
    };

    c.fall = () => { c.mode = 'fall'; c.view = 'front'; c.fallV = -40; c.t = 0; };
    c.stand = (sx, gy, view = 'front') => {
      c.mode = 'stand'; c.view = view;
      c.hip = { x: sx, y: gy - 24 };
      c.foot.L = { x: sx - 4, y: gy };
      c.foot.R = { x: sx + 4, y: gy };
    };
    c.dance = (sx, gy) => { c.stand(sx, gy); c.mode = 'dance'; c.danceT = 0; c.danceBase = { x: sx, y: gy - 25 }; };

    function shoulders() {
      const tx = c.hip.x + c.lean * 0.5;
      return { L: [tx - 5, c.hip.y - 13], R: [tx + 5, c.hip.y - 13] };
    }

    c.update = dt => {
      c.t += dt;
      c.wink = false;
      if (c.mode === 'hang') {
        c.hip.y = c.rest.y + Math.sin(c.t * 2.2) * 0.5;
        c.hip.x = c.rest.x + Math.sin(c.t * 1.1) * 0.3;
        c.lean = lerp(c.lean, 0, dt * 6);
      } else if (c.mode === 'climb') {
        const tr = c.tr;
        tr.t += dt;
        const k = tr.t / tr.dur;
        const kp = ease(phase(k, 0, 0.4));
        const kh = ease(phase(k, 0.3, 0.7));
        const kf = ease(phase(k, 0.62, 1));
        c.hip.y = lerp(tr.hip0.y, tr.hip1.y, kp);
        c.hip.x = lerp(tr.hip0.x, tr.hip1.x, tr.swing ? backOut(phase(k, 0.3, 0.85)) : ease(phase(k, 0.2, 0.8)));
        const bulge = Math.sin(Math.PI * kh) * 3;
        c.hand[tr.hand] = { x: lerp(tr.h0.x, tr.h1.x, kh) - tr.side * bulge * 0.4, y: lerp(tr.h0.y, tr.h1.y, kh) - bulge * 0.3 };
        const lift = Math.sin(Math.PI * kf) * 4;
        c.foot[tr.foot] = { x: lerp(tr.f0.x, tr.f1.x, kf) + (tr.foot === 'L' ? -lift : lift) * 0.5, y: lerp(tr.f0.y, tr.f1.y, kf) - lift };
        c.lean = tr.side * (tr.swing ? 4 : 2) * Math.sin(Math.PI * phase(k, 0.2, 0.9));
        if (k >= 1) { c.mode = 'hang'; c.rest = tr.hip1; c.t = 0; c.tr = null; if (c.onDone) c.onDone(); }
      } else if (c.mode === 'fall') {
        c.fallV += 380 * dt;
        c.hip.y += c.fallV * dt;
        const s = shoulders();
        const a = c.t * 14;
        c.hand.L = { x: s.L[0] - 8 + Math.sin(a) * 5, y: s.L[1] - 12 + Math.cos(a) * 6 };
        c.hand.R = { x: s.R[0] + 8 + Math.sin(a + 2) * 5, y: s.R[1] - 12 + Math.cos(a + 2) * 6 };
        c.foot.L = { x: c.hip.x - 7 + Math.sin(a * 0.8) * 4, y: c.hip.y + 18 + Math.cos(a * 0.8) * 4 };
        c.foot.R = { x: c.hip.x + 7 + Math.sin(a * 0.8 + 3) * 4, y: c.hip.y + 18 + Math.cos(a * 0.8 + 3) * 4 };
        c.lean = Math.sin(a * 0.5) * 2;
      } else if (c.mode === 'dance') {
        c.danceT += dt;
        const beat = 0.5;
        const i = Math.min(DANCE.length - 1, Math.floor(c.danceT / beat));
        const prev = DANCE[Math.max(0, i - 1)], cur = DANCE[i];
        const k = i === 0 ? 1 : ease(phase(c.danceT - i * beat, 0, 0.2));
        const mixp = (a, z) => [lerp(a[0], z[0], k), lerp(a[1], z[1], k)];
        const hip = mixp(prev.hip, cur.hip);
        const bounce = Math.abs(Math.sin(Math.PI * c.danceT / (beat / 2))) * 1.5;
        const b = c.danceBase;
        c.hip = { x: b.x + hip[0], y: b.y + hip[1] - bounce };
        const hl = mixp(prev.hl, cur.hl), hr = mixp(prev.hr, cur.hr), fl = mixp(prev.fl, cur.fl), fr = mixp(prev.fr, cur.fr);
        c.hand.L = { x: c.hip.x + hl[0], y: c.hip.y + hl[1] };
        c.hand.R = { x: c.hip.x + hr[0], y: c.hip.y + hr[1] };
        c.foot.L = { x: b.x + fl[0], y: b.y + fl[1] };
        c.foot.R = { x: b.x + fr[0], y: b.y + fr[1] };
        c.lean = lerp(prev.head || 0, cur.head || 0, k) * 2;
        c.view = cur.back && k > 0.5 ? 'back' : 'front';
        c.wink = !!cur.wink;
        if (c.danceT >= DANCE.length * beat) { c.mode = 'stand'; c.view = 'front'; if (c.onDone) c.onDone(); }
      } else {
        const s = shoulders();
        c.hand.L = { x: s.L[0] - 1, y: s.L[1] + 18 + Math.sin(c.t * 2.2) * 0.4 };
        c.hand.R = { x: s.R[0] + 1, y: s.R[1] + 18 + Math.sin(c.t * 2.2) * 0.4 };
        c.lean = lerp(c.lean, 0, dt * 6);
      }
      // низ пиджака отстаёт от рывков таза (пружина)
      if (dt > 0) {
        const vx = (c.hip.x - c.prevX) / dt;
        const ax = (vx - c.prevVx) / dt;
        c.prevX = c.hip.x;
        c.prevVx = vx;
        c.hemV += (-c.hem * 160 - clamp(ax, -400, 400) * 0.02) * dt;
        c.hemV *= Math.exp(-dt * 6);
        c.hem = clamp(c.hem + c.hemV * dt, -2, 2);
      }
    };

    function render() {
      const front = c.view === 'front';
      const bx = Math.round(c.hip.x), by = Math.round(c.hip.y);
      const L = (x, y) => [x - bx + OX, y - by + OY];
      oc.clearRect(0, 0, OW, OH);
      const s = shoulders();
      const hipL = [c.hip.x - 2.5, c.hip.y + 1], hipR = [c.hip.x + 2.5, c.hip.y + 1];
      const legL = ik(...hipL, c.foot.L.x, c.foot.L.y, THIGH, SHIN, 1);
      const legR = ik(...hipR, c.foot.R.x, c.foot.R.y, THIGH, SHIN, -1);
      const armL = ik(...s.L, c.hand.L.x, c.hand.L.y, UPPER, FORE, -1);
      const armR = ik(...s.R, c.hand.R.x, c.hand.R.y, UPPER, FORE, 1);
      const drawLeg = (hip, leg, left) => {
        const pts = [L(...hip), L(leg[0], leg[1]), L(leg[2], leg[3])];
        for (let i = 0; i < 2; i++) seg(oc, ...pts[i], ...pts[i + 1], 3, PAL.P);
        for (let i = 0; i < 2; i++) seg(oc, pts[i][0] + (left ? -1 : 1), pts[i][1], pts[i + 1][0] + (left ? -1 : 1), pts[i + 1][1], 1, left ? PAL.p : PAL.L);
        const [fx, fy] = pts[2];
        if (front) oc.drawImage(left ? SPR.shoeL : SPR.shoeR, Math.round(fx - (left ? 5 : 1)), Math.round(fy - 1));
        else oc.drawImage(SPR.heel, Math.round(fx - 2), Math.round(fy - 1));
      };
      const drawArm = (sh, arm, left) => {
        limb(oc, [L(...sh), L(arm[0], arm[1]), L(arm[2], arm[3])], 3, PAL.J, PAL.j, PAL.q, PAL.o);
        const [cx, cy] = L(lerp(arm[0], arm[2], 0.82), lerp(arm[1], arm[3], 0.82));
        oc.fillStyle = PAL.W;
        oc.fillRect(Math.round(cx - 1), Math.round(cy - 1), 2, 2);
        const [hx, hy] = L(arm[2], arm[3]);
        oc.drawImage(left ? SPR.handL : SPR.hand, Math.round(hx - 1), Math.round(hy - 1));
      };
      const torso = front ? SPR.torsoF : SPR.torsoB;
      const head = front ? (c.wink ? SPR.headFWink : SPR.headF) : SPR.headB;
      const [tx, ty] = L(c.hip.x + c.lean * 0.5 - 6, c.hip.y - 15);
      const [hx, hy] = L(c.hip.x + c.lean - 6, c.hip.y - 29);
      // со спины руки на скале дальше от нас, чем спина: рисуем их за телом
      if (!front) { drawArm(s.L, armL, true); drawArm(s.R, armR, false); }
      drawLeg(hipL, legL, true);
      drawLeg(hipR, legR, false);
      oc.drawImage(torso, 0, 0, 12, 13, Math.round(tx), Math.round(ty), 12, 13);
      oc.drawImage(torso, 0, 13, 12, 5, Math.round(tx + c.hem), Math.round(ty) + 13, 12, 5);
      oc.drawImage(head, Math.round(hx), Math.round(hy));
      if (front) { drawArm(s.L, armL, true); drawArm(s.R, armR, false); }
      sc.clearRect(0, 0, OW, OH);
      sc.globalCompositeOperation = 'source-over';
      sc.drawImage(off, 0, 0);
      sc.globalCompositeOperation = 'source-in';
      sc.fillStyle = PAL.k;
      sc.fillRect(0, 0, OW, OH);
      return [bx - OX, by - OY];
    }

    c.draw = (g, ox, oy) => {
      const [x0, y0] = render();
      const dx = Math.round(x0 - ox), dy = Math.round(y0 - oy);
      for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) g.drawImage(sil, dx + ax, dy + ay);
      g.drawImage(off, dx, dy);
    };

    return c;
  }

  return { create, PAL };
})();