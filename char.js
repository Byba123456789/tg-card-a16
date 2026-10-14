const Char = (() => {
  const PAL = {
    k: '#1a1620', H: '#b98a52', h: '#dcb070', d: '#8a5e33',
    S: '#f3c6a0', s: '#d9a07a', r: '#eda48a', E: '#2f5d9b', w: '#ffffff',
    J: '#8a96a8', j: '#aeb8c8', q: '#636d86',
    W: '#f5f3ee', x: '#cfd4dc', P: '#363845', p: '#525566', B: '#18181d', b: '#3d3d48',
  };
  const HEAD_F = [
    '.....kkkkkk.....',
    '...kkhhhhhhkk...',
    '..khhhhHHHhhhk..',
    '.khhHHHHHHHHHhk.',
    '.kHHHHHHHHHHHHk.',
    'kHHHHHHHHHHHHHHk',
    'kHHdHHHdHHHHdHHk',
    'kHdSdHdSSdHdSdHk',
    'kdSSSSSSSSSSSSdk',
    'kSSwESSSSSSwESSk',
    'kSSEESSSSSSEESSk',
    'kSrSSSSSSSSSSrSk',
    '.kSSSSSssSSSSSk.',
    '..kSSSSSSSSSSk..',
    '...kkSSSSSSkk...',
    '.....kkkkkk.....',
  ];
  const HEAD_F_WINK = HEAD_F.map((row, i) => i === 9 ? 'kSSwESSSSSSSSSSk' : i === 10 ? 'kSSEESSSSSSkkSSk' : row);
  const HEAD_B = [
    '.....kkkkkk.....',
    '...kkhhhhhhkk...',
    '..khhhhhhhhhhk..',
    '.khhHhhHHhhHhhk.',
    '.kHhHHhHHHhHHHk.',
    'kHHhHHHdHHHhHHHk',
    'kHHHdHHHdHHHdHHk',
    'kHdHHdHHHdHHHdHk',
    'kHHdHHdHHHdHHdHk',
    'kSHHdHHdHHHdHHSk',
    'kSHdHHdHHHdHHdSk',
    '.kHHdHHdHHdHHHk.',
    '.kdHHdHHdHHdHdk.',
    '..kdHdHdHdHdHk..',
    '...kkSSSSSSkk...',
    '.....kkkkkk.....',
  ];
  const TORSO_F = [
    '..kkkkkkkkkk..',
    '.kjjjqWWWqJJk.',
    'kjjjJqWWWqJJqk',
    'kjjJJJqWqJJJqk',
    'kjjJJJqWqJJJqk',
    'kjjJJJJqJJJJqk',
    'kjjJJJJbJJJJqk',
    'kjjJJJJqJJJJqk',
    'kjjJJJJbJJJJqk',
    'kjjJJJJqJJJJqk',
    'kjjJJJJqJJJJqk',
    'kjJJJJqkqJJJqk',
    'kqqqqqk.kqqqqk',
    '.kkkkk...kkkk.',
  ];
  const TORSO_B = [
    '..kkkkkkkkkk..',
    '.kjjjqqqqJJJk.',
    'kjjjJJJJJJJJqk',
    'kjjJJJJJJJJJqk',
    'kjjJJJJJJJJJqk',
    'kjjJJJJqJJJJqk',
    'kjjJJJJqJJJJqk',
    'kjjJJJJqJJJJqk',
    'kjjJJJJqJJJJqk',
    'kjjJJJJqJJJJqk',
    'kjjJJJJqJJJJqk',
    'kjJJJJJqJJJJqk',
    'kqqqqqqkqqqqqk',
    '.kkkkkk.kkkkk.',
  ];
  const HAND = ['.kk.', 'kSSk', 'kSsk', '.kk.'];
  const SHOE = ['kkkk...', 'kBBbkk.', 'kBBBBBk', '.kkkkkk'];

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
    torsoF: sprite(TORSO_F), torsoB: sprite(TORSO_B), hand: sprite(HAND),
    shoeR: sprite(SHOE), shoeL: sprite(SHOE, true),
  };

  const UPPER = 8, FORE = 8, THIGH = 8, SHIN = 8;
  const clamp = (v, a, z) => Math.max(a, Math.min(z, v));
  const lerp = (a, z, k) => a + (z - a) * k;
  const ease = k => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  const easeOut = k => 1 - Math.pow(1 - k, 3);
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

  function seg(g, x1, y1, x2, y2, w, col) {
    g.fillStyle = col;
    const n = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) * 2));
    for (let i = 0; i <= n; i++) {
      const x = x1 + (x2 - x1) * i / n, y = y1 + (y2 - y1) * i / n;
      g.fillRect(Math.round(x - w / 2), Math.round(y - w / 2), w, w);
    }
  }

  function limb(g, pts, w, fill, light, dark) {
    for (let i = 0; i < 2; i++) seg(g, ...pts[i], ...pts[i + 1], w + 2, PAL.k);
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
    { hip: [0, 3], hl: [-11, -30], hr: [11, -30], fl: [-9, 14], fr: [9, 14] },
    { hip: [-2, 1], hl: [-8, -3], hr: [8, -31], fl: [-5, 15], fr: [5, 15], head: -1 },
    { hip: [2, 1], hl: [-8, -31], hr: [8, -3], fl: [-5, 15], fr: [5, 15], head: 1 },
    { hip: [0, 1], hl: [-8, -3], hr: [19, -14], fl: [-4, 15], fr: [8, 15], head: 1 },
    { hip: [-1, 0], hl: [-5, -29], hr: [9, -5], fl: [-4, 16], fr: [4, 16], head: -1 },
    { hip: [0, 1], hl: [-17, -12], hr: [17, -12], fl: [-5, 15], fr: [5, 15], back: true },
    { hip: [0, 3], hl: [-18, -11], hr: [18, -11], fl: [-9, 14], fr: [9, 14] },
    { hip: [0, 3], hl: [-11, -30], hr: [11, -30], fl: [-9, 14], fr: [9, 14], wink: true },
  ];

  function create(x, y) {
    const c = {
      mode: 'stand', view: 'back', t: 0,
      hip: { x, y }, hand: { L: { x: x - 6, y: y + 4 }, R: { x: x + 6, y: y + 4 } },
      foot: { L: { x: x - 4, y: y + 16 }, R: { x: x + 4, y: y + 16 } },
      lean: 0, headDx: 0, wink: false,
      tails: [chain(4, 2.2, -0.15, 1, 0.12), chain(4, 2.2, 0.15, 1, 0.12)],
      hair: [chain(3, 2, -0.9, 0.4, 0.22), chain(3, 2, 0.9, 0.4, 0.22), chain(2, 2, 0.5, -0.85, 0.3)],
      tr: null, top: null, low: null, fallV: 0, danceBase: null, danceT: 0, onDone: null,
    };

    function restFor(top, low) {
      const hx = (top.x + low.x) / 2, hy = Math.max(top.y, low.y) + 18;
      return { hip: { x: hx, y: hy }, fL: { x: hx - 6, y: hy + 13 }, fR: { x: hx + 6, y: hy + 13 } };
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

    c.climbTo = (next, dur = 0.7) => {
      const moving = c.hand.L.y > c.hand.R.y ? 'L' : 'R';
      const r = restFor(next, c.top);
      c.tr = {
        dur, t: 0, moving, side: next.side,
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
      c.hip = { x: sx, y: gy - 16 };
      c.foot.L = { x: sx - 4, y: gy };
      c.foot.R = { x: sx + 4, y: gy };
    };
    c.dance = (sx, gy) => { c.stand(sx, gy); c.mode = 'dance'; c.danceT = 0; c.danceBase = { x: sx, y: gy - 16 }; };

    function shoulders() {
      const tx = c.hip.x + c.lean * 0.5;
      return { L: [tx - 6, c.hip.y - 11], R: [tx + 6, c.hip.y - 11] };
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
        c.hand[tr.moving] = { x: lerp(tr.h0.x, tr.h1.x, kr) - tr.side * bulge * 0.6, y: lerp(tr.h0.y, tr.h1.y, kr) - bulge * 0.3 };
        const kp = ease(phase(k, 0.3, 0.75));
        const pre = Math.sin(Math.PI * phase(k, 0, 0.4)) * 2;
        c.hip.x = lerp(tr.hip0.x, tr.hip1.x, kp) + tr.side * pre;
        c.hip.y = lerp(tr.hip0.y, tr.hip1.y, kp) - pre * 0.5;
        c.lean = tr.side * 3 * Math.sin(Math.PI * phase(k, 0, 0.75));
        for (const [f, a, z, s0, s1] of [['L', 0.62, 0.84, tr.fL0, tr.fL1], ['R', 0.76, 1, tr.fR0, tr.fR1]]) {
          const kf = ease(phase(k, a, z));
          const lift = Math.sin(Math.PI * kf) * 3;
          c.foot[f] = { x: lerp(s0.x, s1.x, kf) + (f === 'L' ? -lift : lift) * 0.5, y: lerp(s0.y, s1.y, kf) - lift };
        }
        if (k >= 1) { c.mode = 'hang'; c.tr = null; c.t = 0; if (c.onDone) c.onDone(); }
      } else if (c.mode === 'fall') {
        c.fallV += 380 * dt;
        c.hip.y += c.fallV * dt;
        const s = shoulders();
        const a = c.t * 14;
        c.hand.L = { x: s.L[0] - 6 + Math.sin(a) * 4, y: s.L[1] - 10 + Math.cos(a) * 5 };
        c.hand.R = { x: s.R[0] + 6 + Math.sin(a + 2) * 4, y: s.R[1] - 10 + Math.cos(a + 2) * 5 };
        c.foot.L = { x: c.hip.x - 6 + Math.sin(a * 0.8) * 3, y: c.hip.y + 12 + Math.cos(a * 0.8) * 3 };
        c.foot.R = { x: c.hip.x + 6 + Math.sin(a * 0.8 + 3) * 3, y: c.hip.y + 12 + Math.cos(a * 0.8 + 3) * 3 };
        c.lean = Math.sin(a * 0.5) * 2;
      } else if (c.mode === 'dance') {
        c.danceT += dt;
        const beat = 0.5;
        const i = Math.min(DANCE.length - 1, Math.floor(c.danceT / beat));
        const prev = DANCE[Math.max(0, i - 1)], cur = DANCE[i];
        const k = i === 0 ? 1 : ease(phase(c.danceT - i * beat, 0, 0.2));
        const mixp = (a, z) => [lerp(a[0], z[0], k), lerp(a[1], z[1], k)];
        const hip = mixp(prev.hip, cur.hip);
        const bounce = Math.abs(Math.sin(Math.PI * c.danceT / (beat / 2))) * 1.2;
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
        c.hand.L = { x: s.L[0] - 1, y: s.L[1] + 15 + Math.sin(c.t * 2.2) * 0.4 };
        c.hand.R = { x: s.R[0] + 1, y: s.R[1] + 15 + Math.sin(c.t * 2.2) * 0.4 };
        c.lean = lerp(c.lean, 0, dt * 6);
      }
      const tx = c.hip.x + c.lean * 0.5;
      const hx = c.hip.x + c.lean;
      for (let s = 0, n = Math.max(1, Math.ceil(dt * 120)); s < n; s++) {
        stepChain(c.tails[0], tx - 5, c.hip.y + 0.5, dt / n);
        stepChain(c.tails[1], tx + 5, c.hip.y + 0.5, dt / n);
        const hy = c.hip.y - 27;
        [[-6, 5], [6, 5], [2, 0]].forEach(([ox, oy], i) => stepChain(c.hair[i], hx + ox, hy + oy, dt / n));
      }
    };

    c.draw = (g, ox, oy) => {
      const X = v => v - ox, Y = v => v - oy;
      const front = c.view === 'front';
      const s = shoulders();
      const hipL = [c.hip.x - 3, c.hip.y - 1], hipR = [c.hip.x + 3, c.hip.y - 1];
      const legL = ik(...hipL, c.foot.L.x, c.foot.L.y, THIGH, SHIN, 1);
      const legR = ik(...hipR, c.foot.R.x, c.foot.R.y, THIGH, SHIN, -1);
      const armL = ik(...s.L, c.hand.L.x, c.hand.L.y, UPPER, FORE, -1);
      const armR = ik(...s.R, c.hand.R.x, c.hand.R.y, UPPER, FORE, 1);
      const P = (x, y) => [X(x), Y(y)];
      const drawTail = ch => {
        const p = ch.pts;
        for (let i = 1; i < p.length; i++) seg(g, X(p[i - 1].x), Y(p[i - 1].y), X(p[i].x), Y(p[i].y), 5, PAL.k);
        for (let i = 1; i < p.length; i++) seg(g, X(p[i - 1].x), Y(p[i - 1].y), X(p[i].x), Y(p[i].y), 3, front ? PAL.J : PAL.q);
      };
      const drawLeg = (hip, leg, foot, shoe) => {
        limb(g, [P(...hip), P(leg[0], leg[1]), P(leg[2], leg[3])], 5, PAL.P, PAL.p, PAL.B);
        g.drawImage(shoe, Math.round(X(foot.x) - (shoe === SPR.shoeL ? 5 : 1)), Math.round(Y(foot.y) - 1));
      };
      const drawArm = (sh, arm) => {
        limb(g, [P(...sh), P(arm[0], arm[1]), P(arm[2], arm[3])], 4, PAL.J, PAL.j, PAL.q);
        const cx = lerp(arm[0], arm[2], 0.8), cy = lerp(arm[1], arm[3], 0.8);
        g.fillStyle = PAL.W;
        g.fillRect(Math.round(X(cx) - 1), Math.round(Y(cy) - 1), 2, 2);
        g.drawImage(SPR.hand, Math.round(X(arm[2]) - 2), Math.round(Y(arm[3]) - 2));
      };
      const drawHair = () => c.hair.forEach(ch => {
        const p = ch.pts;
        for (let i = 1; i < p.length; i++) seg(g, X(p[i - 1].x), Y(p[i - 1].y), X(p[i].x), Y(p[i].y), 3, PAL.k);
        for (let i = 1; i < p.length; i++) seg(g, X(p[i - 1].x), Y(p[i - 1].y), X(p[i].x), Y(p[i].y), 1, i === 1 ? PAL.H : PAL.h);
      });
      drawTail(c.tails[0]);
      drawTail(c.tails[1]);
      drawLeg(hipL, legL, c.foot.L, SPR.shoeL);
      drawLeg(hipR, legR, c.foot.R, SPR.shoeR);
      const tx = Math.round(X(c.hip.x + c.lean * 0.5) - 7), ty = Math.round(Y(c.hip.y) - 13);
      g.drawImage(front ? SPR.torsoF : SPR.torsoB, tx, ty);
      drawHair();
      const head = front ? (c.wink ? SPR.headFWink : SPR.headF) : SPR.headB;
      g.drawImage(head, Math.round(X(c.hip.x + c.lean) - 8), Math.round(Y(c.hip.y) - 28));
      drawArm(s.L, armL);
      drawArm(s.R, armR);
    };

    return c;
  }

  return { create, PAL };
})();
