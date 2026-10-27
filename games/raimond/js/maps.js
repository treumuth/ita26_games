// ==================== MAPS ====================
let MP = {};
function vn(x, y, sd) {   // smooth value noise 0..1 (used to shape forests, ponds and flower fields)
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, sm = q => q * q * (3 - 2 * q);
  const a = hsh(xi, yi, sd), b = hsh(xi + 1, yi, sd), c = hsh(xi, yi + 1, sd), d = hsh(xi + 1, yi + 1, sd), u = a + (b - a) * sm(xf), v = c + (d - c) * sm(xf);
  return u + (v - u) * sm(yf);
}
function buildLocal(n) {
  const B0 = BI[n], P = Object.assign({ to: '#1a1626', tuft2: '#000', pink: '#777', pink2: '#666', wt2: '#fff', wo: '#000' }, PAL[n]), w = B0.w, h = B0.h, R = rng(n.length * 977 + w * 7 + h), t = new Uint8Array(w * h), gt = new Uint8Array(w * h);
  const I = (x, y) => y * w + x, hub = B0.z[0], okc = (x, y) => x >= 0 && y >= 0 && x < w && y < h;
  const zd = (x, y) => { let m = 99; for (const z of B0.z) { const dx = Math.max(z.x - x, 0, x - (z.x + z.w - 1)), dy = Math.max(z.y - y, 0, y - (z.y + z.h - 1)); m = Math.min(m, Math.hypot(dx, dy)) } return m };
  const clr = (cx, cy, q) => { for (let y = cy - q; y <= cy + q; y++) for (let x = cx - q; x <= cx + q; x++) if (x > 1 && y > 1 && x < w - 2 && y < h - 2) t[I(x, y)] = 0 };
  const mp = { w, h, t, gt, cx: hub.x + (hub.w >> 1), cy: hub.y + (hub.h >> 1), door: null, arr: null, exit: null, zones: B0.z };
  const kz = z => ({ safe: 4, mob: 1, item: 3, story: 5 })[z.k];
  if (B0.fixed) {
    const cx = w >> 1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) t[I(x, y)] = (x < 2 || y < 2 || x >= w - 2 || y >= h - 2) ? 3 : 0;
    for (let y = 2; y < h - 2; y++) for (let x = cx - 1; x <= cx + 1; x++) gt[I(x, y)] = 2;
    if (n == 'castle') { [[6, 5], [6, 11], [w - 7, 5], [w - 7, 11], [6, 15], [w - 7, 15]].forEach(([x, y]) => t[I(x, y)] = 1); t[I(cx, h - 2)] = 5; mp.door = { x: cx, y: h - 2 }; mp.arr = { x: cx, y: h - 4 }; mp.cy = h - 5 }
    else if (n == 'shack') { t[I(cx, h - 2)] = 5; mp.door = { x: cx, y: h - 2 }; mp.arr = { x: cx, y: h - 4 }; mp.cy = h - 5 }
    else { for (let x = 5; x < w - 4; x += 4) { t[I(x, 5)] = 1; t[I(x, 11)] = 1 } t[I(cx, 1)] = 5; mp.door = { x: cx, y: 1 }; mp.arr = { x: cx, y: 4 }; mp.cy = 4 }
    mp.cx = cx;
  }
  // ---------- pre-render: base layer (ground, trunks, walls) + top layer (canopies drawn over characters) ----------
  const mk = () => { const c = document.createElement('canvas'); c.width = w * T; c.height = h * T; return c };
  mp.im = mk(); mp.tp = mk(); const g = mp.im.getContext('2d'), g2 = mp.tp.getContext('2d');
  const F = (x, y, ww, hh, c, G = g) => { G.fillStyle = c; G.fillRect(x, y, ww, hh) };
  const nbr = (x, y, v) => okc(x, y) && t[I(x, y)] == v, gnb = (x, y, v) => okc(x, y) && gt[I(x, y)] == v;
  const sprig = (x, y, c) => { F(x, y + 1, 1, 1, c); F(x + 1, y, 1, 2, c); F(x + 2, y + 1, 1, 1, c) };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const px = x * T, py = y * T, G = gt[I(x, y)], v = t[I(x, y)], nz = vn(x / 6, y / 6, 3);
    let col = P.a[nz > .6 ? 2 : nz < .4 ? 1 : 0]; if (G == 1) col = P.tall; if (G == 4) col = P.lawn; if (G == 5) col = (x + y) & 1 ? P.plaza : P.pl2; if (G == 2) col = P.path; if (G == 6) col = P.pink;
    F(px, py, T, T, col);
    for (let i = 0; i < 3; i++) F(px + (hsh(x, y, i) * 15 | 0), py + (hsh(x, y, i + 7) * 15 | 0), 1, 1, G == 2 ? P.path2 : G == 6 ? P.pink2 : P.sp);
    if (!B0.fixed) {
      if ((G == 0 || G == 4) && hsh(x, y, 3) < (G ? .14 : .3)) sprig(px + 2 + (hsh(x, y, 4) * 11 | 0), py + 3 + (hsh(x, y, 5) * 9 | 0), P.tuft);
      if (G == 1) for (let i = 0; i < 4; i++) { const a = px + 2 + i * 4, b = py + 3 + ((i * 5 + x) % 7); F(a, b, 1, 4, P.tuft2); F(a + 1, b + 1, 1, 3, P.tuft); F(a - 1, b + 2, 1, 2, P.tuft2) }
      if (G == 3 && hsh(x, y, 2) < .75) for (let i = 0; i < 2; i++) { const fx = px + 2 + (hsh(x, y, i + 20) * 10 | 0), fy = py + 2 + (hsh(x, y, i + 30) * 10 | 0), fc = P.fl[(hsh(x, y, i + 40) * 4) | 0]; F(fx, fy + 1, 3, 1, fc); F(fx + 1, fy, 1, 3, fc); F(fx + 1, fy + 1, 1, 1, '#ffe27a') }
      if (G == 5) { F(px, py + 15, T, 1, P.pl2); F(px + 15, py, 1, T, P.pl2); F(px + 1, py + 1, 2, 1, 'rgba(255,255,255,.25)') }
      if (G == 6) { if (!gnb(x, y - 1, 6)) F(px, py, T, 1, P.pink2); if (!gnb(x, y + 1, 6)) F(px, py + 15, T, 1, P.pink2); if (!gnb(x - 1, y, 6)) F(px, py, 1, T, P.pink2); if (!gnb(x + 1, y, 6)) F(px + 15, py, 1, T, P.pink2) }
    }
    if (G == 2) {
      if (!gnb(x, y - 1, 2)) { F(px, py, T, 1, P.pe); F(px, py + 1, T, 1, P.path2) } if (!gnb(x, y + 1, 2)) { F(px, py + 15, T, 1, P.pe); F(px, py + 14, T, 1, P.path2) }
      if (!gnb(x - 1, y, 2)) { F(px, py, 1, T, P.pe); F(px + 1, py, 1, T, P.path2) } if (!gnb(x + 1, y, 2)) { F(px + 15, py, 1, T, P.pe); F(px + 14, py, 1, T, P.path2) }
    }
    if (v == 2) {
      F(px, py, T, T, P.wt); F(px + 2 + (y % 3) * 2, py + 5, 5, 1, P.wt2); F(px + 9, py + 11, 4, 1, P.wt2); F(px + 4, py + 13, 3, 1, P.wt2);
      if (!nbr(x, y - 1, 2)) { F(px, py, T, 2, P.wt2); F(px, py, T, 1, P.wo) } if (!nbr(x, y + 1, 2)) F(px, py + 15, T, 1, P.wo);
      if (!nbr(x - 1, y, 2)) F(px, py, 1, T, P.wo); if (!nbr(x + 1, y, 2)) F(px + 15, py, 1, T, P.wo);
    }
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const px = x * T, py = y * T, v = t[I(x, y)]; if (!v || v == 2) continue;
    const k = { forest: 'tree', dark: 'tree', beach: 'palm', city: 'neon', castle: 'pillar', casino: 'slot' }[n];
    if (v == 1) {
      if (k == 'tree') {
        const rr = 10 + (hsh(x, y, 1) * 2 | 0), cx = px + 8, cy = py + 1;
        ell(px + 12, py + 15, 8, 2.5, 'rgba(0,0,0,.16)', g); F(px + 6, py + 8, 4, 8, P.tr); F(px + 8, py + 8, 2, 8, sh(P.tr, .72)); F(px + 5, py + 15, 6, 1, sh(P.tr, .72));
        ell(cx, cy + 2, rr + 1, rr - 1, P.to, g2); ell(cx, cy + 2, rr, rr - 2, P.td, g2); ell(cx - 1, cy, rr - 1, rr - 3, P.tm, g2);
        [[-4, -3, 4, 3], [3, -2, 3, 2], [-1, 2, 3, 2], [-6, 1, 2, 2]].forEach(([a, b, c, d]) => ell(cx + a, cy + b, c, d, P.tl, g2));
        [[5, 4, 4, 2], [-2, 6, 3, 1]].forEach(([a, b, c, d]) => ell(cx + a, cy + b, c, d, P.td, g2));
        if (n == 'dark' && hsh(x, y, 9) < .25) F(cx + 3, cy + 4, 2, 2, '#9ff', g2);
      }
      if (k == 'palm') {
        ell(px + 12, py + 15, 8, 2, 'rgba(0,0,0,.18)', g); F(px + 6, py + 6, 4, 10, P.to); F(px + 7, py + 6, 2, 10, P.tr); for (let i = 0; i < 4; i++) F(px + 7, py + 8 + i * 2, 2, 1, sh(P.tr, .7));
        for (let pass = 0; pass < 2; pass++) for (let a = 0; a < 7; a++) { const an = a * .9 + hsh(x, y, 2); for (let i = 0; i < 9; i++) { const fx = px + 8 + Math.cos(an) * i * 1.7, fy = py + 4 + Math.sin(an) * i * .9 + i * .4; pass ? F(fx, fy, 2, 2, i < 5 ? P.tm : P.tl, g2) : F(fx - 1, fy - 1, 4, 4, P.to, g2) } }
      }
      if (k == 'neon') { F(px + 7, py + 3, 2, 13, '#4a4a60'); F(px + 4, py, 8, 4, NC[(x + y) % 4]); ell(px + 8, py + 6, 14, 9, 'rgba(255,80,180,.10)', g2) }
      if (k == 'pillar') { F(px + 2, py + 2, 12, 14, '#5a5470'); F(px + 2, py + 2, 4, 14, '#7a7490'); F(px, py, 16, 3, '#8a84a0'); F(px + 1, py + 15, 14, 1, '#2a2440') }
      if (k == 'slot') { F(px + 1, py + 1, 14, 15, '#2a0a20'); F(px + 2, py + 2, 12, 13, '#701850'); F(px + 4, py + 4, 8, 5, '#fffff0'); F(px + 5, py + 5, 2, 3, '#f33'); F(px + 8, py + 5, 2, 3, '#3c3'); F(px + 4, py + 11, 8, 2, '#ff3ca0'); F(px + 13, py + 7, 1, 6, '#ffd23c') }
    }
    if (v == 3) {
      if (n == 'dark' || n == 'castle') {
        F(px, py, T, T, '#3b3550'); F(px, py + 7, T, 1, '#2a2440'); F(px + 8, py, 1, 7, '#2a2440'); F(px + 3, py + 8, 1, 8, '#2a2440'); F(px + 12, py + 8, 1, 8, '#2a2440'); F(px, py, T, 1, '#4a4468');
        if (!nbr(x, y - 1, 3) && n == 'dark') { F(px, py - 4, T, 5, '#4b4565'); for (let i = 0; i < 2; i++) F(px + i * 8, py - 6, 5, 3, '#4b4565') }
        if (n == 'dark' && y >= 5 && y <= 6 && (x - 26) % 3 == 1) { F(px + 3, py + 2, 8, 12, '#14101f'); F(px + 4, py + 3, 6, 10, '#8a6cff'); F(px + 7, py + 3, 1, 10, '#14101f') }
        if (n == 'castle' && y == 2 && x % 4 == 2) { F(px + 6, py + 4, 4, 8, '#5a3a1a'); F(px + 5, py, 6, 5, '#ff9a2a'); F(px + 7, py - 2, 2, 3, '#ffd23c'); ell(px + 8, py + 4, 16, 12, 'rgba(255,160,60,.10)', g2) }
      } else if (n == 'shack') { F(px, py, T, T, '#8a6038'); for (let i = 0; i < 4; i++) F(px, py + i * 4, T, 1, '#6a4424'); F(px + 7, py, 1, T, '#6a4424'); if (y == 2) { F(px, py + 12, T, 4, '#5a3818') } if (y == 2 && x % 4 == 2) { F(px + 2, py + 2, 12, 10, '#1a2a4a'); F(px + 3, py + 3, 10, 8, '#6a9ad0'); F(px + 7, py + 3, 2, 8, '#5a3818'); F(px + 3, py + 7, 10, 1, '#5a3818') }
      } else if (n == 'casino') { F(px, py, T, T, '#1a0a1a'); F(px, py + 12, T, 1, '#ff3ca0'); F(px, py + 14, T, 1, '#3ee0ff'); if (y == 1 && x % 5 == 2) { g.font = 'bold 13px sans-serif'; g.fillStyle = '#ff7aff'; g.shadowColor = '#f0f'; g.shadowBlur = 6; g.fillText(KJ[x % 6], px + 1, py + 11); g.shadowBlur = 0 } }
      else {
        F(px, py, T, T, '#1b1b2c'); F(px, py, T, 2, '#35354f'); F(px, py + 15, T, 1, '#0e0e18');
        for (let i = 0; i < 4; i++) if ((x * 5 + y * 3 + i) % 3) F(px + 2 + (i % 2) * 7, py + 3 + (i >> 1) * 7, 5, 4, NC[(x + y + i) % 4]);
        if (!nbr(x, y - 1, 3)) { F(px, py, T, 3, '#4a4a68'); F(px, py + 3, T, 1, '#111') }
        if ((x * 3 + y) % 7 == 0) { g.font = 'bold 14px sans-serif'; g.shadowColor = '#f0f'; g.shadowBlur = 6; g.fillStyle = '#ff9aff'; g.fillText(KJ[(x + y) % 6], px, py + 14); g.shadowBlur = 0 }
      }
    }
    if (v == 5) {
      if (n == 'city') { F(px, py, T, T, '#0a0810'); for (let i = 0; i < 5; i++) F(px + i * 3, py + 2 + i * 3, 16 - i * 3, 3, '#55557a'); F(px, py - 1, T, 1, '#ff3ca0') }
      else if (n == 'dark') { F(px - 4, py - 2, 24, 18, '#2a2440'); F(px, py, 16, 16, '#0a0810'); F(px + 2, py + 2, 12, 14, '#2a1a10'); F(px + 12, py + 9, 2, 2, '#ffd23c'); F(px, py - 4, 16, 3, '#ff9a2a') }
      else { F(px, py, T, T, '#16121f'); F(px + 2, py + 2, 12, 14, '#0a0810'); F(px + 4, py + 12, 8, 2, '#ffd23c') }
    }
    if (v == 6) { ell(px + 9, py + 15, 7, 2, 'rgba(0,0,0,.18)', g); F(px + 1, py + 3, 4, 12, '#5a3a22'); F(px + 12, py + 3, 4, 12, '#5a3a22'); F(px + 2, py + 4, 2, 10, '#a8723c'); F(px + 13, py + 4, 2, 10, '#a8723c'); F(px, py + 6, T, 4, '#5a3a22'); F(px, py + 7, T, 2, '#c08850'); F(px, py + 11, T, 3, '#5a3a22'); F(px, py + 12, T, 1, '#c08850') }
    if (v == 7) {
      ell(px + 9, py + 14, 8, 3, 'rgba(0,0,0,.2)', g);
      if (n == 'dark') { F(px + 4, py + 2, 9, 13, '#2a2440'); F(px + 5, py + 3, 7, 11, '#7a7498'); F(px + 6, py + 1, 5, 3, '#2a2440'); F(px + 7, py + 2, 3, 2, '#7a7498'); F(px + 8, py + 5, 1, 5, '#2a2440'); F(px + 6, py + 7, 5, 1, '#2a2440'); F(px + 5, py + 3, 2, 11, '#9a94b8') }
      else if (n == 'city') { F(px + 1, py + 3, 14, 12, '#2a1c10'); F(px + 2, py + 4, 12, 10, '#6a4a2a'); F(px + 2, py + 4, 12, 2, '#8a6a3a'); F(px + 7, py + 4, 2, 10, '#4a3418') }
      else { ell(px + 8, py + 11, 8, 6, '#4a4a5c', g); ell(px + 8, py + 10, 7, 5, '#9a9aa8', g); ell(px + 6, py + 8, 3, 2, '#c8c8d6', g); F(px + 10, py + 12, 4, 1, '#6a6a7a') }
    }
    if (v == 8) { ell(px + 14, py + 15, 10, 3, 'rgba(0,0,0,.2)', g); F(px + 7, py - 6, 2, 22, '#d8d8e0'); const uc = NC[(x + y) % 4]; for (let i = 0; i < 6; i++) ell(px + 8, py - 8, 14 - i * 2, 7 - i, i & 1 ? '#fff' : uc, g2); ell(px + 8, py - 8, 15, 8, 'rgba(0,0,0,0)', g2); F(px + 7, py - 15, 2, 3, '#ddd', g2) }
    if (v == 9) { ell(px + 10, py + 14, 8, 2.5, 'rgba(0,0,0,.16)', g); ell(px + 8, py + 10, 8, 6, P.to, g); ell(px + 8, py + 10, 7, 5, P.td, g); ell(px + 8, py + 9, 6, 4, P.tm, g); ell(px + 6, py + 7, 3, 2, P.tl, g); if (hsh(x, y, 13) < .4) { F(px + 10, py + 9, 2, 2, '#ff8fb0'); F(px + 5, py + 11, 2, 2, '#ffe9a0') } }
  }
  // set dressing for the hub zone
  if (n == 'forest') { const bx = (mp.cx + 2) * T, by = (hub.y + hub.h - 5) * T; F(bx - 1, by - 1, 82, 50, '#7a3a3a'); for (let j = 0; j < 6; j++) for (let i = 0; i < 10; i++) F(bx + i * 8, by + j * 8, 8, 8, (i + j) & 1 ? '#f6ecdc' : '#e0605a'); F(bx, by + 48, 80, 2, 'rgba(0,0,0,.2)'); for (const [lx, ly] of [[mp.cx - 7, mp.cy - 1], [mp.cx - 7, mp.cy + 2]]) { F(lx * T, ly * T + 4, 24, 9, P.to); F(lx * T + 1, ly * T + 5, 22, 7, '#8a5a38'); F(lx * T + 1, ly * T + 5, 22, 2, '#a8723c') } }
  if (n == 'beach') { for (let i = 0; i < 3; i++) { const bx = (hub.x + 5 + i * 4) * T, by = (hub.y + 5 + (i & 1)) * T; F(bx - 1, by - 1, 24, 36, '#fff'); F(bx, by, 22, 34, NC[i]); F(bx + 2, by + 2, 18, 30, '#ffffff'); for (let j = 0; j < 4; j++) F(bx + 2, by + 4 + j * 8, 18, 3, NC[i]) } }
  if (n == 'city') { const z = hub; for (let i = 0; i < 6; i++) { F((z.x + 1 + i * 2) * T, (z.y + 3) * T, 2, 2, NC[i % 4]); F((z.x + 1 + i * 2) * T, (z.y + 4) * T, 2, 2, NC[(i + 1) % 4]) } }
  if (n == 'dark') { for (let i = 0; i < 2; i++) { const lx = (hub.x + 1 + i * (hub.w - 3)) * T + 6, ly = (hub.y + 2) * T; F(lx, ly, 3, 22, '#2a2440'); F(lx - 2, ly - 4, 7, 5, '#ffd23c'); ell(lx + 1, ly - 1, 22, 16, 'rgba(255,200,100,.13)', g2) } }
  return MP[n] = mp;
}

