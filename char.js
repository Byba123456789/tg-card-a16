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

  function chain(n, len, dx, dy, stiff) {
    return { pts: Array.from({ length: n }, () => ({ x: 0, y: 0, px: 0, py: 0 })), len, dx, dy, stiff, init: false };
  }

  function stepChain(ch, ax, ay, dt) {
    const p = ch.pts;
    if (!ch.init) {
      p.forEach((q, i) => { q.x = q.px = ax + ch.dx * ch.len * i; q.y = q.py = ay + ch.dy * ch.len * i; });
      ch.init = true;
    }
    p[0].x = p[0].px = ax;
    p[0].y = p[0].py = ay;
    for (let i = 1; i < p.length; i++) {
      const q = p[i];
      const vx = (q.x - q.px) * 0.9, vy = (q.y - q.py) * 0.9;
      q.px = q.x; q.py = q.y;
      const rx = p[i - 1].x + ch.dx * ch.len, ry = p[i - 1].y + ch.dy * ch.len;
      q.x += vx + (rx - q.x) * ch.stiff;
      q.y += vy + (ry - q.y) * ch.stiff + 260 * dt * dt;
    }
    for (let it = 0; it < 3; it++) {
      for (let i = 1; i < p.length; i++) {
        const a = p[i - 1], q = p[i];
        const dx = q.x - a.x, dy = q.y - a.y, d = Math.hypot(dx, dy) || 0.01;
        q.x = a.x + dx / d * ch.len;
        q.y = a.y + dy / d * ch.len;
      }
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

  function create(x, y) {
    const off = document.createElement('canvas');
    off.width = OW; off.height = OH;
    const oc = off.getContext('2d');
    const sil = document.createElement('canvas');
    sil.width = OW; sil.height = OH;
    const sc = sil.getContext('2d');

    const c = {
      mode: 'stand', view: 'back', t: 0,
      hip: { x, y }, hand: { L: { x: x - 6, y: y + 4 }, R: { x: x + 6, y: y + 4 } },
      foot: { L: { x: x - 4, y: y + 24 }, R: { x: x + 4, y: y + 24 } },
      lean: 0, wink: false,
      tails: [chain(3, 2.5, -0.15, 1, 0.14), chain(3, 2.5, 0.15, 1, 0.14)],
      tr: null, top: null, low: null, fallV: 0, danceBase: null, danceT: 0, onDone: null,
    };

    function restFor(top, low) {
      const hx = (top.x + low.x) / 2, hy = Math.max(top.y, low.y) + 16;
      return { hip: { x: hx, y: hy }, fL: { x: hx - 5, y: hy + 20 }, fR: { x: hx + 5, y: hy + 20 } };
    }

    c.hang = (top, low) => {
      c.mode = 'hang'; c.view = 'back'; c.top = top; c.low = low;
      c.hand[top.side < 0 ? 'L' : 'R'] = { x: top.x, y: top.y };
      c.hand[top.side < 0 ? 'R' : 'L'] = { x: low.x, y: low.y };
      const r = restFor(top, low);
      c.hip = { ...r.hip };
      c.foot.L = { ...r.fL };
      c.foot.R = { ...r.fR };
      c.rest = r;
    };

    // перехват: тянется нижняя рука; если зацепка с другой стороны — тело перекачивается с инерцией
    c.climbTo = (next, dur = 0.75) => {
      const moving = c.hand.L.y > c.hand.R.y ? 'L' : 'R';
      const r = restFor(next, c.top);
      const swing = next.side !== c.top.side;
      c.tr = {
        dur: swing ? dur * 1.1 : dur, t: 0, moving, side: next.side, swing,
        h0: { ...c.hand[moving] }, h1: { x: next.x, y: next.y },
        hip0: { ...c.hip }, hip1: r.hip,
        fL0: { ...c.foot.L }, fL1: r.fL, fR0: { ...c.foot.R }, fR1: r.fR,
      };
      c.low = c.top; c.top = next; c.rest = r;
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
        c.hip.y = c.rest.hip.y + Math.sin(c.t * 2.2) * 0.6;
        c.hip.x = c.rest.hip.x + Math.sin(c.t * 1.1) * 0.4;
        c.lean = lerp(c.lean, 0, dt * 6);
      } else if (c.mode === 'climb') {
        const tr = c.tr;
        tr.t += dt;
        const k = tr.t / tr.dur;
        const kr = ease(phase(k, 0, 0.4));
        const bulge = Math.sin(Math.PI * kr) * 4;
        c.hand[tr.moving] = { x: lerp(tr.h0.x, tr.h1.x, kr) - tr.side * bulge * 0.5, y: lerp(tr.h0.y, tr.h1.y, kr) - bulge * 0.4 };
        const kp = phase(k, 0.3, 0.8);
        const pre = Math.sin(Math.PI * phase(k, 0, 0.4)) * 2;
        c.hip.x = lerp(tr.hip0.x, tr.hip1.x, tr.swing ? backOut(kp) : ease(kp)) + tr.side * pre;
        c.hip.y = lerp(tr.hip0.y, tr.hip1.y, ease(kp)) - pre * 0.5;
        c.lean = tr.side * (tr.swing ? 5 : 3) * Math.sin(Math.PI * phase(k, 0, 0.8));
        for (const [f, a, z, s0, s1] of [['L', 0.62, 0.84, tr.fL0, tr.fL1], ['R', 0.76, 1, tr.fR0, tr.fR1]]) {
          const kf = ease(phase(k, a, z));
          const lift = Math.sin(Math.PI * kf) * 4;
          c.foot[f] = { x: lerp(s0.x, s1.x, kf) + (f === 'L' ? -lift : lift) * 0.4, y: lerp(s0.y, s1.y, kf) - lift };
        }
        if (k >= 1) { c.mode = 'hang'; c.tr = null; c.t = 0; if (c.onDone) c.onDone(); }
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
      const tx = c.hip.x + c.lean * 0.5;
      for (let s = 0, n = Math.max(1, Math.ceil(dt * 120)); s < n; s++) {
        stepChain(c.tails[0], tx - 5, c.hip.y + 2, dt / n);
        stepChain(c.tails[1], tx + 5, c.hip.y + 2, dt / n);
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
      const chainDraw = (ch, w, col, line) => {
        const p = ch.pts;
        for (let i = 1; i < p.length; i++) seg(oc, ...L(p[i - 1].x, p[i - 1].y), ...L(p[i].x, p[i].y), w + 2, line);
        for (let i = 1; i < p.length; i++) seg(oc, ...L(p[i - 1].x, p[i - 1].y), ...L(p[i].x, p[i].y), w, col);
      };
      const drawLeg = (hip, leg, left) => {
        limb(oc, [L(...hip), L(leg[0], leg[1]), L(leg[2], leg[3])], 4, PAL.P, PAL.p, PAL.L, PAL.L);
        const [fx, fy] = L(leg[2], leg[3]);
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
      c.tails.forEach(ch => chainDraw(ch, 2, front ? PAL.J : PAL.q, PAL.o));
      drawLeg(hipL, legL, true);
      drawLeg(hipR, legR, false);
      const [tx, ty] = L(c.hip.x + c.lean * 0.5 - 6, c.hip.y - 15);
      oc.drawImage(front ? SPR.torsoF : SPR.torsoB, Math.round(tx), Math.round(ty));
      const [hx, hy] = L(c.hip.x + c.lean - 6, c.hip.y - 29);
      oc.drawImage(front ? (c.wink ? SPR.headFWink : SPR.headF) : SPR.headB, Math.round(hx), Math.round(hy));
      drawArm(s.L, armL, true);
      drawArm(s.R, armR, false);
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
