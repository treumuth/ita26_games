// ==================== STATE ====================
let sc = 'menu', S = null, E = [], MN = null, B = null, DL = null, PO = null, HS = null, XM = null, fade = 0, tick = 0, shake = 0, msgT = 0, msgS = '', trail = [], CAM = { x: 0, y: 0 }, ZB = { t: 0, n: '', d: '' }, curZ = null, curReg = null;
let played = !!ST.get('syn_played');
const SK = i => 'syn4_s' + i, HUDC = ['#9aa8c1', '#c4b8ae', '#c8789a', '#a6b9a0'];
const stageIdx = () => S ? STAGE[S.b] || 0 : 0;
function eqBonus(i, k) { const e = S.eq[i] || {}; let v = 0; for (const sl of ['weapon', 'gear', 'charm']) if (e[sl] && ITEMDEF[e[sl]]) v += ITEMDEF[e[sl]][k] || 0; return v }
const maxHp = i => CH[i].st0.hp + (S.lv - 1) * 6 + eqBonus(i, 'hp'), atkOf = i => CH[i].st0.atk + (S.lv - 1) * 2 + eqBonus(i, 'atk');
const defOf = i => CH[i].st0.def + Math.floor((S.lv - 1) * 1.2) + eqBonus(i, 'def'), luckOf = i => CH[i].st0.luck + eqBonus(i, 'luck');
function newS(slot) {
  S = { slot, b: 'forest', m: 'world', x: 0, y: 0, dir: 0, xp: 0, lv: 1, hp: [0, 0, 0, 0], emo: CH.map(c => c.emo), party: [0, 1, 2, 3], snacks: 3, items: [], eq: {}, p: { forest: [0, 0], dark: [0, 0], beach: [0, 0], city: [0, 0] },
    got: {}, sq: {}, lore: [], ev: {}, found: 0, t: 0, battles: 0, seen: {} };
  S.hp = CH.map((c, i) => maxHp(i)); return S;
}
function giveItem(id) { if (!S.items.includes(id)) S.items.push(id) }
function addLore(id) { if (!S.lore.includes(id)) { S.lore.push(id); say('Journal updated.') } }
const qdone = b => BI[b].q.every((q, i) => S.p[b][i] >= q[1]);
const say = m => { msgS = m; msgT = 170 };

function goto(m, tx, ty, d) {
  S.m = m; const mp = mapOf(), a = mp.arr;
  if (tx == null) { if (a) { tx = a.x; ty = a.y } else { const h = mp.start ? mp.start('F') : { x: mp.cx, y: mp.cy }; tx = h.x; ty = h.y + 3 } }
  S.x = tx * T + 8; S.y = ty * T + 12; trail = []; S.dir = d || 0; curZ = null; curReg = null; spawn(); fade = 1;
}
function gotoHub(letter, dy = 3) { const h = mapOf().start(letter); goto('world', h.x, h.y + dy) }
function zoneAt(x, y) { const mp = mapOf(); if (!mp.world) return null; const tx = x / T | 0, ty = y / T | 0; if (tx < 0 || ty < 0 || tx >= mp.w || ty >= mp.h) return null; const k = mp.zi[ty * mp.w + tx]; return k >= 0 ? mp.zones[k] : null }
const regionAt = (x, y) => { const mp = mapOf(); if (!mp.world) return S.m; const tx = clamp(x / T | 0, 0, mp.w - 1), ty = clamp(y / T | 0, 0, mp.h - 1), c = WORLD.rows[ty][tx]; return LETS.includes(c) ? LET[c] : (curReg || 'forest') };
const ZNM = { 'F.hub': 'Hangout Clearing', 'F.mob1': 'Sprout Meadow', 'F.mob2': 'Bramble Patch', 'F.item': 'Mushroom Grove', 'F.story': 'Old Well', 'D.hub': 'Lantern Camp', 'D.mob1': 'Hollow Woods', 'D.mob2': 'Gloom Marsh', 'D.item': 'Key Ruins', 'D.story': 'Castle Gate',
  'B.hub': 'Resort Plaza', 'B.mob1': 'Crab Flats', 'B.item': 'Shell Cove', 'B.story': 'Lighthouse Point', 'C.hub': 'Neon Plaza', 'C.mob1': 'Glitch Alley', 'C.mob2': 'Arcade Row', 'C.item': 'Token Alley', 'C.story': 'Casino Steps',
  'S.hub': 'Snowed-In Camp', 'S.mob1': 'Frozen Drifts', 'S.item': 'Icicle Cave', 'S.story': 'Static Hollow', 'L.hub': 'Lakeside Dock', 'L.mob1': 'Reed Marsh', 'L.item': 'Clinic Island', 'L.story': 'Nurse Station', 'H.hub': 'The Crossroads', 'F.mob3': 'Whistling Thicket', 'F.spot1': 'Cat Cottage', 'F.spot2': 'Picnic Rock', 'D.mob3': 'Weeping Hollow', 'D.spot1': 'Crooked Post', 'D.spot2': 'Hanging Lantern', 'B.mob2': 'Tidepool Rocks', 'B.spot1': 'Turtle Hut', 'B.spot2': 'Message Dunes', 'C.mob3': 'Dead Pixel Lot', 'C.spot1': 'Payphone Corner', 'S.mob2': 'Whiteout Ridge', 'S.spot1': 'Owl Cabin', 'L.mob2': 'Sunken Dock', 'L.spot1': 'Dog Shack' };