// ==================== BIG OVERWORLD (generated from assets/world.js, which came from your island map) ====================
const LETS = 'FDBCSLH';
const GATE_STAGE = { dark: 1, beach: 2, city: 3 };      // which story stage opens each gate
function buildWorld() {
  const Wd = WORLD, w = Wd.w, h = Wd.h, rows = Wd.rows, I = (x, y) => y * w + x, okc = (x, y) => x >= 0 && y >= 0 && x < w && y < h;
  const t = new Uint8Array(w * h), gt = new Uint8Array(w * h), lt = new Uint8Array(w * h).fill(255), zi = new Int16Array(w * h).fill(-1), R = rng(12345);
  const ch = (x, y) => okc(x, y) ? rows[y][x] : ' ', isLand = c => LETS.includes(c);
  const mp = { w, h, t, gt, zi, world: 1, zones: Wd.zones, door: {}, exit: {}, gateOf: new Map(), cx: 0, cy: 0 };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const c = ch(x, y);
    if (isLand(c)) lt[I(x, y)] = LETS.indexOf(c); else if (c == '=') { gt[I(x, y)] = 7 } else if (c == '~') t[I(x, y)] = 2; else t[I(x, y)] = 10;
  }
  for (let pass = 0; pass < 7; pass++) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (lt[I(x, y)] == 255 && (ch(x, y) == '=' || ch(x, y) == '~'))
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (okc(x + dx, y + dy) && lt[I(x + dx, y + dy)] < 7) { lt[I(x, y)] = lt[I(x + dx, y + dy)]; break }
  const zones = Wd.zones; zones.forEach((z, k) => { for (let y = z.y; y < z.y + z.h; y++) for (let x = z.x; x < z.x + z.w; x++) if (okc(x, y)) zi[I(x, y)] = k });
  const zone = id => zones.find(z => z.id == id), zc = z => ({ x: z.x + (z.w >> 1), y: z.y + (z.h >> 1) });
  const zdist = (x, y) => { let m = 99; for (const z of zones) { const dx = Math.max(z.x - x, 0, x - (z.x + z.w - 1)), dy = Math.max(z.y - y, 0, y - (z.y + z.h - 1)); m = Math.min(m, Math.hypot(dx, dy)) } return m };
  // ---- trees: noise-shaped masses with clearings around every zone
  const TV = { F: .5, D: .46, S: .54, L: .56, H: .68, B: .8, C: 9 }, kzg = { safe: 4, mob: 1, item: 3, story: 5, spot: 4 };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const L = lt[I(x, y)]; if (L > 6 || ch(x, y) == '=') continue; const b = LETS[L], d = zdist(x, y), nn = vn(x / 4.5, y / 4.5, 1) * .65 + vn(x / 1.8, y / 1.8, 2) * .35;
    let coast = false; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!isLand(ch(x + dx, y + dy)) && ch(x + dx, y + dy) != '=') coast = true;
    const zk = zi[I(x, y)] >= 0 ? zones[zi[I(x, y)]].k : null;
    if (zk) gt[I(x, y)] = kzg[zk];
    if ((d >= 1.5 && nn > TV[b] + (d < 3 ? .08 : 0) && (!coast || hsh(x, y, 5) < .4)) || (coast && b != 'C' && hsh(x, y, 6) < .16 && d > 1) || ((zk == 'mob' || zk == 'item') && b != 'B' && b != 'C' && hsh(x, y, 88) < .035)) t[I(x, y)] = 1;
  }
  // ---- special structures
  const setT = (x, y, v) => { if (okc(x, y) && isLand(ch(x, y))) t[I(x, y)] = v };
  const dz = zone('D.story'); if (dz) {   // the castle
    const x0 = dz.x + 2, x1 = dz.x + dz.w - 3, y0 = dz.y; for (let y = y0; y < y0 + 5; y++) for (let x = x0; x <= x1; x++) setT(x, y, 3);
    const dx = (x0 + x1) >> 1, dy = y0 + 4; setT(dx, dy, 5); mp.door.castle = { x: dx, y: dy }; mp.exit.castle = { x: dx, y: dy + 2 };
    for (let y = dy + 1; y < dy + 4; y++) for (let x = dx - 2; x <= dx + 2; x++) setT(x, y, 0);
  }
  const cz = zone('C.story'); if (cz) { const c = zc(cz); for (let y = c.y - 2; y <= c.y + 2; y++) for (let x = c.x - 3; x <= c.x + 2; x++) setT(x, y, 0); setT(c.x, c.y, 5); mp.door.casino = { x: c.x, y: c.y }; mp.exit.casino = { x: c.x - 2, y: c.y } }
  const HUTS = [{ room: 'mochi', z: 'F.spot1' }, { room: 'biscuit', z: 'L.spot1' }, { room: 'hoot', z: 'S.spot1' }, { room: 'shell', z: 'B.spot1' }]; mp.huts = HUTS;
  HUTS.forEach(hu => { const z = zone(hu.z); if (!z) return; const c = zc(z), x0 = c.x - 2, y0 = c.y - 1; for (let y = y0 - 1; y <= y0 + 4; y++) for (let x = x0 - 1; x <= x0 + 4; x++) setT(x, y, 0);
    for (let y = y0; y < y0 + 3; y++) for (let x = x0; x < x0 + 4; x++) setT(x, y, 4); setT(c.x, y0 + 2, 11); mp.door['shack:' + hu.room] = { x: c.x, y: y0 + 2 }; mp.exit['shack:' + hu.room] = { x: c.x, y: y0 + 4 } });
  const ci = LETS.indexOf('C'); for (let by = 4; by < h - 4; by += 8) for (let bx = 4; bx < w - 8; bx += 9) {   // city blocks
    let free = true; for (let y = by - 1; y <= by + 4 && free; y++) for (let x = bx - 1; x <= bx + 6; x++) if (!okc(x, y) || lt[I(x, y)] != ci || ch(x, y) == '=' || zdist(x, y) < 1.5 || t[I(x, y)]) { free = false; break }
    if (free) for (let y = by; y < by + 4; y++) for (let x = bx; x < bx + 6; x++) t[I(x, y)] = 3;
  }
  const fz = zone('F.hub'); if (fz) { for (let x = fz.x; x < fz.x + fz.w; x++) for (const y of [fz.y, fz.y + fz.h - 1]) setT(x, y, 6); for (let y = fz.y; y < fz.y + fz.h; y++) for (const x of [fz.x, fz.x + fz.w - 1]) setT(x, y, 6) }
  const bz = zone('B.hub'); if (bz) [[3, 3], [bz.w - 4, 3], [3, bz.h - 4], [bz.w - 4, bz.h - 4]].forEach(([a, b]) => setT(bz.x + a, bz.y + b, 8));
  const hz = zone('H.hub'); if (hz) { const c = zc(hz); for (let y = c.y - 1; y <= c.y; y++) for (let x = c.x - 1; x <= c.x; x++) setT(x, y, 1); mp.bigTree = c }
  // ---- walkable roads: BFS between hubs / zones / bridges, carved two tiles wide
  const walk = (x, y) => okc(x, y) && (isLand(ch(x, y)) || ch(x, y) == '=');
  const bfs = (a, b, same) => { const prev = new Int32Array(w * h).fill(-2), q = [I(a.x, a.y)]; prev[q[0]] = -1; let qi = 0, hit = -1, tl = same ? lt[I(a.x, a.y)] : -1;
    while (qi < q.length) { const cur = q[qi++], cx = cur % w, cy = cur / w | 0; if (cx == b.x && cy == b.y) { hit = cur; break }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (walk(nx, ny) && prev[I(nx, ny)] == -2 && (!same || lt[I(nx, ny)] == tl)) { prev[I(nx, ny)] = cur; q.push(I(nx, ny)) } } }
    const path = []; for (let c = hit; c >= 0; c = prev[c]) path.push({ x: c % w, y: c / w | 0 }); return path };
  const carve = (a, b, same) => { if (!a || !b) return; let p = bfs(a, b, same); if (!p.length && same) p = bfs(a, b, false); p.forEach((q, i) => { const wob = Math.round(Math.sin(i / 3.5) * 0);
      for (const [ox, oy] of [[0, 0], [1, 0], [0, 1]]) { const x = q.x + ox, y = q.y + oy; if (walk(x, y) && t[I(x, y)] != 3 && t[I(x, y)] != 5) { t[I(x, y)] = 0; if (ch(x, y) != '=') gt[I(x, y)] = 2 } } }) };
  const hubOf = r => { const z = zone(r + '.hub'); return z && zc(z) };
  for (const r of LETS) { const hb = hubOf(r); if (!hb) continue; zones.filter(z => z.b == r && !z.id.endsWith('hub')).forEach(z => carve(hb, zc(z), true)) }
  [['F', 'H'], ['H', 'D'], ['H', 'B'], ['H', 'L'], ['L', 'C'], ['D', 'B'], ['F', 'S']].forEach(([a, b]) => carve(hubOf(a), hubOf(b), false));
  HUTS.forEach(hu => { const e = mp.exit['shack:' + hu.room]; if (e) carve(hubOf(hu.z[0]), e, true) });
  if (mp.exit.castle) carve(hubOf('D'), mp.exit.castle, true); if (mp.exit.casino) carve(hubOf('C'), mp.exit.casino, true);
  const bs = zone('B.story'), bh = hubOf('B'); if (bs) carve(hubOf('L'), zc(bs), false);
  for (const [name, list] of Object.entries(Wd.gates)) list.forEach(([x, y]) => { mp.gateOf.set(I(x, y), name); if (isLand(ch(x, y)) || ch(x, y) == '=') t[I(x, y)] = 0 });
  for (const z of zones) if (z.id.endsWith('hub')) { const c = zc(z); for (let y = c.y - 2; y <= c.y + 2; y++) for (let x = c.x - 2; x <= c.x + 2; x++) if (t[I(x, y)] == 1) t[I(x, y)] = 0 }
  // bushes + flower fields
  for (let y = 2; y < h - 2; y++) for (let x = 2; x < w - 2; x++) {
    const L = lt[I(x, y)]; if (L > 6 || t[I(x, y)] || gt[I(x, y)] == 2 || ch(x, y) == '=' || zdist(x, y) < 1) continue; const b = LETS[L]; if (b == 'C') continue;
    if (vn(x / 3, y / 3, 5) > .64 && hsh(x, y, 11) < .3) t[I(x, y)] = 9; else if (b != 'D' && vn(x / 3.5, y / 3.5, 6) > .68 && gt[I(x, y)] == 0) gt[I(x, y)] = 3;
  }
  const hc = hubOf('F') || { x: 10, y: 10 }; mp.cx = hc.x; mp.cy = hc.y; mp.start = hubOf;
  // ================= pre-render =================
  const mk = () => { const c = document.createElement('canvas'); c.width = w * T; c.height = h * T; return c };
  mp.im = mk(); mp.tp = mk(); const g = mp.im.getContext('2d'), g2 = mp.tp.getContext('2d');
  const F = (x, y, ww, hh, c, G = g) => { G.fillStyle = c; G.fillRect(x, y, ww, hh) };
  const PALL = LETS.split('').map(c => Object.assign({ to: '#1a1626', tuft2: '#000', pink: '#777', pink2: '#666', wt2: '#fff', wo: '#000' }, PAL[LET[c]]));
  const pl = (x, y) => { const q = lt[I(clamp(x + Math.round((vn(x / 3, y / 3, 21) - .5) * 4), 0, w - 1), clamp(y + Math.round((vn(x / 3, y / 3, 22) - .5) * 4), 0, h - 1))]; return q < 7 ? q : lt[I(x, y)] };
  const nbr = (x, y, v) => okc(x, y) && t[I(x, y)] == v, gnb = (x, y, v) => okc(x, y) && gt[I(x, y)] == v;
  const sprig = (x, y, c) => { F(x, y + 1, 1, 1, c); F(x + 1, y, 1, 2, c); F(x + 2, y + 1, 1, 1, c) };
  F(0, 0, w * T, h * T, '#06050f');
  for (let i = 0; i < 700; i++) F((hsh(i, 1, 3) * w * T) | 0, (hsh(i, 2, 3) * h * T) | 0, 1, 1, i % 5 ? 'rgba(180,200,255,.35)' : '#fff');
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {   // soft blue glow around the islands
    const c = ch(x, y); if (c == ':') ell(x * T + 8, y * T + 8, 15, 15, 'rgba(70,110,230,.20)', g); else if (c == '.') ell(x * T + 8, y * T + 8, 12, 12, 'rgba(60,90,200,.10)', g)
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const px = x * T, py = y * T, G = gt[I(x, y)], v = t[I(x, y)], L = lt[I(x, y)]; if (v == 10) continue; const P = PALL[pl(x, y)] || PALL[0], nz = vn(x / 6, y / 6, 3);
    if (ch(x, y) == '=') {   // bridge planks
      F(px, py, T, T, '#7a5636'); for (let i = 0; i < 4; i++) F(px, py + i * 4, T, 1, '#5a3c24'); F(px + 3 + (y % 2) * 6, py, 1, T, '#5a3c24');
      if (!isLand(ch(x - 1, y)) && ch(x - 1, y) != '=') F(px, py, 2, T, '#3a2414'); if (!isLand(ch(x + 1, y)) && ch(x + 1, y) != '=') F(px + 14, py, 2, T, '#3a2414'); if (!isLand(ch(x, y - 1)) && ch(x, y - 1) != '=') F(px, py, T, 2, '#3a2414'); if (!isLand(ch(x, y + 1)) && ch(x, y + 1) != '=') F(px, py + 14, T, 2, '#3a2414'); continue
    }
    let col = P.a[nz > .6 ? 2 : nz < .4 ? 1 : 0]; if (G == 1) col = P.tall; if (G == 4) col = P.lawn; if (G == 5) col = (x + y) & 1 ? P.plaza : P.pl2; if (G == 2) col = P.path;
    F(px, py, T, T, col);
    for (let i = 0; i < 3; i++) F(px + (hsh(x, y, i) * 15 | 0), py + (hsh(x, y, i + 7) * 15 | 0), 1, 1, G == 2 ? P.path2 : P.sp);
    if ((G == 0 || G == 4) && hsh(x, y, 3) < (G ? .14 : .3)) sprig(px + 2 + (hsh(x, y, 4) * 11 | 0), py + 3 + (hsh(x, y, 5) * 9 | 0), P.tuft);
    if (G == 1) for (let i = 0; i < 4; i++) { const a = px + 2 + i * 4, b = py + 3 + ((i * 5 + x) % 7); F(a, b, 1, 4, P.tuft2); F(a + 1, b + 1, 1, 3, P.tuft); F(a - 1, b + 2, 1, 2, P.tuft2) }
    if (G == 3 && hsh(x, y, 2) < .75) for (let i = 0; i < 2; i++) { const fx = px + 2 + (hsh(x, y, i + 20) * 10 | 0), fy = py + 2 + (hsh(x, y, i + 30) * 10 | 0), fc = P.fl[(hsh(x, y, i + 40) * 4) | 0] || '#fff'; F(fx, fy + 1, 3, 1, fc); F(fx + 1, fy, 1, 3, fc); F(fx + 1, fy + 1, 1, 1, '#ffe27a') }
    if (G == 5) { F(px, py + 15, T, 1, P.pl2); F(px + 15, py, 1, T, P.pl2); F(px + 1, py + 1, 2, 1, 'rgba(255,255,255,.25)') }
    if (G == 2) {
      if (!gnb(x, y - 1, 2)) { F(px, py, T, 1, P.pe); F(px, py + 1, T, 1, P.path2) } if (!gnb(x, y + 1, 2)) { F(px, py + 15, T, 1, P.pe); F(px, py + 14, T, 1, P.path2) }
      if (!gnb(x - 1, y, 2)) { F(px, py, 1, T, P.pe); F(px + 1, py, 1, T, P.path2) } if (!gnb(x + 1, y, 2)) { F(px + 15, py, 1, T, P.pe); F(px + 14, py, 1, T, P.path2) }
    }
    if (v == 2) {
      F(px, py, T, T, P.wt); F(px + 2 + (y % 3) * 2, py + 5, 5, 1, P.wt2); F(px + 9, py + 11, 4, 1, P.wt2); F(px + 4, py + 13, 3, 1, P.wt2);
      if (!nbr(x, y - 1, 2)) { F(px, py, T, 2, P.wt2); F(px, py, T, 1, P.wo) } if (!nbr(x, y + 1, 2)) F(px, py + 15, T, 1, P.wo); if (!nbr(x - 1, y, 2)) F(px, py, 1, T, P.wo); if (!nbr(x + 1, y, 2)) F(px + 15, py, 1, T, P.wo);
    }
  }
  // island undersides: earthy cliffs under every south-facing coast
  for (let y = 1; y < h; y++) for (let x = 0; x < w; x++) if (t[I(x, y)] == 10) {
    const above = ch(x, y - 1), px = x * T, py = y * T; if (!(isLand(above) || above == '=' || above == '~')) continue;
    const q = lt[I(x, y - 1)] < 7 ? lt[I(x, y - 1)] : 0, base = PALL[q].pe || '#5a4a38';
    F(px, py, T, T, base); for (let i = 0; i < 4; i++) F(px + 2 + i * 4, py, 2, 6 + (hsh(x, i, 4) * 9 | 0), sh(base, .72)); F(px, py, T, 2, sh(base, 1.25)); F(px, py + 12, T, 4, sh(base, .55));
    if (t[I(x, y + 1)] == 10) { F(px, py + T, T, 6, sh(base, .5)); F(px + 3, py + T, 2, 4, sh(base, .4)); F(px + 10, py + T, 2, 5, sh(base, .4)) }
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const px = x * T, py = y * T, v = t[I(x, y)]; if (!v || v == 2 || v == 10) continue; const bi = pl(x, y), b = LETS[bi] || 'F', P = PALL[bi] || PALL[0];
    if (v == 1) {
      if (mp.bigTree && x >= mp.bigTree.x - 1 && x <= mp.bigTree.x && y >= mp.bigTree.y - 1 && y <= mp.bigTree.y) {
        if (x == mp.bigTree.x - 1 && y == mp.bigTree.y - 1) { const cx = px + 16, cy = py + 2; ell(cx + 6, cy + 30, 22, 5, 'rgba(0,0,0,.18)', g); F(px + 12, py + 12, 8, 22, '#6a4636'); F(px + 16, py + 12, 4, 22, '#4a2e22');
          ell(cx, cy, 34, 24, '#6e2a4a', g2); ell(cx, cy, 33, 23, '#e07aa8', g2); ell(cx - 6, cy - 5, 24, 14, '#ffb8d4', g2); ell(cx - 12, cy - 9, 10, 6, '#ffe0ee', g2); for (let i = 0; i < 16; i++) F(cx - 30 + hsh(i, 1, 9) * 60, cy - 16 + hsh(i, 2, 9) * 36, 2, 2, i % 2 ? '#fff' : '#b8507e', g2) }
        continue
      }
      if (b == 'B') {
        ell(px + 12, py + 15, 8, 2, 'rgba(0,0,0,.18)', g); F(px + 6, py + 6, 4, 10, P.to); F(px + 7, py + 6, 2, 10, P.tr); for (let i = 0; i < 4; i++) F(px + 7, py + 8 + i * 2, 2, 1, sh(P.tr, .7));
        for (let pass = 0; pass < 2; pass++) for (let a = 0; a < 7; a++) { const an = a * .9 + hsh(x, y, 2); for (let i = 0; i < 9; i++) { const fx = px + 8 + Math.cos(an) * i * 1.7, fy = py + 4 + Math.sin(an) * i * .9 + i * .4; pass ? F(fx, fy, 2, 2, i < 5 ? P.tm : P.tl, g2) : F(fx - 1, fy - 1, 4, 4, P.to, g2) } }
      } else if (b == 'C') { F(px + 7, py + 3, 2, 13, '#4a4a60'); F(px + 4, py, 8, 4, NC[(x + y) % 4]); ell(px + 8, py + 6, 14, 9, 'rgba(255,80,180,.10)', g2) }
      else {
        const rr = 10 + (hsh(x, y, 1) * 2 | 0), cx = px + 8, cy = py + 1;
        ell(px + 12, py + 15, 8, 2.5, 'rgba(0,0,0,.16)', g); F(px + 6, py + 8, 4, 8, P.tr); F(px + 8, py + 8, 2, 8, sh(P.tr, .72)); F(px + 5, py + 15, 6, 1, sh(P.tr, .72));
        ell(cx, cy + 2, rr + 1, rr - 1, P.to, g2); ell(cx, cy + 2, rr, rr - 2, P.td, g2); ell(cx - 1, cy, rr - 1, rr - 3, P.tm, g2);
        [[-4, -3, 4, 3], [3, -2, 3, 2], [-1, 2, 3, 2], [-6, 1, 2, 2]].forEach(([a, bb, c, d]) => ell(cx + a, cy + bb, c, d, P.tl, g2)); [[5, 4, 4, 2], [-2, 6, 3, 1]].forEach(([a, bb, c, d]) => ell(cx + a, cy + bb, c, d, P.td, g2));
        if (b == 'D' && hsh(x, y, 9) < .25) F(cx + 3, cy + 4, 2, 2, '#9ff', g2); if (b == 'S') ell(cx - 2, cy - 4, rr - 4, 3, 'rgba(255,255,255,.85)', g2)
      }
    }
    if (v == 3) {
      if (b == 'D') { F(px, py, T, T, '#3b3550'); F(px, py + 7, T, 1, '#2a2440'); F(px + 8, py, 1, 7, '#2a2440'); F(px + 3, py + 8, 1, 8, '#2a2440'); F(px + 12, py + 8, 1, 8, '#2a2440'); F(px, py, T, 1, '#4a4468');
        if (!nbr(x, y - 1, 3)) { F(px, py - 4, T, 5, '#4b4565'); for (let i = 0; i < 2; i++) F(px + i * 8, py - 6, 5, 3, '#4b4565') } if ((x * 3 + y) % 3 == 1 && nbr(x, y - 1, 3) && !nbr(x, y + 1, 3) == false && y % 2) { F(px + 3, py + 2, 8, 12, '#14101f'); F(px + 4, py + 3, 6, 10, '#8a6cff'); F(px + 7, py + 3, 1, 10, '#14101f') } }
      else { F(px, py, T, T, '#1b1b2c'); F(px, py, T, 2, '#35354f'); F(px, py + 15, T, 1, '#0e0e18'); for (let i = 0; i < 4; i++) if ((x * 5 + y * 3 + i) % 3) F(px + 2 + (i % 2) * 7, py + 3 + (i >> 1) * 7, 5, 4, NC[(x + y + i) % 4]);
        if (!nbr(x, y - 1, 3)) { F(px, py, T, 3, '#4a4a68'); F(px, py + 3, T, 1, '#111') } if ((x * 3 + y) % 7 == 0) { g.font = 'bold 14px sans-serif'; g.shadowColor = '#f0f'; g.shadowBlur = 6; g.fillStyle = '#ff9aff'; g.fillText(KJ[(x + y) % 6], px, py + 14); g.shadowBlur = 0 } }
    }
    if (v == 4) {   // enterable shack: two roof rows over a plank wall
      const r1 = nbr(x, y - 1, 4) ? (nbr(x, y - 2, 4) ? 2 : 1) : 0; ell(px + 8, py + 16, 12, 3, 'rgba(0,0,0,.18)', g);
      if (r1 < 2) { F(px, py, T, T, '#9a3a2a'); for (let i = 0; i < 4; i++) F(px, py + i * 4 + 3, T, 1, '#6a2418'); F(px + ((x + y) % 2 ? 4 : 11), py, 1, 4, '#6a2418'); if (r1 == 0) { F(px, py, T, 2, '#d0705a'); F(px, py + 2, T, 1, '#2a1008') } if (r1 == 1) F(px, py + 13, T, 3, '#4a1a10') }
      else { F(px, py, T, T, '#c8a070'); for (let i = 0; i < 3; i++) F(px, py + i * 5 + 4, T, 1, '#a07848'); F(px, py + 15, T, 1, '#6a4a2a'); if (nbr(x - 1, y, 4) != nbr(x + 1, y, 4)) { F(px + 3, py + 3, 10, 8, '#2a3a5a'); F(px + 4, py + 4, 8, 6, '#8abae8'); F(px + 7, py + 4, 2, 6, '#7a5028') } }
    }
    if (v == 11) { F(px, py, T, T, '#c8a070'); F(px + 2, py + 1, 12, 15, '#3a2010'); F(px + 3, py + 2, 10, 14, '#7a4a28'); F(px + 3, py + 2, 10, 2, '#9a6038'); F(px + 11, py + 9, 2, 2, '#ffd23c'); F(px + 4, py + 15, 8, 1, '#c8505a') }
    if (v == 5) {
      if (b == 'C') { F(px, py, T, T, '#0a0810'); for (let i = 0; i < 5; i++) F(px + i * 3, py + 2 + i * 3, 16 - i * 3, 3, '#55557a'); F(px, py - 1, T, 1, '#ff3ca0') }
      else { F(px - 4, py - 2, 24, 18, '#2a2440'); F(px, py, 16, 16, '#0a0810'); F(px + 2, py + 2, 12, 14, '#2a1a10'); F(px + 12, py + 9, 2, 2, '#ffd23c'); F(px, py - 4, 16, 3, '#ff9a2a') }
    }
    if (v == 6) { ell(px + 9, py + 15, 7, 2, 'rgba(0,0,0,.18)', g); F(px + 1, py + 3, 4, 12, '#5a3a22'); F(px + 12, py + 3, 4, 12, '#5a3a22'); F(px + 2, py + 4, 2, 10, '#a8723c'); F(px + 13, py + 4, 2, 10, '#a8723c'); F(px, py + 6, T, 4, '#5a3a22'); F(px, py + 7, T, 2, '#c08850'); F(px, py + 11, T, 3, '#5a3a22'); F(px, py + 12, T, 1, '#c08850') }
    if (v == 7) { ell(px + 9, py + 14, 8, 3, 'rgba(0,0,0,.2)', g);
      if (b == 'D') { F(px + 4, py + 2, 9, 13, '#2a2440'); F(px + 5, py + 3, 7, 11, '#7a7498'); F(px + 6, py + 1, 5, 3, '#2a2440'); F(px + 7, py + 2, 3, 2, '#7a7498'); F(px + 8, py + 5, 1, 5, '#2a2440'); F(px + 6, py + 7, 5, 1, '#2a2440'); F(px + 5, py + 3, 2, 11, '#9a94b8') }
      else if (b == 'C') { F(px + 1, py + 3, 14, 12, '#2a1c10'); F(px + 2, py + 4, 12, 10, '#6a4a2a'); F(px + 2, py + 4, 12, 2, '#8a6a3a'); F(px + 7, py + 4, 2, 10, '#4a3418') }
      else { ell(px + 8, py + 11, 8, 6, '#4a4a5c', g); ell(px + 8, py + 10, 7, 5, '#9a9aa8', g); ell(px + 6, py + 8, 3, 2, '#c8c8d6', g); F(px + 10, py + 12, 4, 1, '#6a6a7a') } }
    if (v == 8) { ell(px + 14, py + 15, 10, 3, 'rgba(0,0,0,.2)', g); F(px + 7, py - 6, 2, 22, '#d8d8e0'); const uc = NC[(x + y) % 4]; for (let i = 0; i < 6; i++) ell(px + 8, py - 8, 14 - i * 2, 7 - i, i & 1 ? '#fff' : uc, g2); F(px + 7, py - 15, 2, 3, '#ddd', g2) }
    if (v == 9) { ell(px + 10, py + 14, 8, 2.5, 'rgba(0,0,0,.16)', g); ell(px + 8, py + 10, 8, 6, P.to, g); ell(px + 8, py + 10, 7, 5, P.td, g); ell(px + 8, py + 9, 6, 4, P.tm, g); ell(px + 6, py + 7, 3, 2, P.tl, g); if (hsh(x, y, 13) < .4) { F(px + 10, py + 9, 2, 2, '#ff8fb0'); F(px + 5, py + 11, 2, 2, '#ffe9a0') } }
  }
  // hub dressing
  if (fz) { const c = zc(fz), bx = (c.x + 2) * T, by = (fz.y + fz.h - 5) * T; F(bx - 1, by - 1, 82, 50, '#7a3a3a'); for (let j = 0; j < 6; j++) for (let i = 0; i < 10; i++) F(bx + i * 8, by + j * 8, 8, 8, (i + j) & 1 ? '#f6ecdc' : '#e0605a'); F(bx, by + 48, 80, 2, 'rgba(0,0,0,.2)'); for (const [lx, ly] of [[c.x - 7, c.y - 1], [c.x - 7, c.y + 2]]) { F(lx * T, ly * T + 4, 24, 9, '#2a1c14'); F(lx * T + 1, ly * T + 5, 22, 7, '#8a5a38'); F(lx * T + 1, ly * T + 5, 22, 2, '#a8723c') } }
  if (bz) for (let i = 0; i < 3; i++) { const bx = (bz.x + 5 + i * 4) * T, by = (bz.y + 5 + (i & 1)) * T; F(bx - 1, by - 1, 24, 36, '#fff'); F(bx, by, 22, 34, NC[i]); F(bx + 2, by + 2, 18, 30, '#ffffff'); for (let j = 0; j < 4; j++) F(bx + 2, by + 4 + j * 8, 18, 3, NC[i]) }
  const dh = zone('D.hub'); if (dh) for (let i = 0; i < 2; i++) { const lx = (dh.x + 1 + i * (dh.w - 3)) * T + 6, ly = (dh.y + 2) * T; F(lx, ly, 3, 22, '#2a2440'); F(lx - 2, ly - 4, 7, 5, '#ffd23c'); ell(lx + 1, ly - 1, 22, 16, 'rgba(255,200,100,.13)', g2) }
  return MP.world = mp;
}
function build(n) { return n == 'world' ? buildWorld() : buildLocal(n) }
const mapOf = () => MP[S.m] || build(S.m);
