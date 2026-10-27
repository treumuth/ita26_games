// ==================== DIALOGUE ====================
const FRIENDS = ['Steven', 'Caroline', 'Uku'];
function escalate(n, e, t) {   // everyone gets angrier with Hitori as the story goes on; Hitori gets more manic
  const r = stageIdx(), seed = (t.length * 7 + r) % 5;
  if (n == 'Hitori') { if (e == 'neutral' || e == 'sad') e = 'smug'; if (r >= 1 && seed < 2 && !/[?]$/.test(t)) t = t.replace(/\.$/, '!') + ' Hehe.'; return { e, t } }
  if (!FRIENDS.includes(n) || r == 0) return { e, t };
  if (r >= 1) { if (e == 'neutral' || (e == 'happy' && seed < 2)) e = 'angry'; if (seed == 0) t += ' ...Hitori.' }
  if (r >= 2 && e != 'scared' && e != 'shock') { e = 'angry'; t = 'Ugh. ' + t.replace(/!/g, '!!') }
  if (r >= 3) { t = t.toUpperCase(); if (seed % 2 == 0) t += ' SHUT UP!'; if (e != 'scared') e = 'angry' }
  return { e, t };
}
function D(lines, cb) {   // lines: 'Name:emotion|text' ; empty name = narration (no portrait)
  DL = { q: lines.map(l => { const i = l.indexOf('|'), [n, e] = l.slice(0, i).split(':'), t = l.slice(i + 1); return n && LK[n] ? { n, ...escalate(n, e || 'neutral', t) } : { n, e, t } }), i: 0, c: 0, cb, pt: 0, age: 0 };
  beep(300);
}
function dialogUpdate() {
  const l = DL.q[DL.i], c0 = DL.c | 0; DL.c += .8; DL.pt++; DL.age++;
  if ((DL.c | 0) > c0 && l.t[c0] && l.t[c0] != ' ' && (c0 & 1) && LK[l.n]) beep(260 + (l.n.length * 23) % 140, .02, .35);
  if (ok()) { if (DL.c < l.t.length) DL.c = l.t.length; else { DL.i++; DL.c = 0; beep(400, .04); if (DL.i >= DL.q.length) { const cb = DL.cb; DL = null; cb && cb() } } }
}
function wrapPx(str, maxW, sz) {
  const out = []; let line = '';
  for (const w of str.split(' ')) { const t = line ? line + ' ' + w : w; if (tw(t, sz) > maxW && line) { out.push(line); line = w } else line = t }
  out.push(line); return out;
}
function drawDialog() {   // OMORI-style: black box with white border, fixed to the bottom; name tag left, portrait frame right
  sU(); X.globalAlpha = 1; X.imageSmoothingEnabled = false;
  const l = DL.q[DL.i], def = LK[l.n], BX = 6, BW = 308, BH = 38, BY = H - BH - 5;
  if (DL.wl !== DL.i) { DL.wl = DL.i; DL.lines = wrapPx(l.t, BW - 14, 8) }
  if (DL.sp !== l.n) { DL.sp = l.n; DL.slide = 0 } DL.slide = (DL.slide || 0) + 1;
  if (def) {   // portrait slides up out of the textbox when someone new talks; hops when the expression changes
    const PS = 42, PX = BX + BW - PS, rise = Math.min(1, DL.slide / 8), fy = BY - PS + 1 + Math.round((1 - rise) * (PS - 2));
    r(PX, fy, PS, PS, '#fff'); r(PX + 1, fy + 1, PS - 2, PS - 2, '#000'); X.save(); X.beginPath(); X.rect(PX + 1, fy + 1, PS - 2, PS - 2); X.clip();
    const hop = DL.pt < 6 ? -Math.round(Math.sin(DL.pt / 6 * Math.PI) * 2) : 0; portrait(def, l.e, PX + 1, fy + 1 + hop, (PS - 2) / 56); X.restore();
  }
  r(BX, BY, BW, BH, '#fff'); r(BX + 1, BY + 1, BW - 2, BH - 2, '#000');
  if (def) { const nm = l.n.toUpperCase(), nw = Math.ceil(tw(nm, 8)) + 12, ty = BY - 14; r(BX, ty, nw, 13, '#fff'); r(BX + 1, ty + 1, nw - 2, 11, '#000'); txt(nm, BX + 6, ty + 2, '#fff', 'left', 8) }
  let left = DL.c | 0; DL.lines.slice(0, 3).forEach((line, i) => { if (left <= 0) return; txt(line.slice(0, left), BX + 7, BY + 5 + i * 10.5, '#fff', 'left', 8); left -= line.length + 1 });
  if (DL.c >= l.t.length && (tick >> 4) & 1) { r(BX + BW - 10, BY + BH - 8, 5, 1, '#fff'); r(BX + BW - 9, BY + BH - 7, 3, 1, '#fff'); r(BX + BW - 8, BY + BH - 6, 1, 1, '#fff') }
}
// ==================== NPCS + SIDE QUESTS ====================
const NPC_LINES = {
  mo: () => qdone('forest') ? ['Mayor Mo:happy|Splendid work, Hitori! Toddle over to the old well. Mind the echo.'] : ['Mayor Mo:happy|Ahoy, youngsters! Sprouts have overrun my meadow, and my glow mushrooms have wandered off!', 'Mayor Mo:neutral|Squash 3 Sprouts in the Sprout Meadow, then fetch 3 Glow Mushrooms from the Mushroom Grove.', 'Hitori:smug|Squash? Oh, I LOVE squashing.', 'Mayor Mo:worried|...Please save the mushrooms too.'],
  bella: () => S.ev.bella ? ['Baker Bella:smug|Steven has already eaten six of my muffins. Six!'] : (S.ev.bella = 1, S.snacks += 2, ['Baker Bella:happy|Fresh from the oven! Growing adventurers need snacks.', 'Baker Bella:laugh|Two snacks, on the house!']),
  pip: () => ['Pip:shock|Don\'t go in the tall grass without snacks! Sprouts hit like wet socks!', 'Hitori:smug|Wet socks. I want to hit them back.'],
  finn: () => ['Fisher Finn:sad|Haven\'t caught a thing in years. This pond only holds old boots.', 'Fisher Finn:neutral|Still. Better than the city, I hear. Nobody there at all, they say...'],
  morrow: () => ['Hermit Morrow:neutral|Dark is the only teacher this wood has. Keep your light close.', 'Hermit Morrow:smug|Rusty keys sleep in the Key Ruins. The castle door is hungry. And it\'s... watching us.'],
  vesper: () => ['Lady Vesper:sad|I wait for someone who never arrives. His name has slipped away from me.', 'Lady Vesper:scared|Does it slip from you too?'],
  rattles: () => ['Ser Rattles:laugh|Ha! I have no guts and I\'m STILL fighting!', 'Ser Rattles:neutral|The throne awaits. Mind the shadows. And the tall one.'],
  lou: () => ['Lifeguard Lou:angry|NO RUNNING by the water!!', 'Lifeguard Lou:neutral|...Okay, running\'s fine if it\'s crabs. Shells are in Shell Cove. The lighthouse is to the south. Don\'t look down.'],
  coco: () => S.ev.coco ? ['Coco:smug|Nothing is free twice. Ha! Kidding. Maybe.'] : (S.ev.coco = 1, S.snacks++, ['Coco:happy|Ice cream! Free for friends today!', 'Coco:laugh|Here, have a snack too!']),
  dex: () => ['Dex:smug|Dude, the waves here are totally... static. Weird, right?', 'Dex:neutral|Heard some kid named Uku wiped out near the lighthouse. Or it was a dream.'],
  nova: () => ['Nurse Nova:neutral|Welcome to the clinic island. Please do not touch the charts.', 'Nurse Nova:worried|...Five patients. Four beds. It never adds up.', 'Hitori:dark|Hehehe. Maybe I\'M the one who doesn\'t fit.'],
  chips: () => ['Mr. Chips:smug|A customer! Care for a wager? Your soul is legal tender.', 'Mr. Chips:neutral|The House is behind me. The House does not lose.'],
  steven: () => ['Steven:sad|Don\'t look at me. Fourth shift. Pay is basically air.', 'Steven:neutral|Honestly? Still better than the outdoors.'],
  uku: () => ['Uku:neutral|Hitori... you came. I\'m... fuzzy. I think I got lost out there.', 'Uku:sad|I think in the real world... I didn\'t make it back. Some of me stayed here.', 'Uku:angry|Beat the House, please. It keeps counting me as chips.'],
  biscuit: () => ['Old Biscuit:happy|Woof. Wise dog here. Sit. ...No, I mean YOU sit.', 'Old Biscuit:neutral|Rule one: nobody is ever really lost. They are only waiting for someone to come looking.', 'Old Biscuit:sad|Rule two: if the nurse says it is dinner time, eat dinner. Even in dreams.', 'Old Biscuit:blush|Rule three: belly rubs are non-negotiable.', 'Hitori:smug|...Hehehe. I like you.'],
  mochi: () => ['Mochi:neutral|Mrrp. Time is a sunbeam.', 'Mochi:happy|Chase it, you will never catch it. Sit in it, and it is yours.', 'Mochi:smug|Also: the dark is only the day, napping.'],
  hoot: () => ['Professor Hoot:neutral|Hoo. A riddle: what has a face but never smiles?', 'Professor Hoot:smug|A clock. Or a polaroid. Or a patient chart. Take your pick.', 'Professor Hoot:worried|Speak softly in the cold. The dark does not care how loud you are.'],
  shell: () => ['Old Shell:neutral|Slow is not the opposite of far.', 'Old Shell:happy|The tide always returns. So do you.', 'Old Shell:sad|Even when you do not want to. Especially then.'],
  caroline: () => ['Caroline:shock|HITORI!! Oh thank goodness, I thought I was the only one left!', 'Caroline:scared|Everyone vanished. No shops, no people... just these buzzing signs.', 'Caroline:happy|But you\'re here! Let\'s stick together!']
};
function npc(e) {
  const id = e.id, sq = SQ.find(s => s.giver == id), st = sq && S.sq[sq.id], lines = NPC_LINES[id]();
  if (id == 'caroline') return D(lines, () => { S.found = 1; S.party = [1, PL]; E = E.filter(x => x.id != 'caroline'); say('Caroline joined you.') });
  if (e.c.animal) return D(lines, () => { if (!S.ev['gift' + id]) { S.ev['gift' + id] = 1; S.snacks++; say(e.c.n + ' left a snack on the floor for you. (+1)') } });
  if (!sq) return D(lines);
  const nm = e.c.n;
  if (!st) return D([...lines, nm + ':neutral|' + sq.desc + ' Will you help?', 'Hitori:smug|Fine. For fun.'], () => { S.sq[sq.id] = { s: 1, p: 0 }; say('Quest started: ' + sq.name); if (sq.lore) addLore2(sq.lore) });
  if (st.s == 1 && st.p < sq.n) return D([nm + ':neutral|Still looking? ' + sq.desc + ' (' + st.p + '/' + sq.n + ')']);
  if (st.s == 1) return D([nm + ':happy|' + sq.done, '|Quest complete: ' + sq.name + (sq.reward.item ? '. Received ' + ITEMDEF[sq.reward.item].n + '!' : '')], () => { st.s = 2; if (sq.reward.item) giveItem(sq.reward.item); S.xp += sq.reward.xp; beep(880, .2); checkLevel() });
  D(lines);
}
const addLore2 = t => { S.notes = S.notes || []; if (!S.notes.includes(t)) S.notes.push(t) };
function checkLevel() { while (S.xp >= S.lv * 20) { S.xp -= S.lv * 20; S.lv++; S.party.forEach(i => S.hp[i] = maxHp(i)); say('LEVEL UP! Lv' + S.lv) } }
// ==================== STORY EVENTS (Hitori leads; Uku is the one who goes missing) ====================
const events = {
  well() { D(['Caroline:happy|Ooh, a wishing well! Make a wish!', 'Steven:sad|It looks cursed.', 'Hitori:smug|Hehehe... let\'s see how deep it goes!', 'Uku:neutral|...it\'s kinda deep, huh.', '|The light goes out. Wind howls. Something laughs under the water.', 'Hitori:shock|Guys?', 'Hitori:scared|UKU?!'], () => { S.party = [PL]; shake = 40; D(['|Everyone is gone. Only the dark remains. The thing you fear most.', 'Hitori:scared|It\'s okay. It\'s just the dark. Just the dark. Just the--'], () => hscene('dark', () => { S.b = 'dark'; S.party = [0, 1, PL]; S.hp[3] = 0; D(['|The dark lets go. A path of gnarled trees opens ahead.', 'Caroline:shock|Hitori! There you are! Have we... lost someone?', 'Steven:sad|Don\'t know. Let\'s keep going.', 'Hitori:smug|Hehe. Follow me, then.'], () => gotoHub('D')) })) }) },
  throne() { D(['Caroline:neutral|Why are we in a castle again?', 'Steven:sad|Ugh. No idea. Something about... finding someone?', 'Hitori:scared|...someone small. Orange hair. It\'s on the tip of my tongue.', '|One by one, the faces of your friends turn blank. The shadows crawl up the walls.', '|Alone now. Hundreds of tiny legs skitter in the dark...'], () => { shake = 40; hscene('spider', () => { S.b = 'beach'; S.party = [0, 1, PL]; D(['Caroline:happy|Hitori!! We found you! Look, a beach!', 'Hitori:sad|Uku... his name was Uku. I remember now.', 'Steven:sad|...Yeah. Me too. Let\'s find him.'], () => gotoHub('B')) }) }) },
  tower() { D(['Caroline:happy|A lighthouse! Let\'s climb it!', 'Steven:scared|Nope. Heights. No.', '|You climb alone. The railing is gone. Far below, the waves look like static...', '|Your feet won\'t move. Somewhere, the Shadow whispers: "don\'t look down."'], () => { shake = 40; hscene('height', () => { S.b = 'city'; S.party = [PL]; D(['|You reach the top. The sky flickers like a broken screen.', '|When you look back down, your friends are gone. So is the sea.', '|Neon kanji hum in the dark. You are alone.'], () => gotoHub('C')) }) }) },
  house() { D(['|The House spins its reels. "WELCOME BACK, HITORI. THE HOUSE ALWAYS WINS."'], () => startBattle({ k: 'enemy', t: 'house', x: 0, y: 0, boss: 1 })) }
};
function ending() { D(['Uku:sad|Thank you for looking for me, Hitori. Out there, I got lost... and in this world, I didn\'t make it.', 'Uku:happy|But you remembered me. That\'s a kind of synchronicity.', 'Caroline:happy|We\'ll all be here. Always.', 'Steven:smug|Okay fine, the outside wasn\'t that bad.', 'Hitori:smug|Hehehe... so this is where the story ends?', 'Hitori:dark|Or is it where the REAL one starts.', '|Synchronicity - thanks for playing.'], () => { sc = 'quit2' }) }
// ==================== EASTER EGGS ====================
const EGG_LINES = {
  pond: ['|You look into the pond. Your reflection keeps smiling after you stop.', 'Hitori:shock|...Hehe. Hehehe. Stop copying me!'],
  doll: ['|A little straw doll hangs from a branch. Its mouth is stitched shut. So is its pocket.', '|There is a note inside: "She isn\'t supposed to wake up here."'],
  bottle: ['|A message in a bottle: "if you can read this, you are not the one who is dreaming."'],
  phone: ['|The payphone rings. You pick up.', '|A calm voice: "Please take your medication. Dinner is at six."', 'Hitori:scared|...Who is this?', '|Click.'],
  chart: ['|A clipboard on the nurse\'s stand. FIVE PATIENTS. FOUR BEDS.', '|One name has been blacked out. You can still read it on the paper behind: U-K-U.']
};
function egg(e) { const id = e.id, first = !S.lore.includes(id); D(EGG_LINES[id], () => { if (first) addLore(id) }) }
function tvEgg() {
  if (!S.items.includes('cassette')) return D(['|A CRT TV stands alone in the snow, humming static. Beneath the screen is a cassette-shaped slot.']);
  if (S.ev.tape) return D(['|The tape has already played. Only static now.']);
  D(['|You slide the labeled cassette into the TV...'], () => hscene('tape', () => { S.ev.tape = 1; addLore('tape'); D(['Hitori:scared|...No. No no no. That\'s not funny.', 'Hitori:dark|Hehe... hehehehe. Of course it\'s not real. That\'s why I\'m not scared.', 'Hitori:sad|...Right?']) }));
}
function drawEgg(e, x, y) {
  const k = e.kind, done = S.lore.includes(e.id);
  if (k == 'puddle') { ell(x, y - 2, 12, 5, '#2a3a5a'); ell(x, y - 2, 10, 4, '#6a8ab8'); ell(x - 2, y - 3, 3, 1, '#c8e0ff'); if ((tick >> 5) & 1) r(x + 3, y - 3, 3, 1, '#fff') }
  if (k == 'doll') { r(x, y - 36, 1, 20, '#5a4a3a'); r(x - 4, y - 18, 8, 10, '#c8a860'); r(x - 3, y - 26, 6, 8, '#d8b878'); r(x - 2, y - 23, 1, 1, '#222'); r(x + 1, y - 23, 1, 1, '#222'); r(x - 2, y - 20, 4, 1, '#222'); r(x - 5, y - 17, 2, 6, '#c8a860'); r(x + 3, y - 17, 2, 6, '#c8a860') }
  if (k == 'bottle') { ell(x, y, 8, 2, 'rgba(0,0,0,.25)'); r(x - 3, y - 10, 7, 9, '#7ac8b8'); r(x - 1, y - 14, 3, 5, '#7ac8b8'); r(x - 1, y - 16, 3, 2, '#8a5a30'); r(x - 2, y - 8, 4, 5, '#f4ecd0') }
  if (k == 'phone') { ell(x, y, 7, 2, 'rgba(0,0,0,.3)'); r(x - 5, y - 26, 10, 26, '#2a3a5a'); r(x - 4, y - 25, 8, 24, '#4a6a9a'); r(x - 3, y - 22, 6, 6, '#c8e0ff'); r(x - 3, y - 14, 6, 5, '#222'); r(x - 6, y - 20, 2, 8, '#111'); if ((tick >> 3) % 20 < 3) { r(x - 9, y - 30, 2, 2, '#ff0'); r(x + 7, y - 30, 2, 2, '#ff0') } }
  if (k == 'clip') { ell(x, y, 8, 2, 'rgba(0,0,0,.25)'); r(x - 1, y - 18, 2, 18, '#999'); r(x - 8, y - 32, 16, 16, '#6a4a2a'); r(x - 7, y - 31, 14, 14, '#f4f0e0'); for (let i = 0; i < 4; i++) r(x - 5, y - 28 + i * 3, 10, 1, '#555'); r(x - 3, y - 33, 6, 3, '#aaa') }
  if (!done && (tick >> 4) % 6 < 2) r(x - 1, y - 40, 2, 2, '#fff');
}
function drawTV(x, y, tape) {
  ell(x, y, 12, 3, 'rgba(0,0,0,.3)'); r(x - 11, y - 20, 22, 18, '#3a3a40'); r(x - 10, y - 19, 20, 16, '#6a6a72'); r(x - 8, y - 17, 13, 11, '#10181a'); const n = (tick >> 2) % 7;
  for (let i = 0; i < 5; i++) r(x - 8 + ((i * 7 + n) % 11), y - 17 + i * 2, 3, 1, 'rgba(210,230,230,' + (.25 + (i + n) % 3 * .2) + ')'); r(x + 7, y - 17, 2, 2, tape ? '#7f7' : '#a44'); r(x - 6, y - 2, 12, 2, '#222'); r(x - 5, y - 24, 1, 5, '#aaa'); r(x + 4, y - 24, 1, 5, '#aaa'); ell(x, y - 8, 20, 14, 'rgba(160,220,220,.08)');
}

const NOTES = { 'D.spot1': ['|A signpost with no arrows. Someone has written: "THIS WAY (probably)".'], 'D.spot2': ['|A hanging lantern with no flame. It is warm anyway.', 'Hitori:smug|Hehehe. A little ghost-fire. Cute.'], 'B.spot2': ['|Footprints in the sand lead to the water and stop. They are all the same size. They are all yours.'] };