const ZDESC = { safe: 'A safe spot. Save at the vending machine.', mob: 'Monsters roam here.', item: 'Useful things lie around.', story: 'Something important is here.', spot: 'A quiet little place.' };
const SPOTS = { 'F.spot2': 'bench', 'D.spot1': 'note', 'D.spot2': 'stone', 'B.spot2': 'note', 'C.spot1': 'bench' };   // small spots that give very little
const CHESTS = [{ z: 'F.mob2', item: 'scissors' }, { z: 'F.item', item: 'wristband' }, { z: 'S.item', item: 'watch' }, { z: 'L.item', item: 'cassette' }, { z: 'D.item', item: 'pan' }, { z: 'S.mob1', snacks: 3 }, { z: 'B.mob1', snacks: 2 }, { z: 'C.item', snacks: 3 }, { z: 'F.spot2', snacks: 2 }, { z: 'D.spot2', snacks: 2 }, { z: 'B.spot2', snacks: 2 }, { z: 'F.mob3', snacks: 2 }, { z: 'D.mob3', snacks: 3 }, { z: 'C.mob3', snacks: 3 }, { z: 'L.mob2', snacks: 2 }, { z: 'S.mob2', snacks: 2 }, { z: 'B.mob2', snacks: 2 }];
const EGGS = [{ id: 'pond', z: 'F.item', dx: 4, dy: 2, kind: 'puddle' }, { id: 'doll', z: 'D.mob1', dx: 2, dy: -2, kind: 'doll' }, { id: 'bottle', z: 'B.item', dx: 3, dy: 1, kind: 'bottle' }, { id: 'phone', z: 'C.hub', dx: 4, dy: 1, kind: 'phone' }, { id: 'chart', z: 'L.hub', dx: 3, dy: 1, kind: 'clip' }];

