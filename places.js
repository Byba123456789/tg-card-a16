// локации квестов: пол FW×FH, стена сверху (y < 0), предметы с сортировкой по y, надписи
// C: { R, box, disc, b, OUTLINE, view() → { W, H, ox, oy }, st }
const Places = C => {
  const { R, box, b, OUTLINE } = C;
  const FW = 224, FH = 124;
  const fillScreen = col => { b.fillStyle = col; b.fillRect(0, 0, C.view().W, C.view().H); };
  // по экранной ширине: от левого края экрана до правого (в координатах пола)
  const span = () => { const { W, ox } = C.view(); return [-ox, W]; };
  const disc = (x, y, r, col) => { const { ox, oy } = C.view(); C.disc(ox + x, oy + y, r, col); };

  function tree(x, y, cols) {
    R(x - 2, y - 14, 4, 14, OUTLINE);
    R(x - 1, y - 14, 2, 14, '#6a4224');
    disc(x, y - 22, 12, OUTLINE);
    disc(x, y - 22, 11, cols[0]);
    disc(x - 4, y - 25, 6, cols[1]);
    disc(x + 4, y - 19, 5, cols[2]);
    disc(x - 3, y - 28, 2, '#f7d070');
  }
  const leafPile = (x, y) => { for (let i = 0; i < 7; i++) R(x + (i * 7) % 13 - 6, y + (i * 5) % 5 - 2, 2, 1, ['#d9822b', '#c0392b', '#e0a030'][i % 3]); };

  // --- ОКА снаружи: белый фасад с оранжевыми арками, стекло, вход по центру ---
  const oka = {
    solids: [[150, 94, 40, 14], [18, 98, 26, 5], [4, 36, 8, 6], [FW - 16, 42, 8, 6], [70, 12, 3, 3], [151, 12, 3, 3]],
    door: [100, 124],
    ground() {
      fillScreen('#55585f');
      const [x0, w] = span();
      R(x0, -70, w, 16, '#f2c48c');
      R(x0, -60, w, 6, '#e9a868');
      // фасад
      R(x0, -54, w, 50, '#e9ecef');
      for (let y = -54; y < -4; y += 9) R(x0, y, w, 1, '#d5d9de');
      for (let x = Math.floor(x0 / 16) * 16; x < x0 + w; x += 16) R(x, -54, 1, 50, '#dde1e5');
      R(x0, -57, w, 3, '#f0a020');
      R(x0, -58, w, 1, '#8a8f98');
      for (let x = Math.floor(x0 / 6) * 6; x < x0 + w; x += 6) R(x, -62, 1, 4, '#8a8f98');
      R(x0, -62, w, 1, '#8a8f98');
      // арки-«рогатки»
      for (let cx = Math.floor(x0 / 70) * 70 - 6; cx < x0 + w + 40; cx += 70) {
        if (cx > 60 && cx < 170) continue;
        for (let y = -52; y < -14; y++) {
          const t = (y + 52) / 38, l = cx - 28 + t * 25, r = cx + 22 - t * 25;
          R(Math.round(l), y, 7, 1, '#f0a020');
          R(Math.round(l), y, 1, 1, '#c97a12');
          R(Math.round(r), y, 7, 1, '#f0a020');
          R(Math.round(r) + 6, y, 1, 1, '#c97a12');
        }
        R(cx - 3, -14, 7, 10, '#f0a020');
        R(cx + 3, -14, 1, 10, '#c97a12');
      }
      // стеклянный блок
      R(78, -66, 68, 62, '#f0a020');
      for (let y = -64; y < -4; y++) R(80, y, 64, 1, y < -40 ? '#8fbfe0' : y < -22 ? '#6f9fc8' : '#5d8fb8');
      for (let x = 80; x < 144; x += 8) R(x, -64, 1, 60, '#e8eef3');
      for (let y = -64; y < -4; y += 10) R(80, y, 64, 1, '#e8eef3');
      for (let i = 0; i < 18; i++) R(86 + i, -60 + i * 2, 2, 2, '#ffffff');
      for (let i = 0; i < 10; i++) R(120 + i, -40 + i * 2, 2, 2, '#d6ecfa');
      // витрины снизу
      R(x0, -13, w, 9, '#3a2a22');
      for (let x = Math.floor(x0 / 40) * 40 + 6; x < x0 + w; x += 40) if (x < 88 || x > 136) R(x, -11, 26, 5, ['#e8432a', '#f5a623', '#7b3fa0', '#2e8a57'][((x / 40) % 4 + 4) % 4 | 0]);
      // вход
      R(98, -16, 28, 16, '#f4f4f4');
      R(100, -14, 24, 14, '#2c3e50');
      R(111, -14, 2, 14, '#f4f4f4');
      R(102, -12, 3, 8, '#46607a');
      R(115, -12, 3, 8, '#46607a');
      // тротуар у здания, бордюр, парковка
      R(x0, 0, w, 16, '#b9bcc2');
      for (let x = Math.floor(x0 / 8) * 8; x < x0 + w; x += 8) R(x, 0, 1, 16, '#a9adb3');
      R(x0, 8, w, 1, '#a9adb3');
      R(x0, 16, w, 2, '#8d9096');
      for (let i = 0; i < 90; i++) R((i * 53) % FW, 20 + (i * 37) % 100, 1, 1, i % 2 ? '#4c4f55' : '#62656c');
      R(0, 74, FW, 1, '#e8e8e8');
      for (let x = 8; x < FW; x += 28) R(x, 74, 2, 50, '#e8e8e8');
      leafPile(30, 50); leafPile(190, 64); leafPile(120, 110);
    },
    props: [
      [42, () => tree(8, 42, ['#d9822b', '#e0a030', '#c0392b'])],
      [48, () => tree(FW - 12, 48, ['#c0392b', '#e0603a', '#e0a030'])],
      [15, () => { for (const x of [70, 151]) { R(x, -18, 3, 33, OUTLINE); R(x + 1, -18, 1, 33, '#4a4d55'); R(x - 2, -20, 7, 3, '#2a2c32'); R(x - 1, -18, 5, 1, '#fff3b0'); } }],
      [103, () => { box(18, 98, 26, 5, 4, '#8a5a32', '#6a4224'); R(20, 103, 2, 3, OUTLINE); R(40, 103, 2, 3, OUTLINE); }],
      // оранжевый спорткар с картинки
      [108, () => {
        box(150, 94, 40, 14, 6, '#f0883a', '#c45a1a');
        R(162, 86, 16, 6, '#2c3e50');
        R(164, 87, 5, 2, '#5d7a96');
        R(150, 100, 3, 2, '#fff3b0');
        R(187, 100, 3, 2, '#e74c3c');
        for (const x of [154, 180]) { R(x, 104, 6, 4, OUTLINE); R(x + 1, 105, 4, 2, '#3a3a3a'); }
      }],
    ],
    signs: [['ОКА', 112, -20, 7, '#f0a020'], ['О’КЕЙ', 40, -24, 4.5, '#e8432a']],
  };

  // --- фудкорт: плитка, ларьки вдоль стены, столики ---
  const TABLES = [[34, 34], [96, 30], [158, 36], [50, 84], [118, 90], [180, 82]];
  const food = {
    solids: [[0, 0, FW, 8], ...TABLES.map(([x, y]) => [x, y, 18, 10])],
    ground() {
      fillScreen('#1c1814');
      for (let y = 0; y < FH; y += 12) for (let x = 0; x < FW; x += 12) R(x, y, 12, 12, ((x + y) / 12) % 2 ? '#e9e1d2' : '#ddd3c0');
      for (let y = 0; y < FH; y += 12) R(0, y, FW, 1, '#cbbfa8');
      R(0, -40, FW, 40, '#f2ece2');
      R(0, -40, FW, 3, '#d9d0c0');
      const STALLS = [['#2e8a57', '#e9f5ec'], ['#d84a1b', '#fff2df'], ['#f2b22a', '#3a2a1c'], ['#2a6fb5', '#eaf2fb']];
      STALLS.forEach(([c, t], i) => {
        const x = 4 + i * 55;
        R(x, -34, 50, 12, c);
        R(x, -22, 50, 3, '#00000033');
        for (let k = 0; k < 50; k += 6) R(x + k, -19, 3, 3, c);
        R(x + 3, -16, 44, 14, '#3a3530');
        R(x + 5, -14, 40, 10, '#4b443d');
        R(x + 8, -12, 6, 3, t);
        R(x + 30, -11, 8, 2, '#f5d6a0');
      });
      box(0, 0, FW, 8, 6, '#cfc6b6', '#a89e8c');
      for (let x = 10; x < FW; x += 20) R(x, -4, 6, 2, ['#e74c3c', '#f1c40f', '#ecf0f1'][x % 3]);
      // стены по бокам, справа выход
      R(-6, -40, 6, FH + 46, '#bfb4a2');
      R(FW, -40, 6, 46 + 44, '#bfb4a2');
      R(FW, 92, 6, FH - 86, '#bfb4a2');
      R(FW, 50, 6, 42, '#2a2420');
      R(-6, FH, FW + 12, 6, '#bfb4a2');
    },
    props: TABLES.map(([x, y]) => [y + 10, () => {
      box(x - 6, y + 3, 5, 5, 5, '#d35400', '#a04000');
      box(x + 19, y + 3, 5, 5, 5, '#d35400', '#a04000');
      box(x, y, 18, 10, 7, '#f6f6f6', '#c8c8c8');
      R(x + 4, y - 5, 4, 3, '#e0a030');
      R(x + 11, y - 4, 3, 2, '#e74c3c');
    }]),
    signs: [['ШАУРМА', 29, -26, 4.5, '#ffffff'], ['ВКУСНО', 84, -26, 4.5, '#ffffff'], ['ПИЦЦА', 139, -26, 4.5, '#3a2a1c'], ['СУШИ', 194, -26, 4.5, '#ffffff']],
  };

  // --- перед Бургер Кингом: коридор ТЦ, витрина, закрытая дверь ---
  const bk = {
    solids: [[0, 0, 52, 6], [172, 0, 52, 6], [40, 8, 8, 8], [176, 8, 8, 8], [70, 100, 24, 5], [130, 100, 24, 5]],
    ground() {
      fillScreen('#1a1a1e');
      for (let y = 0; y < FH; y += 16) for (let x = 0; x < FW; x += 16) R(x, y, 16, 16, ((x + y) / 16) % 2 ? '#c9ccd2' : '#bfc3ca');
      for (let i = 0; i < 6; i++) R(20 + i * 36, 30 + (i % 3) * 25, 10, 1, '#e2e5ea');
      R(0, -44, FW, 44, '#9aa0a8');
      for (const x of [0, 172]) {
        R(x, -38, 52, 38, '#7d838c');
        for (let y = -36; y < 0; y += 3) R(x + 2, y, 48, 1, '#6a7079');
        box(x, 0, 52, 6, 3, '#8a9099', '#6a7079');
      }
      // витрина Бургер Кинга
      R(52, -44, 120, 44, '#a8141e');
      R(52, -44, 120, 12, '#f5a623');
      R(52, -32, 120, 2, '#7a0e14');
      for (const x of [58, 134]) {
        R(x, -28, 32, 24, '#2a1a14');
        for (let y = -28; y < -12; y += 2) R(x, y, 32, 1, '#8a8f98');
      }
      const open = C.st.bkOpen;
      R(98, -28, 28, 28, '#f4f4f4');
      R(100, -26, 24, 26, open ? '#140c08' : '#3a2a22');
      if (!open) {
        for (let i = 0; i < 24; i += 3) { R(100 + i, -16 + (i % 6 ? 1 : 0), 2, 1, '#c8c8c8'); }
        R(108, -18, 8, 6, '#d4a017');
        R(110, -21, 4, 3, OUTLINE);
        R(111, -16, 2, 2, OUTLINE);
      } else R(102, -8, 20, 8, '#2a1610');
    },
    props: [
      [16, () => { for (const x of [40, 176]) { box(x, 8, 8, 8, 8, '#8a5a32', '#6a4224'); disc(x + 4, -8, 7, OUTLINE); disc(x + 4, -8, 6, '#3a7a3a'); disc(x + 2, -10, 3, '#5fae4a'); } }],
      [105, () => { box(70, 100, 24, 5, 4, '#6a7079', '#4a5059'); box(130, 100, 24, 5, 4, '#6a7079', '#4a5059'); }],
    ],
    signs: [['БУРГЕР КИНГ', 112, -36, 6, '#a8141e']],
  };

  // --- внутри Бургер Кинга: стойка, меню, Рома на стуле ---
  const bkin = {
    solids: [[20, 0, 184, 10], [30, 70, 16, 10], [178, 70, 16, 10], [104, 30, 16, 6]],
    ground() {
      fillScreen('#140c08');
      for (let y = 0; y < FH; y += 10) for (let x = 0; x < FW; x += 10) R(x, y, 10, 10, ((x + y) / 10) % 2 ? '#7a2a1a' : '#8e3a22');
      R(0, -40, FW, 40, '#5a1e12');
      for (let i = 0; i < 4; i++) {
        const x = 30 + i * 44;
        R(x, -36, 36, 18, OUTLINE);
        R(x + 1, -35, 34, 16, '#f5d6a0');
        R(x + 4, -31, 10, 3, '#c8781e');
        R(x + 4, -28, 10, 2, '#5a8a2a');
        R(x + 4, -26, 10, 3, '#c8781e');
        R(x + 18, -32, 14, 1, '#7a2a1a');
        R(x + 18, -29, 10, 1, '#7a2a1a');
        R(x + 18, -26, 12, 1, '#7a2a1a');
      }
      box(20, 0, 184, 10, 10, '#d8d2c8', '#a8141e');
      R(20, -2, 184, 1, '#f5a623');
      R(-6, -40, 6, FH + 46, '#5a1e12');
      R(FW, -40, 6, FH + 46, '#5a1e12');
      R(-6, FH, 100, 6, '#5a1e12');
      R(130, FH, FW - 124, 6, '#5a1e12');
    },
    props: [
      [80, () => { box(30, 70, 16, 10, 7, '#e8e0d0', '#b8ad98'); box(178, 70, 16, 10, 7, '#e8e0d0', '#b8ad98'); }],
      [36, () => { box(104, 30, 16, 6, 6, '#6a4224', '#4a2e18'); box(104, 30, 16, 3, 14, '#6a4224', '#4a2e18', 6); }],
    ],
    signs: [],
  };


  // --- вышка у Пушкина: осенний лес, тропинка, решётчатая вышка с площадкой наверху ---
  const TOP = -30, BASE = 24;
  function drawTower() {
    const legL = y => 94 + (BASE - y) * 0.16, legR = y => 130 - (BASE - y) * 0.16;
    for (let y = TOP; y <= BASE; y++) {
      R(Math.round(legL(y)) - 1, y, 4, 1, OUTLINE);
      R(Math.round(legL(y)), y, 2, 1, '#9aa3ad');
      R(Math.round(legR(y)) - 1, y, 4, 1, OUTLINE);
      R(Math.round(legR(y)), y, 2, 1, '#7d8690');
    }
    // раскосы крест-накрест
    for (let y0 = TOP + 4; y0 < BASE - 4; y0 += 12) {
      for (let i = 0; i <= 12; i++) {
        const y = y0 + i, l = legL(y) + 1, r = legR(y);
        R(Math.round(l + (r - l) * i / 12), y, 1, 1, '#8a939e');
        R(Math.round(r - (r - l) * i / 12), y, 1, 1, '#6d7680');
      }
      R(Math.round(legL(y0)), y0, Math.round(legR(y0) - legL(y0)) + 2, 1, '#8a939e');
    }
    for (let y = TOP + 2; y < BASE; y += 3) R(110, y, 5, 1, '#c8ced6');
    R(109, TOP, 1, BASE - TOP, '#6d7680');
    R(115, TOP, 1, BASE - TOP, '#6d7680');
    // площадка с перилами
    R(96, TOP - 1, 33, 4, OUTLINE);
    R(97, TOP, 31, 2, '#b8c0c8');
    R(96, TOP - 9, 1, 8, '#6d7680');
    R(128, TOP - 9, 1, 8, '#6d7680');
    R(96, TOP - 9, 33, 1, '#8a939e');
    R(96, TOP - 5, 33, 1, '#8a939e');
  }
  const tower = {
    solids: [[92, BASE - 4, 8, 6], [125, BASE - 4, 8, 6], [6, 30, 10, 6], [206, 44, 10, 6], [30, 98, 12, 6], [184, 94, 12, 6]],
    ground() {
      fillScreen('#3b5527');
      const [x0, w] = span();
      R(x0, -100, w, 60, '#a9cbe6');
      R(x0, -52, w, 12, '#f3cf9a');
      for (let x = Math.floor(x0 / 12) * 12 - 12, i = 0; x < x0 + w + 12; x += 12, i++) {
        disc(x, -36 + (i % 3) * 3, 11, ['#2f4a24', '#c0612a', '#3a5a2a', '#d9a030'][i % 4]);
        disc(x + 5, -28 + (i % 2) * 4, 9, ['#3a5a2a', '#2f4a24', '#c8742e'][i % 3]);
      }
      R(x0, -22, w, 22, '#2e4620');
      for (let i = 0; i < 160; i++) R((i * 47) % FW, (i * 29) % FH, 1, 2, i % 3 ? '#4d6a32' : '#5d7a3c');
      for (let y = 0; y < FH; y++) R(Math.round(102 + Math.sin(y * 0.05) * 6), y, 22, 1, y % 4 ? '#9a7a52' : '#8a6a44');
      leafPile(40, 60); leafPile(170, 30); leafPile(200, 100); leafPile(60, 110);
      if (C.st.tramp) {
        const [tx, ty] = C.st.tramp;
        disc(tx, ty, 13, OUTLINE);
        disc(tx, ty, 12, '#2a6fb5');
        disc(tx, ty, 9, '#1c1c22');
        disc(tx - 3, ty - 2, 3, '#3a3a46');
      }
    },
    props: [
      [BASE, drawTower],
      [36, () => tree(10, 36, ['#d9822b', '#e0a030', '#c0392b'])],
      [50, () => tree(FW - 10, 50, ['#3a5a2a', '#c0612a', '#e0a030'])],
      [104, () => tree(36, 104, ['#c0392b', '#e0603a', '#e0a030'])],
      [100, () => tree(190, 100, ['#e0a030', '#d9822b', '#3a5a2a'])],
    ],
    signs: [],
  };

  // --- пиццерия-хоррор: тёмный зал со сценой, подсобка с запчастями ---
  const pizza1 = {
    dark: true,
    solids: [[38, 40, 26, 10], [160, 40, 26, 10], [38, 88, 26, 10], [160, 88, 26, 10]],
    ground() {
      fillScreen('#08060c');
      for (let y = 0; y < FH; y += 8) for (let x = 0; x < FW; x += 8) R(x, y, 8, 8, ((x + y) / 8) % 2 ? '#e8e2d6' : '#1c1a20');
      R(0, -44, FW, 44, '#2a1630');
      for (let x = 0; x < FW; x += 6) R(x, -44, 3, 44, '#30193a');
      R(0, -6, FW, 6, '#1a0e1e');
      // сцена с занавесом
      R(64, -40, 96, 36, '#120a16');
      for (let i = 0; i < 6; i++) { R(64 + i * 3, -40, 3, 36, i % 2 ? '#8a1a2a' : '#a8243a'); R(157 - i * 3, -40, 3, 36, i % 2 ? '#8a1a2a' : '#a8243a'); }
      for (let i = 0; i < 7; i++) R(84 + i * 9, -34 + (i % 2) * 4, 2, 2, '#ffd23f');
      box(64, 0, 96, 4, 6, '#5a3a22', '#3e2616');
      // плакаты
      for (const [x, c] of [[14, '#e74c3c'], [184, '#3498db']]) { R(x, -34, 22, 26, OUTLINE); R(x + 1, -33, 20, 24, c); R(x + 5, -28, 12, 10, '#f4d6a0'); }
      R(FW, 50, 6, 32, '#000000');
    },
    props: [[40, () => {
      for (const [x, y] of [[38, 40], [160, 40], [38, 88], [160, 88]]) {
        box(x, y, 26, 10, 6, '#f4f4f4', '#c8c8c8');
        R(x + 3, y - 9, 4, 4, '#e74c3c'); R(x + 4, y - 11, 2, 2, '#ffd23f');
        R(x + 18, y - 9, 4, 4, '#3498db'); R(x + 19, y - 11, 2, 2, '#ffd23f');
        R(x + 10, y - 8, 6, 2, '#e0a030');
      }
    }]],
    signs: [['ВЕСЁЛЫЙ МИШКА', 112, -14, 5.5, '#ffd23f'], ['ПИЦЦА', 25, -16, 4, '#ffffff'], ['ВЕСЕЛИСЬ!', 195, -16, 3.6, '#ffffff']],
  };
  const pizza2 = {
    dark: true,
    solids: [[0, 0, FW, 10], [104, 30, 16, 6]],
    ground() {
      fillScreen('#08060c');
      for (let y = 0; y < FH; y += 12) for (let x = 0; x < FW; x += 12) R(x, y, 12, 12, ((x + y) / 12) % 2 ? '#3a3a40' : '#323238');
      R(0, -40, FW, 40, '#24242a');
      // стеллажи с головами аниматроников
      for (let i = 0; i < 6; i++) {
        const x = 6 + i * 36;
        box(x, 0, 30, 10, 30, '#4a3a2a', '#2e241a');
        R(x + 4, -24, 8, 7, ['#8a5a32', '#7a5cc0', '#f2c230', '#c0392b'][i % 4]);
        R(x + 6, -21, 1, 1, '#ff3b3b'); R(x + 9, -21, 1, 1, '#ff3b3b');
        R(x + 16, -22, 10, 5, '#6a6a72');
        R(x + 4, -9, 22, 4, '#5a5a62');
      }
      R(-6, -40, 6, FH + 46, '#1a1a1e');
      R(FW, -40, 6, FH + 46, '#1a1a1e');
    },
    props: [[36, () => { box(104, 30, 16, 6, 6, '#6a4224', '#4a2e18'); box(104, 30, 16, 3, 14, '#6a4224', '#4a2e18', 6); }]],
    signs: [['ЗАПЧАСТИ', 112, -30, 5, '#ff6b6b']],
  };

  // --- космос: каменная плита висит перед чёрной дырой ---
  const bh = document.createElement('canvas');
  let bhKey = '';
  const rnd = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  // фон рисуется один раз на размер экрана: звёзды, туманности, диск аккреции, линзированное кольцо, горизонт
  function paintBlackHole(W, H, cx, cy, R) {
    bh.width = W; bh.height = H;
    const x = bh.getContext('2d');
    x.fillStyle = '#03020a';
    x.fillRect(0, 0, W, H);
    for (const [fx, fy, r, col] of [[0.15, 0.25, 0.5, 'rgba(90,40,160,.35)'], [0.85, 0.2, 0.45, 'rgba(30,70,160,.3)'], [0.6, 0.8, 0.5, 'rgba(160,40,90,.22)'], [0.3, 0.75, 0.35, 'rgba(40,120,150,.2)']]) {
      const gr = x.createRadialGradient(fx * W, fy * H, 0, fx * W, fy * H, r * W);
      gr.addColorStop(0, col);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = gr;
      x.fillRect(0, 0, W, H);
    }
    for (let i = 0; i < 420; i++) {
      const b = rnd(i * 3.1);
      x.fillStyle = b > 0.97 ? '#ffffff' : b > 0.85 ? '#cfd8ff' : b > 0.6 ? '#8a90b8' : '#4a4e6a';
      x.fillRect(Math.floor(rnd(i) * W), Math.floor(rnd(i * 7.7) * H), b > 0.97 ? 2 : 1, 1);
    }
    // свечение вокруг дыры
    const glow = x.createRadialGradient(cx, cy, R * 0.8, cx, cy, R * 4);
    glow.addColorStop(0, 'rgba(255,170,80,.35)');
    glow.addColorStop(0.4, 'rgba(255,90,40,.12)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = glow;
    x.fillRect(0, 0, W, H);
    const disk = (from, to) => {
      for (let i = 0; i < 70; i++) {
        const k = i / 70, rx = R * (1.25 + k * 2.4), ry = rx * 0.2;
        x.strokeStyle = `rgba(${255},${Math.round(240 - k * 170)},${Math.round(200 - k * 190)},${(1 - k) * 0.55})`;
        x.lineWidth = 1.2;
        x.beginPath();
        x.ellipse(cx, cy, rx, ry, -0.12, from, to);
        x.stroke();
      }
    };
    disk(Math.PI, Math.PI * 2);
    // линзированное кольцо: задняя часть диска видна над и под горизонтом
    for (let i = 0; i < 26; i++) {
      const k = i / 26;
      x.strokeStyle = `rgba(255,${Math.round(225 - k * 120)},${Math.round(170 - k * 140)},${(1 - k) * 0.6})`;
      x.lineWidth = 1;
      x.beginPath();
      x.ellipse(cx, cy, R * (1.08 + k * 0.7), R * (1.08 + k * 0.7) * 0.95, -0.12, 0, Math.PI * 2);
      x.stroke();
    }
    x.fillStyle = '#000000';
    x.beginPath();
    x.arc(cx, cy, R, 0, Math.PI * 2);
    x.fill();
    x.strokeStyle = 'rgba(255,245,220,.95)';
    x.lineWidth = 1.2;
    x.beginPath();
    x.arc(cx, cy, R * 1.04, 0, Math.PI * 2);
    x.stroke();
    disk(0, Math.PI);
  }
  const space = {
    solids: [],
    ground() {
      const { W, H, ox, oy } = C.view();
      const cx = Math.round(W / 2), cy = oy - 30, rad = Math.round(Math.min(W, H) * 0.12);
      const key = `${W}x${H}x${cy}`;
      if (key !== bhKey) { bhKey = key; paintBlackHole(W, H, cx, cy, rad); }
      b.drawImage(bh, 0, 0);
      // вещество в диске крутится
      const t = C.st.t;
      for (let i = 0; i < 90; i++) {
        const k = rnd(i * 5.3), a = t * (0.9 - k * 0.6) + i * 2.4, rx = rad * (1.3 + k * 2.2);
        const px = cx + Math.cos(a) * rx, py = cy + Math.sin(a) * rx * 0.2 - Math.cos(a) * rx * 0.012;
        if (Math.sin(a) < 0 && Math.hypot(px - cx, (py - cy) * 1.05) < rad * 1.05) continue;
        b.globalAlpha = 0.5 + 0.5 * (1 - k);
        b.fillStyle = k < 0.3 ? '#fff6e0' : k < 0.65 ? '#ffb35a' : '#ff6a3a';
        b.fillRect(Math.round(px), Math.round(py), k < 0.3 ? 2 : 1, 1);
      }
      b.globalAlpha = 1;
      // каменная плита: неровный край, кратеры, светящиеся трещины
      for (let y = -4; y < FH + 6; y++) {
        const edge = 6 + Math.round(Math.sin(y * 0.3) * 3 + rnd(y) * 3);
        R(-edge, y, FW + edge * 2, 1, y < 0 || y > FH ? '#2a2830' : (y % 7 === 0 ? '#3e3b46' : '#46434e'));
        R(-edge - 1, y, 1, 1, '#6a6578');
        R(FW + edge, y, 1, 1, '#1e1c24');
      }
      R(-10, FH + 6, FW + 20, 3, '#1a1820');
      for (let i = 0; i < 160; i++) R((i * 53) % FW, (i * 31) % FH, 2, 1, i % 3 ? '#3a3742' : '#56525e');
      for (const [x0, y0, r] of [[40, 30, 7], [170, 22, 5], [190, 90, 8], [70, 100, 6], [130, 60, 4]]) { disc(x0, y0, r + 1, '#2e2c34'); disc(x0, y0, r, '#3a3742'); disc(x0 - 1, y0 - 1, r - 2, '#34313c'); }
      b.globalAlpha = 0.5 + 0.3 * Math.sin(t * 3);
      for (const [x0, y0, x1, y1] of [[20, 70, 60, 84], [150, 40, 200, 30], [100, 110, 130, 96]]) for (let i = 0; i <= 20; i++) R(Math.round(x0 + (x1 - x0) * i / 20), Math.round(y0 + (y1 - y0) * i / 20 + Math.sin(i) * 1.5), 1, 1, '#b388ff');
      b.globalAlpha = 1;
    },
    props: [],
    signs: [],
  };

  // --- дома у Артемия: гостиная с кухонным столом, тортом и всем барахлом ---
  const home = {
    solids: [],
    ground() {
      fillScreen('#120c0a');
      const t = C.st.t;
      // пол: ёлочка из досок и ковёр под столом
      for (let y = 0; y < FH; y += 4) for (let x = (y / 4 % 2) * 6; x < FW; x += 12) {
        R(x, y, 11, 4, (x + y) % 3 ? '#8a5a38' : '#7c5032');
        R(x, y + 3, 11, 1, '#5e3a22');
      }
      R(56, 40, 112, 48, '#7a1f2a');
      R(58, 42, 108, 44, '#9b2c36');
      for (let x = 62; x < 164; x += 8) { R(x, 46, 4, 2, '#e0b060'); R(x + 2, 80, 4, 2, '#e0b060'); }
      for (let y = 50; y < 78; y += 6) { R(62, y, 2, 2, '#e0b060'); R(160, y, 2, 2, '#e0b060'); }
      // стена: обои с ромбиками, плинтус
      R(-8, -48, FW + 16, 48, '#e9dcc4');
      for (let y = -46; y < -4; y += 8) for (let x = (y / 8 % 2) * 6 - 6; x < FW + 8; x += 12) { R(x, y, 1, 1, '#d4c3a4'); R(x - 1, y + 1, 3, 1, '#d4c3a4'); R(x, y + 2, 1, 1, '#d4c3a4'); }
      R(-8, -4, FW + 16, 4, '#b89a74');
      R(-8, -4, FW + 16, 1, '#d8bf9a');
      // окно ночью: город, луна, шторы
      R(84, -42, 56, 30, OUTLINE);
      R(85, -41, 54, 28, '#14203c');
      disc(130, -34, 4, '#f4ecc8');
      for (let i = 0; i < 9; i++) { const h = 6 + (i * 7) % 9; R(86 + i * 6, -13 - h, 5, h, '#22304e'); if (i % 2) R(88 + i * 6, -10 - h, 1, 1, '#ffd36a'); }
      R(111, -41, 2, 28, '#e9dcc4');
      R(84, -28, 56, 1, '#e9dcc4');
      for (const x of [78, 140]) { R(x, -46, 8, 38, '#3d6f8a'); R(x + 2, -46, 1, 38, '#5a8eac'); R(x + 5, -46, 1, 38, '#2c5468'); }
      R(74, -47, 76, 2, '#5e3a22');
      // рамки с фото компашки, часы
      for (const [x, y, c] of [[16, -40, '#3d6f8a'], [32, -36, '#c0612a'], [168, -40, '#2e8a57'], [186, -36, '#7b3fa0']]) {
        R(x, y, 12, 10, '#5e3a22'); R(x + 1, y + 1, 10, 8, c); R(x + 3, y + 3, 2, 3, '#f0c4a2'); R(x + 7, y + 3, 2, 3, '#f0c4a2');
      }
      disc(52, -34, 6, OUTLINE);
      disc(52, -34, 5, '#fbf7f0');
      R(52, -38, 1, 4, OUTLINE); R(52, -34, 3, 1, OUTLINE);
      // гирлянда и надпись
      for (let i = 0; i < 24; i++) {
        const x = -4 + i * 10, y = -46 + Math.round(Math.sin(i * 0.6) * 2);
        R(x, y, 6, 1, '#3a2a22');
        for (let k = 0; k < 4; k++) R(x + k, y + 1 + k, 6 - k * 2, 1, ['#e74c3c', '#f1c40f', '#3498db', '#2ecc71', '#9b59b6'][i % 5]);
      }
      // торшер светит
      b.globalAlpha = 0.18 + 0.03 * Math.sin(t * 2);
      disc(214, -6, 26, '#ffd98a');
      b.globalAlpha = 1;
    },
    props: [
      // полка с книгами и медалью за скалолазание
      [-2, () => {
        box(4, -2, 40, 6, 22, '#6a4224', '#4a2e18');
        [['#c0392b', 3], ['#2f5fb0', 2], ['#e0a030', 3], ['#2e8a57', 2], ['#7a3fa0', 3], ['#e0e0e0', 2]].forEach(([c, w], i) => R(6 + i * 5, -22, w + 1, 9, c));
        R(34, -20, 6, 6, '#e0a030'); R(36, -24, 2, 4, '#c0392b');
        R(6, -11, 34, 1, '#4a2e18');
        R(8, -10, 8, 6, '#3a7a3a'); R(9, -12, 2, 3, '#5fae4a'); R(13, -13, 2, 4, '#5fae4a');
      }],
      // телевизор на тумбе, на экране игра
      [10, () => {
        box(178, 2, 40, 8, 10, '#5e3a22', '#3e2616');
        R(184, -26, 28, 18, OUTLINE);
        R(185, -25, 26, 16, '#1a2a4a');
        R(187, -16, 6, 4, '#f0c4a2'); R(195, -20, 4, 8, '#7a593b'); R(203, -14, 6, 2, '#2e8a57');
        R(197, -8, 2, 3, OUTLINE);
        R(186, 2, 6, 3, '#26262e'); R(194, 3, 4, 2, '#b05cff');
      }],
      // диван справа с подушками
      [100, () => {
        box(184, 64, 38, 34, 10, '#3d6f8a', '#2c5468');
        box(184, 64, 6, 34, 18, '#335f78', '#24485c');
        R(194, 58, 10, 8, '#e0a030'); R(208, 60, 9, 8, '#c0392b');
      }],
      // монстера в кадке слева и торшер справа сзади
      [104, () => {
        box(6, 96, 14, 10, 12, '#c8742e', '#9a5420');
        for (const [x, y, r] of [[13, 76, 9], [6, 82, 6], [20, 80, 7], [13, 68, 6]]) { disc(x, y, r + 1, OUTLINE); disc(x, y, r, '#2e7d32'); disc(x - 2, y - 2, Math.max(1, r - 4), '#4caf50'); }
      }],
      [6, () => { R(213, -30, 2, 36, '#3a3a40'); R(208, -36, 12, 6, '#ffe7a8'); R(208, -30, 12, 1, '#c8a060'); R(209, 4, 10, 2, '#3a3a40'); }],
      // стулья по бокам стола
      [62, () => { box(40, 56, 12, 10, 6, '#6a4224', '#4a2e18'); box(40, 56, 3, 10, 16, '#6a4224', '#4a2e18', 6); }],
      [63, () => { box(172, 56, 12, 10, 6, '#6a4224', '#4a2e18'); box(181, 56, 3, 10, 16, '#6a4224', '#4a2e18', 6); }],
      // стол: торт с 16 свечками, пицца, газировка, тарелки; шарики «16»
      [74, () => {
        box(64, 50, 96, 24, 12, '#f6f2ea', '#c8bfae');
        for (const [x, y] of [[74, 42], [146, 42], [74, 58], [146, 58]]) { disc(x, y, 5, '#d8d0c4'); disc(x, y, 4, '#ffffff'); }
        disc(96, 52, 8, OUTLINE); disc(96, 52, 7, '#e0a030');
        for (const [x, y] of [[93, 50], [99, 53], [95, 56], [100, 48]]) R(x, y, 2, 2, '#c0392b');
        R(132, 36, 4, 10, '#2e8a57'); R(133, 34, 2, 2, '#e0e0e0'); R(138, 38, 4, 8, '#c0392b'); R(139, 36, 2, 2, '#e0e0e0');
        box(104, 48, 18, 12, 9, '#ff8fb8', '#d4688f');
        R(104, 41, 18, 2, '#ffffff');
        for (let i = 0; i < 8; i++) {
          const x = 106 + (i % 4) * 4, y = 34 + Math.floor(i / 4) * 4;
          R(x, y, 1, 3, ['#3498db', '#f1c40f', '#2ecc71', '#e74c3c'][i % 4]);
          R(x, y - 1 - (Math.floor(C.st.t * 8 + i) % 2), 1, 1, '#ffd23f');
        }
      }],
      [20, () => {
        for (const [x, c, d] of [[30, '#e74c3c', 0], [38, '#3498db', 1.3]]) {
          const y = -8 + Math.round(Math.sin(C.st.t * 2 + d) * 2);
          R(x, y, 1, 26, '#c8c8c8');
          disc(x, y - 6, 6, OUTLINE); disc(x, y - 6, 5, c); R(x - 2, y - 9, 2, 2, '#ffffff');
        }
      }],
    ],
    signs: [['С ДНЁМ РОЖДЕНИЯ, АРТЕМИЙ!', 112, -50, 5, '#c0392b']],
  };

  return { oka, food, bk, bkin, tower, pizza1, pizza2, space, home, FW, FH, TOWER_TOP: TOP };
};
