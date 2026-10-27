// ==================== HORROR SCENES (the three fears), THE SHADOW, JUMPSCARES ====================
const HSCENES = {
  dark: { beats: [[150, 'It is so dark.'], [170, 'Something is breathing. Close.'], [170, 'The light is getting smaller...'], [150, '"Hitori..."  "...Hitori..."  "...Hitori."'], [130, 'It is right behind you.'], [190, 'And then: a small, warm light. Yours. The dark was only the dark.']] },
  spider: { beats: [[150, 'Something is crawling on your arm.'], [170, 'More. They are coming out of the walls.'], [170, 'In your hair. In your mouth. In every corner of the room.'], [140, 'A tall shape unfolds behind the dark. It is smiling.'], [130, 'THEY ARE ALL YOU.'], [190, 'They scatter. Gone. They were never real. ...Were they?']] },
  height: { beats: [[150, 'You are so high up.'], [170, 'The wind has teeth.'], [170, 'The railing is gone. It was never there.'], [150, '"don\'t look down"  "don\'t look down"'], [130, 'You look down.'], [190, 'You fall softly, like a leaf. The ground was always right here.']] },
  tape: { beats: [[620, '']] }
};
function hscene(kind, cb) { HS = { k: kind, cb, t: 0, bi: 0, bt: 0, sp: [], c: 0 }; sc = 'hscene'; S.scary = true }
function hsUpdate() {
  const h = HS, sc2 = HSCENES[h.k], beat = sc2.beats[h.bi]; h.t++; h.bt++; h.c += .7;
  if (h.k == 'spider' && h.bi >= 0 && h.bi < 5 && h.t % (h.bi == 0 ? 14 : h.bi == 1 ? 6 : 3) == 0) { const e = Math.random() * 4 | 0, p = Math.random(); h.sp.push({ x: e < 2 ? (e ? W + 6 : -6) : p * W, y: e < 2 ? p * H : (e == 2 ? -6 : H + 6), s: .5 + Math.random() * .9, a: Math.random() * 6 }) }
  if (h.k == 'spider') h.sp.forEach(s => { const dx = W / 2 - s.x, dy = H / 2 + 8 - s.y, d = Math.hypot(dx, dy) || 1; if (h.bi < 4) { s.x += dx / d * (.5 + s.s * .4) + Math.sin(h.t / 6 + s.a) * .6; s.y += dy / d * (.5 + s.s * .4) } else { s.x -= dx / d * 1.8; s.y -= dy / d * 1.8 } });
  if (h.k == 'dark' && h.bi == 1 && h.bt % 40 == 0 || h.k == 'dark' && h.bi == 2 && h.bt % 28 == 0) heartbeat();
  if (h.k == 'dark' && h.bi == 4 && h.bt == 55 || h.k == 'spider' && h.bi == 4 && h.bt == 50 || h.k == 'height' && h.bi == 4 && h.bt == 60) { jumpscareSound(); shake = 24 }
  if (h.k == 'height' && (h.bi == 1 || h.bi == 3) && h.t % 30 == 0) noiseBurst(.5, 500, .5, .25);
  const fullText = h.c >= (beat[1] || '').length;
  if (h.k == 'tape') { if (h.t > 40 && (ok() && h.t > 560 || h.t > 700)) return hsEnd(); return }
  if (h.bt >= beat[0] || (ok() && h.bt > 40 && fullText && h.bt > 90)) { h.bi++; h.bt = 0; h.c = 0; if (h.bi >= sc2.beats.length) hsEnd() }
}
function hsEnd() { const cb = HS.cb; HS = null; S.scary = false; sc = 'world'; cb && cb() }
function hsGlow(cx, cy, rad, a = 1) { const g = X.createRadialGradient(cx, cy, 2, cx, cy, rad); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.7, 'rgba(0,0,0,' + a * .7 + ')'); g.addColorStop(1, 'rgba(0,0,0,' + a + ')'); X.fillStyle = g; X.fillRect(0, 0, W, H) }
function spider(x, y, s) { r(x - 2 * s, y - 2 * s, 4 * s, 4 * s, '#3a2626'); r(x - 1 * s, y - 1 * s, 2 * s, 2 * s, '#5a3a3a'); for (let i = 0; i < 4; i++) { r(x - 6 * s, y - 3 * s + i * 2 * s, 4 * s, s, '#4a3030'); r(x + 2 * s, y - 3 * s + i * 2 * s, 4 * s, s, '#4a3030') } r(x - s, y - s, s, s, '#f33'); r(x + 0, y - s, s, s, '#f33') }
function bigShadowFace(a) {   // jumpscare face: the Shadow filling the screen
  const sx = (Math.random() * 6 - 3), sy = (Math.random() * 6 - 3); sW(); X.globalAlpha = a; drawEnemy('umbra', 320 + sx, 400 + sy, 4.1, true, false); X.globalAlpha = 1; sU();
  for (let i = 0; i < 40; i++) r(Math.random() * W, Math.random() * H, 2 + Math.random() * 20, 1, 'rgba(255,255,255,' + Math.random() * .6 + ')');
}
function hsDraw() {
  const h = HS, beat = HSCENES[h.k].beats[h.bi] || ['', ''], bt = h.bt, k = h.k; sU(); let flash = 0;
  if (k == 'dark') {
    r(0, 0, W, H, '#020206'); const rad = h.bi == 0 ? 52 + Math.sin(h.t / 9) * 4 : h.bi == 1 ? 46 : h.bi == 2 ? 46 - bt / 170 * 30 : h.bi == 3 ? 16 : h.bi == 4 ? 14 : 12 + bt / 190 * 80;
    const pairs = h.bi == 0 ? 0 : h.bi == 5 ? Math.max(0, 14 - bt / 8) : Math.min(16, bt / 10 + (h.bi - 1) * 5);
    for (let i = 0; i < pairs; i++) { const a = i * 2.4 + h.bi, d = (h.bi == 2 ? 120 - bt / 2.4 : 90 + (i % 3) * 25) - (h.bi >= 3 ? 20 : 0), ex = W / 2 + Math.cos(a) * d * 1.3, ey = H / 2 + 6 + Math.sin(a) * d * .75; if (Math.sin(h.t / 11 + i * 3) > -.7) { r(ex - 4, ey, 3, 2, '#d33'); r(ex + 1, ey, 3, 2, '#d33') } }
    if (h.bi == 3) { X.globalAlpha = Math.min(.9, bt / 90); sW(); drawEnemy('umbra', 520, 300, 1.3, true, false); sU(); X.globalAlpha = 1 }
    spr(CH[PL], W / 2, H / 2 + 22, 0, 0, 1.6); hsGlow(W / 2, H / 2 + 8, rad);
    if (h.bi == 4 && bt > 55 && bt < 78) { flash = 1; X.fillStyle = '#000'; X.fillRect(0, 0, W, H); bigShadowFace(1) } else if (h.bi == 4 && bt >= 78) r(0, 0, W, H, '#000');
  }
  if (k == 'spider') {
    r(0, 0, W, H, '#0c0709'); for (let i = 0; i < 9; i++) r(i * 40 + 8, 0, 1, H, '#150d0f'); spr(CH[PL], W / 2, H / 2 + 22, 0, 0, 1.6); h.sp.forEach(s => spider(s.x, s.y, s.s * (h.bi >= 2 ? 1.5 : 1)));
    if (h.bi == 3) { X.globalAlpha = Math.min(.8, bt / 80); sW(); drawEnemy('umbra', 320, 330, 1.7, true, false); sU(); X.globalAlpha = 1 }
    if (h.bi == 4 && bt > 50 && bt < 76) { X.fillStyle = '#fff'; X.fillRect(0, 0, W, H); const s = 7; for (let i = 0; i < 8; i++) { r(W / 2 - 80 + i * 20, 40 - Math.sin(i) * 8, 6, 100, '#100'); } ell(W / 2, H / 2, 70, 56, '#150808'); ell(W / 2 - 22, H / 2 - 12, 11, 15, '#f22'); ell(W / 2 + 22, H / 2 - 12, 11, 15, '#f22'); r(W / 2 - 30, H / 2 + 16, 60, 6, '#ddd'); flash = 1 }
  }
  if (k == 'height') {
    r(0, 0, W, H, '#0a0a1c'); const scale = h.bi == 0 ? 1 : h.bi < 4 ? 1 + (h.bi) * .6 : 5 + bt / 6;
    for (let i = 0; i < 14; i++) { const gy = H / 2 + 20 + i * 8 * scale * .3, a = 1 - i / 15; r(0, gy, W, 1, 'rgba(120,140,255,' + a * .35 + ')'); r(W / 2 + (i - 7) * 22 * scale * .35, H / 2 + 20, 1, H, 'rgba(120,140,255,' + a * .3 + ')') }
    for (let i = 0; i < 24; i++) r((i * 37 + h.t * 3) % W, (i * 61 + h.t * (h.bi >= 4 ? 9 : 2)) % H, 1, h.bi >= 4 ? 10 : 3, 'rgba(255,255,255,.25)');
    r(50, 98, W - 100, 8, '#8a6a3a'); r(50, 98, W - 100, 1, '#c8a050'); if (h.bi < 2) { r(50, 78, 1, 20, '#bbb'); r(W - 51, 78, 1, 20, '#bbb'); r(50, 78, W - 100, 1, '#bbb') } else if (h.bi == 2) { r(50, 78, 1, 20, 'rgba(187,187,187,' + (1 - bt / 120) + ')') }
    spr(CH[PL], W / 2 + Math.sin(h.t / 9) * (h.bi >= 2 ? 3 : 1), 100 + (h.bi >= 4 ? bt * .6 : 0), 0, 0, 1.6);
    if (h.bi == 3) { X.globalAlpha = Math.min(.7, bt / 100); sW(); drawEnemy('umbra', 130, 200, 1.4, true, false); sU(); X.globalAlpha = 1 }
    if (h.bi == 4 && bt > 60 && bt < 80) { flash = 1; X.fillStyle = '#000'; X.fillRect(0, 0, W, H); bigShadowFace(.95) }
  }
  if (k == 'tape') {
    r(0, 0, W, H, '#050507'); r(34, 10, 252, 150, '#2a2a30'); r(38, 14, 244, 142, '#3a3a42'); r(46, 20, 228, 124, '#07100d'); for (let y = 20; y < 144; y += 3) r(46, y, 228, 1, 'rgba(0,0,0,.35)');
    const L = ['> PLAYBACK  SESSION 0041', '> SUBJECT: HITORI   ROOM 4', '> THE WORLD "SYNCHRONICITY" IS A SIMULATION.', '> BUILT TO KEEP PATIENTS CALM.', '> FRIENDS: PROGRAMMED COMPANIONS.', '> MONSTERS: UNPROCESSED FEARS.', '> IF YOU ARE WATCHING: DO NOT PANIC.', '> THE NURSES ARE ALWAYS HERE.', '[ END OF TAPE ]'];
    let n = Math.floor(h.t / 60); for (let i = 0; i <= Math.min(n, L.length - 1); i++) { const s = i == n ? L[i].slice(0, Math.floor((h.t % 60) / 60 * L[i].length * 1.6)) : L[i]; txt(s, 52, 26 + i * 12, i == 8 ? '#f66' : '#6f6', 'left', 6) }
    for (let i = 0; i < 30; i++) r(46 + Math.random() * 228, 20 + Math.random() * 124, 1 + Math.random() * 6, 1, 'rgba(200,255,220,' + Math.random() * .25 + ')'); if (h.t > 560) txt('[Z]', 160, 150, '#fff', 'center', 6);
    return;
  }
  // caption box
  if (!flash) { r(30, 134, 260, 38, '#fff'); r(31, 135, 258, 36, '#000'); wrapPx(beat[1].slice(0, h.c | 0), 246, 8).slice(0, 3).forEach((s, i) => txt(s, 36, 139 + i * 10.5, '#fff', 'left', 8)) }
  if (h.t < 20) r(0, 0, W, H, 'rgba(0,0,0,' + (1 - h.t / 20) + ')');
}
// ---- The Shadow: watches you from afar, and sometimes it gets you
const JSCARES = [{ id: 'd1', z: 'D.mob2', dx: 0, dy: 0, st: 1 }, { id: 'd2', z: 'D.item', dx: 0, dy: 0, st: 1 }, { id: 'l1', z: 'L.mob1', dx: 0, dy: 0, st: 1 }, { id: 'c1', z: 'C.mob1', dx: 0, dy: 0, st: 3 }, { id: 'c2', z: 'C.mob2', dx: 0, dy: 0, st: 3 }, { id: 'k1', room: 'castle', st: 1 }];
const JSLINES = { d1: 'The marsh goes quiet. Every frog stops at once.', d2: 'The graves are in the wrong order now.', l1: 'Something stands in the reeds, too tall to be a reed.', c1: 'The neon flickers... and one sign says your name.', c2: 'The arcade machines all turn their screens toward you.', k1: 'The torches lean away from the throne.' };
function scaryUpdate() {
  const scary = S.m == 'castle' || S.m == 'world' && (curReg == 'dark' || curReg == 'city'), mp = mapOf();
  S.wt = (S.wt || 0) + (scary ? 1 : 0);
  if (scary && !S.watcher && S.wt > 1400 + (S.t % 700)) { const a = (S.dir == 1 ? Math.PI : S.dir == 2 ? 0 : S.dir == 3 ? -Math.PI / 2 : Math.PI / 2) + (Math.random() - .5), x = S.x + Math.cos(a) * 190, y = S.y + Math.sin(a) * 140; if (!solid(x, y)) { S.watcher = { x, y, life: 520 }; S.wt = 0 } else S.wt = 1100 }
  if (S.watcher) { const w = S.watcher; w.life--; const d = Math.hypot(S.x - w.x, S.y - w.y); S.scary = true; if (d < 75 || w.life <= 0) { S.watcher = null; S.scary = false; noiseBurst(.4, 900, .5, .5); beep(130, .25, 1.5, 'sawtooth') } }
  for (const j of JSCARES) {
    if (S.ev['js' + j.id] || stageIdx() < j.st) continue; let tx, ty;
    if (j.room) { if (S.m != j.room) continue; tx = mp.cx * T; ty = (mp.cy - 3) * T } else { if (S.m != 'world') continue; const z = mp.zones.find(z => z.id == j.z); if (!z) continue; tx = (z.x + (z.w >> 1) + j.dx) * T + 8; ty = (z.y + (z.h >> 1) + j.dy) * T + 8 }
    if (Math.hypot(S.x - tx, S.y - ty) < 34) { S.ev['js' + j.id] = 1; jumpscare(j.id); return }
  }
}
function drawScary(L, cx, cy, ox, oy) { const w = S.watcher; if (w) L.push({ y: w.y, f: () => { if (Math.random() < .08) return; X.globalAlpha = .75; drawEnemy('umbra', Math.round(w.x - cx + ox), Math.round(w.y - cy + oy), 1.3, false, false); X.globalAlpha = 1 } }) }
function jumpscare(id) { JS = { t: 0, id }; sc = 'js'; S.watcher = null; S.scary = true }
let JS = null;
function jsUpdate() {
  JS.t++; if (JS.t == 1 || JS.t == 24) heartbeat();
  if (JS.t == 62) { jumpscareSound(); shake = 30 }
  if (JS.t > 92) { sc = 'world'; S.scary = false; JS = null; startBattle({ k: 'enemy', t: 'umbra', x: 0, y: 0, alone: true, shadow: 1 }) }
}
function jsDraw() {
  sU(); const t = JS.t; if (t < 62) { drawWorld(); r(0, 0, W, H, 'rgba(0,0,0,' + Math.min(1, t / 50) + ')'); if (t > 14 && t < 58) { const s = JSLINES[JS.id]; wrapPx(s.slice(0, (t - 14) * 2), 220, 7).forEach((l, i) => txt(l, W / 2, 80 + i * 10, '#c8c8d8', 'center', 7)) } }
  else { r(0, 0, W, H, '#000'); bigShadowFace(1); if (t % 4 < 2) r(0, 0, W, H, 'rgba(255,255,255,.35)') }
}