// ---- entity creation for the big world
function spawn() { S.m == 'world' ? spawnWorld() : spawnInterior() }
function spawnWorld() {
  const mp = mapOf(), Z = mp.zones; E = []; const tAt = (x, y) => mp.t[y * mp.w + x], gAt = (x, y) => mp.gt[y * mp.w + x];
  const freeIn = (z, rn) => { for (let i = 0; i < 150; i++) { const x = z.x + (rn() * z.w | 0), y = z.y + (rn() * z.h | 0); if (!tAt(x, y) && gAt(x, y) != 2 && !mp.gateOf.has(y * mp.w + x)) return { x: x * T + 8, y: y * T + 14 } } return null };
  const near = (tx, ty) => { for (let r = 0; r < 6; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (!tAt(tx + dx, ty + dy) && gAt(tx + dx, ty + dy) != 2) return { x: (tx + dx) * T + 8, y: (ty + dy) * T + 14 }; return { x: tx * T + 8, y: ty * T + 14 } };
  const zone = id => Z.find(z => z.id == id), zc = z => ({ x: z.x + (z.w >> 1), y: z.y + (z.h >> 1) });
  Z.forEach((z, zi) => {
    const b = z.b, bk = LET[b], rn = rng(zi * 7919 + 31), hubz = z.id.endsWith('hub'), hub = zone(b + '.hub');
    if (z.k == 'mob') { const en = BI[bk].en; if (en) for (let i = 0; i < 5; i++) { const q = freeIn(z, rn); q && E.push({ k: 'enemy', t: i % 3 == 2 && VARIANT[en] ? VARIANT[en] : en, ...q, vx: 0, vy: 0, z, id: 'e:' + z.id + i }) }
      for (let i = 0; i < 2; i++) { const q = freeIn(z, rn), id = 'n:' + z.id + i; if (q && !S.got[id]) E.push({ k: 'item', s: 1, id, ...q }) } }
    if (z.k == 'item' && 'FDBC'.includes(b)) for (let i = 0; i < 3; i++) { const q = freeIn(z, rn), id = 'q:' + b + ':' + i; if (q && !S.got[id]) E.push({ k: 'item', q: 1, b: bk, id, ...q }) }
    SQ.filter(s => s.zone == z.id).forEach(s => { for (let i = 0; i < s.n; i++) { const q = freeIn(z, rn), id = 's:' + s.id + ':' + i; if (q && !S.got[id]) E.push({ k: 'sqitem', sq: s.id, id, ...q }) } });
    CHESTS.filter(c => c.z == z.id).forEach(c => { const q = freeIn(z, rn), id = 'c:' + z.id; if (q && !S.got[id]) E.push({ k: 'chest', id, item: c.item, snacks: c.snacks, ...q }) });
    if (hubz) { const c = zc(z), v = near(z.x + z.w - 3, z.y + 3); E.push({ k: 'vend', ...v }); if ('FD'.includes(b)) E.push({ k: 'fire', ...near(c.x - 3, c.y) }) }
    else if (hub) { const dx = hub.x - z.x, dy = hub.y - z.y, a = Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]; const c = zc(z), q = near(c.x + a[0] * ((z.w >> 1) + 1) - (a[0] ? 0 : 2), c.y + a[1] * ((z.h >> 1) + 1) - (a[1] ? 0 : 2)); E.push({ k: 'sign', ...q, z }) }
  });
  Z.filter(z => z.k == 'spot' && SPOTS[z.id]).forEach(z => E.push({ k: SPOTS[z.id], id: z.id, ...near(zc(z).x, zc(z).y) }));
  (mp.huts || []).forEach(hu => { const d = mp.door['shack:' + hu.room]; if (d) E.push({ k: 'door', to: 'shack', room: hu.room, x: d.x * T + 8, y: d.y * T + 16 }) });
  EGGS.forEach(g => { const z = zone(g.z); if (z) { const c = zc(z); E.push({ k: 'egg', id: g.id, kind: g.kind, ...near(c.x + g.dx, c.y + g.dy) }) } });
  const npc = (id, zid, dx, dy) => { const z = zone(zid); if (!z) return; const c = zc(z); E.push({ k: 'npc', id, c: ND[id] || CH[1], ...near(c.x + dx, c.y + dy) }) };
  npc('mo', 'F.hub', -1, -3); npc('bella', 'F.hub', 4, -2); npc('pip', 'F.mob1', -4, 5); npc('finn', 'F.item', -4, 0); npc('morrow', 'D.hub', -3, -2); npc('vesper', 'D.mob2', 0, 5); npc('lou', 'B.hub', -2, -3); npc('coco', 'B.hub', 2, 1); npc('dex', 'B.mob1', 2, 3); npc('nova', 'L.story', 0, 0);
  if (!S.found && S.b == 'city') npc('caroline', 'C.hub', -2, 2);
  let z;
  if (z = zone('F.story')) E.push({ k: 'spot', nm: 'well', ...near(zc(z).x, zc(z).y) });
  if (z = zone('B.story')) E.push({ k: 'spot', nm: 'tower', ...near(zc(z).x, zc(z).y + 1) });
  if (z = zone('S.story')) E.push({ k: 'tv', ...near(zc(z).x, zc(z).y) });
  if (mp.door.castle) E.push({ k: 'door', to: 'castle', x: mp.door.castle.x * T + 8, y: mp.door.castle.y * T + 16 });
  if (mp.door.casino) E.push({ k: 'door', to: 'casino', x: mp.door.casino.x * T + 8, y: mp.door.casino.y * T + 16 });
}
function spawnInterior() {
  const n = S.m, mp = mapOf(), B0 = BI[n], zs = B0.z; E = [];
  const at = (tx, ty) => ({ x: tx * T + 8, y: ty * T + 14 }), free = () => { for (let i = 0; i < 200; i++) { const x = 3 + (Math.random() * (mp.w - 6) | 0), y = 3 + (Math.random() * (mp.h - 6) | 0); if (!mp.t[y * mp.w + x] && Math.hypot(x - mp.cx, y - mp.cy) > 3) return { x: x * T + 8, y: y * T + 14 } } return { x: mp.cx * T, y: mp.cy * T } };
  const npc = (id, tx, ty) => E.push({ k: 'npc', id, c: ND[id] || CH[1], ...at(tx, ty) });
  if (n == 'castle') { E.push({ k: 'door', to: 'world', out: 1, x: mp.door.x * T + 8, y: mp.door.y * T + 16 }); E.push({ k: 'spot', nm: 'throne', ...at(mp.cx, 4) }); E.push({ k: 'vend', ...at(mp.cx + 5, mp.cy - 1) }); npc('rattles', mp.cx - 5, 9);
    if (!S.got['c:castle']) E.push({ k: 'chest', id: 'c:castle', item: 'polaroid', ...at(mp.w - 5, 4) }); for (let i = 0; i < 3; i++) E.push({ k: 'enemy', t: 'shadow', ...free(), vx: 0, vy: 0, z: null, id: 'e:castle' + i }) }
  if (n == 'shack') { E.push({ k: 'door', to: 'world', out: 1, x: mp.door.x * T + 8, y: mp.door.y * T + 16 }); E.push({ k: 'npc', id: S.room, c: ND[S.room], ...at(mp.cx, 4) });
    E.push({ k: 'deco', kind: 'bed', ...at(3, 5) }); E.push({ k: 'deco', kind: 'table', ...at(mp.w - 4, 5) }); E.push({ k: 'deco', kind: 'plant', ...at(mp.w - 4, 3) }); E.push({ k: 'deco', kind: 'plant', ...at(3, 3) }) }
  if (n == 'casino') { E.push({ k: 'door', to: 'world', out: 1, x: mp.door.x * T + 8, y: mp.door.y * T + 20 }); E.push({ k: 'spot', nm: 'house', ...at(mp.cx, 14) }); E.push({ k: 'vend', ...at(4, 14) }); npc('steven', 7, 8); npc('uku', 22, 8); npc('chips', mp.cx - 3, 8); E.find(e => e.id == 'steven').c = CH[0]; E.find(e => e.id == 'uku').c = CH[3] }
}
// ==================== WORLD UPDATE ====================
function gateClosed(px, py) { const mp = mapOf(); if (!mp.gateOf || !mp.gateOf.size) return false; const g = mp.gateOf.get(((py / T) | 0) * mp.w + ((px / T) | 0)); return g && stageIdx() < GATE_STAGE[g] }
function solid(px, py) { const mp = mapOf(), x = px / T | 0, y = py / T | 0; return x < 0 || y < 0 || x >= mp.w || y >= mp.h || mp.t[y * mp.w + x] != 0 || gateClosed(px, py) }
const canWalk = (x, y) => !solid(x - 5, y) && !solid(x + 5, y) && !solid(x - 5, y - 3) && !solid(x + 5, y - 3);
function trackFor() {
  if (sc == 'hscene' || S && S.scary) return 'scary';
  if (!S) return 'menu'; if (sc == 'battle' && B && B.e.t == 'umbra') return 'scary';
  const m = BI[S.m] && BI[S.m].fixed ? S.m : regionAt(S.x, S.y); return BI[m] ? BI[m].mus : 'forest';
}
function worldUpdate() {
  if (DL) return dialogUpdate();
  if (esc()) { pause(); return }
  if (hit.KeyX) { openXMenu(); return }
  S.t++;
  const dx = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0), dy = (keys.ArrowDown || keys.KeyS ? 1 : 0) - (keys.ArrowUp || keys.KeyW ? 1 : 0);
  if (dx || dy) {
    S.running = !!keys.ShiftLeft; const sp = (S.running ? 2.2 : 1.5) / Math.hypot(dx, dy), nx = S.x + dx * sp, ny = S.y + dy * sp;
    if (canWalk(nx, S.y)) S.x = nx; if (canWalk(S.x, ny)) S.y = ny;
    S.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : (dy < 0 ? 3 : 0); S.moving = true; S.wf = (S.wf || 0) + (S.running ? .22 : .13); trail.unshift([S.x, S.y, S.dir, S.wf]); if (trail.length > 90) trail.pop();
  } else { S.wf = 0; S.moving = false; S.running = false }
  const z = zoneAt(S.x, S.y), rg = regionAt(S.x, S.y);
  if (S.m == 'world' && rg != curReg) { curReg = rg; if (S.seen[rg] == null) { S.seen[rg] = 1 } ZB = { t: 200, n: BI[rg].nm, d: '' } }
  else if (z != curZ) { curZ = z; if (z) ZB = { t: 160, n: ZNM[z.id] || z.id, d: ZDESC[z.k] } }
  if (S.m != 'world' && curZ == null) { curZ = BI[S.m].z[0]; ZB = { t: 160, n: BI[S.m].nm, d: '' } }
  for (const e of E) {
    if (e.k == 'enemy') {
      const d = Math.hypot(S.x - e.x, S.y - e.y); if (d > 320) continue;
      if (d < 90 && !(e.cd > 0)) { e.vx = (S.x - e.x) / d * .7; e.vy = (S.y - e.y) / d * .7 } else if (tick % 90 == 0) { const a = Math.random() * 6.28; e.vx = Math.cos(a) * .35; e.vy = Math.sin(a) * .35 }
      e.cd = (e.cd || 0) - 1; const nx = e.x + e.vx, ny = e.y + e.vy, tz = e.z;
      const inside = !tz || (nx / T >= tz.x - 1 && nx / T < tz.x + tz.w + 1 && ny / T >= tz.y - 1 && ny / T < tz.y + tz.h + 1);
      if (inside && !solid(nx, ny - 4)) { e.x = nx; e.y = ny } else { e.vx *= -1; e.vy *= -1 }
      if (d < 14 && e.cd <= 0) { startBattle(e); return }
    }
    if ((e.k == 'item' || e.k == 'sqitem') && Math.hypot(S.x - e.x, S.y - e.y) < 12) {
      if (e.k == 'sqitem') { const q = S.sq[e.sq]; if (!q || q.s != 1) continue; const def = SQ.find(s => s.id == e.sq); e.dead = 1; S.got[e.id] = 1; q.p++; beep(880, .1); say(def.what + ' ' + Math.min(q.p, def.n) + '/' + def.n); continue }
      e.dead = 1; S.got[e.id] = 1; beep(880, .1);
      if (e.s) { S.snacks++; say('Found a snack! (+1)') } else { const b = e.b; S.p[b][1]++; say(BI[b].item + ' ' + Math.min(S.p[b][1], BI[b].q[1][1]) + '/' + BI[b].q[1][1]) }
    }
  }
  E = E.filter(e => !e.dead);
  scaryUpdate();
  if (ok()) { let best = null, bd = 99; for (const e of E) if (['npc', 'vend', 'door', 'spot', 'sign', 'chest', 'egg', 'tv', 'bench', 'note', 'stone'].includes(e.k)) { const d = Math.hypot(S.x - e.x, S.y - e.y), rr = e.k == 'door' ? 34 : 26; if (d < rr && d < bd) { bd = d; best = e } } if (best) interact(best) }
}
function interact(e) {
  if (e.k == 'vend') { beep(520, .1); PO = { t: 0 }; sc = 'pol'; return }
  if (e.k == 'sign') { D(['|' + (ZNM[e.z.id] || '') + ' - ' + ZDESC[e.z.k]]); return }
  if (e.k == 'chest') { e.dead = 1; S.got[e.id] = 1; beep(660, .15); if (e.item) { giveItem(e.item); D(['|You opened the chest and found: ' + ITEMDEF[e.item].n + '!', '|' + ITEMDEF[e.item].d]) } else { S.snacks += e.snacks; say('Found ' + e.snacks + ' snacks!') } return }
  if (e.k == 'egg') return egg(e);
  if (e.k == 'bench') { S.party.forEach(i => S.hp[i] = Math.min(maxHp(i), S.hp[i] + Math.ceil(maxHp(i) * .3))); beep(520, .1); return D(['|You sit on the bench for a while. It is very quiet. Everyone feels a little better.']) }
  if (e.k == 'note' || e.k == 'stone') return D(NOTES[e.id] || ['|...']);
  if (e.k == 'tv') return tvEgg(e);
  if (e.k == 'door') {
    if (e.to == 'shack') { S.room = e.room; S.exitTo = mapOf().exit['shack:' + e.room]; BI.shack.mus = (BI[curReg] || BI.forest).mus; fade = 1; goto('shack'); return }
    if (e.to == 'castle' && S.p.dark[1] < 3) { say('Locked. Needs 3 Rusty Keys.'); return }
    if (e.to == 'casino' && !(S.found && qdone('city'))) { say(S.found ? 'The stairs hum... finish your quests first.' : 'You shouldn\'t go alone...'); return }
    fade = 1; if (e.out) { const from = S.m, mp = build('world'); const ex = from == 'shack' ? S.exitTo : mp.exit[from]; goto('world', ex.x, ex.y); return }
    if (e.to == 'casino') D(['|You walk down a long staircase. Neon kanji flicker overhead...'], () => goto('casino')); else goto(e.to); return;
  }
  if (e.k == 'npc') return npc(e);
  if (e.k == 'spot') { const b = S.b; if (!qdone(b) && e.nm != 'house') { say('Not yet... finish your quests first (' + BI[b].q.map((q, i) => Math.min(S.p[b][i], q[1]) + '/' + q[1]).join(', ') + ')'); return } events[e.nm]() }
}
// ==================== WORLD DRAW ====================
function drawWorld() {
  const mp = mapOf(); S.dkA = S.dkA || 0;
  let cx = clamp(S.x - VW / 2, 0, mp.w * T - VW), cy = clamp(S.y - VH / 2 - 8, 0, mp.h * T - VH);
  if (mp.w * T < VW) cx = -(VW - mp.w * T) / 2; if (mp.h * T < VH) cy = -(VH - mp.h * T) / 2;
  cx = Math.round(cx); cy = Math.round(cy); CAM.x = cx; CAM.y = cy;
  let ox = 0, oy = 0; if (shake > 0) { ox = (Math.random() * 4 - 2) | 0; oy = (Math.random() * 4 - 2) | 0 }
  sW(); r(0, 0, VW, VH, '#000'); X.drawImage(mp.im, -cx + ox, -cy + oy);
  const L = [], vis = e => e.x > cx - 70 && e.x < cx + VW + 70 && e.y > cy - 40 && e.y < cy + VH + 110, sx = e => Math.round(e.x - cx + ox), sy = e => Math.round(e.y - cy + oy);
  for (const e of E) if (vis(e)) L.push({ y: e.y, f: () => drawEntity(e, sx(e), sy(e)) });
  L.push({ y: S.y, f: () => drawChar(CH[PL], Math.round(S.x - cx + ox), Math.round(S.y - cy + oy), S.dir, S.moving ? 1 + Math.floor(S.wf) % 4 : 0, 1) });
  S.party.filter(i => i != PL).forEach((i, j) => { const t = trail[Math.min((j + 1) * 14, trail.length - 1)]; if (t) L.push({ y: t[1] - .1, f: () => drawChar(CH[i], Math.round(t[0] - cx + ox), Math.round(t[1] - cy + oy), t[2], S.moving ? 1 + Math.floor(t[3]) % 4 : 0, 1) }) });
  drawScary(L, cx, cy, ox, oy);
  L.sort((a, b) => a.y - b.y).forEach(o => o.f());
  if (mp.gateOf && mp.gateOf.size) mp.gateOf.forEach((name, k) => { if (stageIdx() < GATE_STAGE[name]) { const gx = (k % mp.w) * T - cx + ox, gy = ((k / mp.w) | 0) * T - cy + oy; if (gx > -16 && gx < VW && gy > -16 && gy < VH) { r(gx + 2, gy + 1, 12, 14, 'rgba(90,20,120,.55)'); r(gx + 3, gy + ((tick >> 2) % 12), 10, 2, '#d890ff'); r(gx + 1, gy, 2, 16, '#2a0a3a'); r(gx + 13, gy, 2, 16, '#2a0a3a') } } });
  X.drawImage(mp.tp, -cx + ox, -cy + oy);
  for (let i = 0; i < 18; i++) { const px = (i * 97 + tick * (.2 + i % 3 * .1)) % VW, py = (i * 53 - tick * (.15 + i % 4 * .05) + VH * 8) % VH; r(px, py, 1, 1, PCOL[curReg] || 'rgba(255,255,255,.4)') }
  const dk = (S.m == 'world' ? (curReg == 'dark' || curReg == 'city' && 0) : BI[S.m].dk) || (S.scary && S.m == 'world'); S.dkA += ((dk ? 1 : 0) - S.dkA) * .05;
  if (S.dkA > .02) {
    const o = drawWorld.o || (drawWorld.o = document.createElement('canvas')); o.width = VW; o.height = VH; const g = o.getContext('2d');
    g.fillStyle = 'rgba(8,6,26,' + (.8 * S.dkA) + ')'; g.fillRect(0, 0, VW, VH); g.globalCompositeOperation = 'destination-out';
    const px = S.x - cx, py = S.y - cy - 12, rr = (S.m == 'castle' ? 150 : 135) + Math.sin(tick / 20) * 3 + (S.items.includes('lantern') ? 30 : 0); const gr = g.createRadialGradient(px, py, 8, px, py, rr); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, VW, VH);
    E.filter(e => e.k == 'fire' && vis(e)).forEach(e => { const q = g.createRadialGradient(e.x - cx, e.y - cy - 8, 4, e.x - cx, e.y - cy - 8, 70); q.addColorStop(0, 'rgba(0,0,0,.9)'); q.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = q; g.fillRect(0, 0, VW, VH) });
    X.drawImage(o, 0, 0);
  }
  if (curReg == 'city' || S.m == 'casino') r(0, 0, VW, VH, 'rgba(24,0,60,.28)'); if (curReg == 'beach') r(0, 0, VW, VH, 'rgba(255,230,170,.06)');
  const vg = drawWorld.v || (() => { const c = document.createElement('canvas'); c.width = VW; c.height = VH; const g = c.getContext('2d'), q = g.createRadialGradient(VW / 2, VH / 2, VH * .45, VW / 2, VH / 2, VW * .62); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, 'rgba(0,0,0,.4)'); g.fillStyle = q; g.fillRect(0, 0, VW, VH); return drawWorld.v = c })();
  X.drawImage(vg, 0, 0);
  sU(); drawHUD(cx, cy);
}
function drawEntity(e, x, y) {
  if (e.k == 'enemy') drawEnemy(e.t, x, y, 1);
  else if (e.k == 'item') drawPick(e.s ? 'snack' : QKIND[e.b] || 'mushroom', x, y, !e.s);
  else if (e.k == 'sqitem') { const q = S.sq[e.sq]; if (q && q.s == 1) drawPick(SQKIND[e.sq] || 'marble', x, y, true) }
  else if (e.k == 'bench') { ell(x, y, 14, 3, 'rgba(0,0,0,.25)'); r(x - 12, y - 11, 24, 3, '#5a3418'); r(x - 12, y - 8, 24, 4, '#a8723c'); r(x - 12, y - 8, 24, 1, '#c8924c'); r(x - 11, y - 4, 3, 4, '#5a3418'); r(x + 8, y - 4, 3, 4, '#5a3418') }
  else if (e.k == 'note') { r(x - 1, y - 18, 2, 18, '#5a4030'); r(x - 8, y - 26, 16, 12, '#f0e8d0'); r(x - 8, y - 26, 16, 1, '#c8b890'); for (let i = 0; i < 3; i++) r(x - 6, y - 23 + i * 3, 12 - (i == 2 ? 5 : 0), 1, '#6a5a44'); r(x - 2, y - 28, 4, 3, '#c0392b') }
  else if (e.k == 'stone') { ell(x, y, 9, 3, 'rgba(0,0,0,.3)'); r(x - 7, y - 24, 14, 24, '#4a4a5c'); r(x - 6, y - 25, 12, 2, '#6a6a7e'); r(x - 6, y - 23, 12, 22, '#7a7a90'); r(x - 6, y - 23, 3, 22, '#9a9ab0'); r(x - 1, y - 18, 2, 8, (tick >> 4) & 1 ? '#8ff' : '#4cc'); r(x - 3, y - 15, 6, 2, (tick >> 4) & 1 ? '#8ff' : '#4cc'); ell(x, y - 14, 14, 14, 'rgba(120,255,255,.07)') }
  else if (e.k == 'deco') {
    if (e.kind == 'bed') { ell(x, y, 12, 3, 'rgba(0,0,0,.25)'); r(x - 11, y - 12, 22, 12, '#4a2a1a'); r(x - 10, y - 11, 20, 10, '#e8e0d0'); r(x - 10, y - 11, 8, 10, '#f8f4ec'); r(x - 2, y - 11, 12, 10, '#6a8ac8'); r(x - 2, y - 11, 12, 2, '#8aaae0') }
    if (e.kind == 'table') { ell(x, y, 11, 3, 'rgba(0,0,0,.25)'); r(x - 10, y - 13, 20, 4, '#6a4a2a'); r(x - 10, y - 13, 20, 1, '#8a6a44'); r(x - 9, y - 9, 3, 9, '#4a321c'); r(x + 6, y - 9, 3, 9, '#4a321c'); r(x - 2, y - 18, 5, 5, '#f4f0e8'); r(x + 3, y - 17, 2, 3, '#f4f0e8') }
    if (e.kind == 'plant') { ell(x, y, 6, 2, 'rgba(0,0,0,.25)'); r(x - 4, y - 8, 8, 8, '#a8523a'); r(x - 4, y - 8, 8, 2, '#c8725a'); ell(x - 3, y - 13, 4, 5, '#3a8a4a'); ell(x + 3, y - 14, 4, 6, '#4aa85a'); ell(x, y - 17, 3, 4, '#5ac06a') }
  }
  else if (e.k == 'chest') { ell(x, y, 10, 3, 'rgba(0,0,0,.3)'); r(x - 9, y - 12, 18, 12, '#2a1a10'); r(x - 8, y - 11, 16, 10, '#8a5a30'); r(x - 8, y - 11, 16, 3, '#b07a44'); r(x - 8, y - 6, 16, 1, '#2a1a10'); r(x - 2, y - 8, 4, 4, '#ffd23c') }
  else if (e.k == 'vend') { ell(x + 2, y, 11, 3, 'rgba(0,0,0,.3)'); r(x - 10, y - 32, 20, 32, '#7a1a1a'); r(x - 9, y - 31, 18, 30, '#d03030'); r(x - 7, y - 29, 14, 15, '#1a2a3a'); for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) r(x - 6 + i * 3.4, y - 28 + j * 4.6, 2, 3, NC[(i + j) % 4]); r(x - 7, y - 29, 14, 1, '#8ef'); r(x - 7, y - 11, 9, 4, '#111'); r(x + 4, y - 12, 3, 5, '#ffd23c'); r(x - 6, y - 5, 12, 3, '#3a0a0a') }
  else if (e.k == 'npc') drawChar(e.c, x, y, e.id == 'steven' || e.id == 'uku' || e.id == 'chips' ? 0 : (tick >> 6) % 7 == 0 ? 1 : 0, 0, 1);
  else if (e.k == 'fire') { ell(x, y, 10, 3, 'rgba(0,0,0,.3)'); r(x - 8, y - 3, 16, 3, '#5a3a1a'); r(x - 6, y - 5, 12, 3, '#7a4a22'); const f = (tick >> 2) & 1; r(x - 4, y - 12 - f, 8, 8, '#e8541a'); r(x - 3, y - 14 - f, 6, 6, '#ff9a2a'); r(x - 1, y - 16 - f, 3, 6, '#ffd23c'); ell(x, y - 8, 28, 20, 'rgba(255,170,70,.10)') }
  else if (e.k == 'sign') { r(x - 1, y - 14, 2, 14, '#6a4a2a'); r(x - 9, y - 22, 18, 9, '#a8723c'); r(x - 9, y - 22, 18, 1, '#c8924c'); r(x - 7, y - 19, 14, 1, '#4a3018'); r(x - 7, y - 16, 10, 1, '#4a3018') }
  else if (e.k == 'egg') drawEgg(e, x, y);
  else if (e.k == 'tv') drawTV(x, y, S.items.includes('cassette'));
  else if (e.k == 'spot') {
    if (e.nm == 'well') { ell(x, y, 14, 4, 'rgba(0,0,0,.3)'); ell(x, y - 6, 13, 7, '#5a5a66'); ell(x, y - 7, 11, 6, '#8a8a96'); ell(x, y - 8, 8, 4, '#16213a'); ell(x - 2, y - 8, 4, 2, '#3a8ad8'); r(x - 12, y - 28, 3, 22, '#6a4a2a'); r(x + 9, y - 28, 3, 22, '#6a4a2a'); for (let i = 0; i < 6; i++) r(x - 14 + i * 2, y - 32 + i, 28 - i * 4, 2, i & 1 ? '#8a5a30' : '#a8723c') }
    if (e.nm == 'tower') { ell(x, y, 14, 4, 'rgba(0,0,0,.3)'); for (let j = 0; j < 40; j++) r(x - 8 + j * .08, y - j - 2, 16 - j * .16, 1, (j >> 3) & 1 ? '#d33' : '#f4f0e8'); r(x - 6, y - 52, 12, 8, '#ffd23c'); r(x - 8, y - 54, 16, 3, '#333'); ell(x, y - 48, 26, 22, 'rgba(255,230,120,.16)') }
    if (e.nm == 'throne') { ell(x, y, 13, 4, 'rgba(0,0,0,.3)'); r(x - 11, y - 34, 22, 34, '#4a0a12'); r(x - 9, y - 32, 18, 30, '#7a1a22'); r(x - 8, y - 14, 16, 12, '#a02830'); r(x - 11, y - 20, 4, 18, '#5a1018'); r(x + 7, y - 20, 4, 18, '#5a1018'); r(x - 6, y - 40, 12, 7, '#ffd23c') }
    if (e.nm == 'house') drawEnemy('house', x, y, 1.1, true, false);
  }
}
function drawHUD(cx, cy) {
  r(2, 2, 124, 24, 'rgba(10,8,22,.75)'); txt('LV' + S.lv + '  XP ' + S.xp + '/' + S.lv * 20 + '  SNACKS ' + S.snacks, 5, 3, '#fff', 'left', 6);
  S.party.forEach((i, j) => { r(5 + j * 29, 14, 27, 5, '#000'); r(6 + j * 29, 15, 25 * clamp(S.hp[i] / maxHp(i), 0, 1), 3, HUDC[i]) }); txt('X: MENU', 5, 20, '#9a9ab0', 'left', 5);
  const b = S.b, qs = BI[b].q; r(W - 126, 2, 124, 10 + qs.length * 8, 'rgba(10,8,22,.75)');
  qs.forEach((q, i) => txt('- ' + q[2] + ' ' + Math.min(S.p[b][i], q[1]) + '/' + q[1], W - 5, 3 + i * 8, S.p[b][i] >= q[1] ? '#8f8' : '#ddd', 'right', 6));
  if (ZB.t > 0) { ZB.t--; if (!DL) { const a = Math.min(1, ZB.t / 30, (200 - ZB.t) / 15); X.globalAlpha = a; r(70, H - 27, 180, 22, '#000'); r(70, H - 27, 180, 1, '#fff'); r(70, H - 6, 180, 1, '#fff'); r(70, H - 27, 1, 22, '#fff'); r(249, H - 27, 1, 22, '#fff'); txt(ZB.n.toUpperCase(), W / 2, H - 25, '#fff', 'center', 8); if (ZB.d) txt(ZB.d, W / 2, H - 15, '#bbb', 'center', 5); X.globalAlpha = 1 } }
  if (msgT > 0) { msgT--; const w2 = tw(msgS, 6) + 12; r(W / 2 - w2 / 2, 108, w2, 12, 'rgba(10,8,22,.85)'); txt(msgS, W / 2, 109, '#ff8', 'center', 6) }
  if (!DL) { let near = null; for (const e of E) if (['npc', 'vend', 'door', 'spot', 'sign', 'chest', 'egg', 'tv', 'bench', 'note', 'stone'].includes(e.k) && Math.hypot(S.x - e.x, S.y - e.y) < (e.k == 'door' ? 34 : 26)) near = e; if (near) { const nm = near.k == 'npc' ? near.c.n : near.k == 'vend' ? 'Vending Machine (save)' : near.k == 'chest' ? 'Chest' : near.k == 'bench' ? 'Rest' : near.k == 'note' ? 'Read' : near.k == 'stone' ? 'Touch' : ''; txt('[Z] ' + nm, (near.x - cx) / 2, (near.y - cy) / 2 - (near.k == 'vend' ? 24 : 28), '#fff', 'center', 6) } }
  else drawDialog();
}
