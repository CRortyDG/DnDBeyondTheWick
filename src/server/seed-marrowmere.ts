// The Bell under Marrowmere: an original starter campaign (a lake town on stilts,
// a missing bellringer, a drowned bell tower). Everything here was written for this
// app; the pictures are in public/art/marrowmere/. Server-only, so the episode's
// text never reaches the browser code.

import { blankGame } from "@/shared/presets";
import type { GameState, Item, Notice } from "@/shared/types";

const ART = "/art/marrowmere/";
const img: Record<string, string> = Object.fromEntries(
  ["intro-ferry", "intro-town", "belfry", "map", "wenna", "bettany", "reeve", "pell", "intro-ferry-tall", "intro-town-tall", "belfry-tall"].map((f) => [f, `${ART}${f}.jpg`]),
);

export const MARROWMERE_NAME = "The Bell under Marrowmere";

/** A new campaign that starts as The Bell under Marrowmere. */
export function marrowmereGame(id: string, name = MARROWMERE_NAME, now = Date.now()): GameState {
  const s = blankGame(id, name, now);
  s.origin = { kind: "marrowmere" };
  s.town = "Marrowmere";
  s.scenes = [
    { id: 's-board', label: 'Notice board', kind: 'notice', reveal: false, art: {}, slug: 'notice-board' },
    { id: 's-table', label: 'The Table', kind: 'table', reveal: false, alt: 'The round table from above, one candle per player', slug: 'table' },
    { id: 's-map', label: 'Marrowmere', kind: 'map', reveal: false, art: { url: img.map }, alt: 'Map of Marrowmere and the Mere', slug: 'marrowmere',
      map: { legendOn: true, legendStyle: 'names', sealScale: 1, pins: [
        { id: 'mm1', number: 1, showsAs: '', name: 'The Lantern & Eel', type: 'tavern', description: 'Warm, crooked, and built on twenty stilts.', dmNotes: '', discovered: true, x: 0.205, y: 0.47 },
        { id: 'mm2', number: 2, showsAs: '', name: 'Ferry Pier', type: 'docks', description: 'Where the Patient Heron ties up twice a week.', dmNotes: '', discovered: true, x: 0.37, y: 0.495 },
        { id: 'mm3', number: 3, showsAs: '', name: 'Reedwater Market', type: 'market', description: 'Stalls on rafts, lashed together each morning.', dmNotes: '', discovered: true, x: 0.2, y: 0.63, link: { kind: 'shop', shopId: 'market' } },
        { id: 'mm4', number: 4, showsAs: '', name: 'The Drowned Belfry', type: 'ruin', description: 'A bell tower standing alone in the middle of the Mere.', dmNotes: 'The bell rings for the sunken village below.', discovered: false, x: 0.535, y: 0.46 },
        { id: 'mm5', number: 5, showsAs: '', name: 'Shrine of the Still Water', type: 'shrine', description: 'A white chapel on the far shore.', dmNotes: '', discovered: false, x: 0.833, y: 0.39 },
      ] } },
    { id: 's-wenna', label: 'Captain Wenna Quill', kind: 'portrait', reveal: false, art: { url: img.wenna }, name: 'Captain Wenna Quill', title: 'Master of the Patient Heron', alt: 'Portrait of a ferry captain in a navy cap', slug: 'wenna' },
    { id: 's-bettany', label: 'Bettany Crane', kind: 'portrait', reveal: false, art: { url: img.bettany }, name: 'Bettany Crane', title: 'Keeper of the Lantern & Eel', alt: 'Portrait of an old innkeeper with round spectacles', slug: 'bettany' },
    { id: 's-reeve', label: 'Reeve Tobias Marsh', kind: 'portrait', reveal: true, art: { url: img.reeve }, name: 'Reeve Tobias Marsh', title: 'Reeve of Marrowmere', alt: 'Portrait of a bald official with a brass chain of office', slug: 'reeve' },
    { id: 's-pell', label: 'Pell', kind: 'portrait', reveal: true, art: { url: img.pell }, name: 'Pell', title: 'The bellringer', alt: 'Portrait of a hooded bellringer holding a small brass bell', slug: 'pell' },
    { id: 's-ferry', label: 'The crossing', kind: 'image', reveal: false, art: { url: img['intro-ferry'] }, alt: 'A ferry crossing a misty lake at dusk', slug: 'crossing' },
    { id: 's-town', label: 'Marrowmere by night', kind: 'image', reveal: false, art: { url: img['intro-town'] }, alt: 'Stilt houses lit up along a lake', slug: 'town-night' },
    { id: 's-belfry', label: 'The Drowned Belfry', kind: 'image', reveal: true, art: { url: img.belfry }, alt: 'A lone bell tower rising out of fog on a lake', slug: 'belfry' },
    { id: 's-black', label: 'Black screen', kind: 'black', reveal: false, slug: 'black-screen' },
  ];
  s.quick = ['black', 'board', 'map/marrowmere', 'prop/crossing', 'prop/town-night', 'person/bettany', 'person/reeve', 'prop/belfry', 'table', null];
  s.shops = [
    { id: 'market', name: 'Reedwater Market', subtitle: 'Stalls on rafts, lashed together each morning', visibility: 'hidden', playerIds: [] },
    { id: 'smith', name: 'Ferrow & Daughters', subtitle: 'Smiths. Mostly hooks, some swords', visibility: 'hidden', playerIds: [] },
    { id: 'glass', name: 'The Glass Heron', subtitle: 'Tonics, charms and bottled weather', visibility: 'hidden', playerIds: [], renown: 1 },
  ];
  const it = (id: string, shopId: string, name: string, gp: number, description: string, category: Item["category"] = "gear", extra: Partial<Item> = {}): Item => ({ id, shopId, name, priceCp: Math.round(gp * 100), description, tier: 'sale', reason: '', hint: '', hidePrice: false, stock: null, restockNote: '', category, kind: 'purchase', ...extra });
  s.items = [
    it('i-rope', 'market', 'Tarred rope, 50 ft', 1, 'Smells of pitch. Holds a horse.'),
    it('i-lantern', 'market', 'Hooded lantern', 5, 'Keeps the fog from swallowing the light.'),
    it('i-waders', 'market', 'Eelskin waders', 3, 'Knee-deep in the Mere and still dry.', 'travel'),
    it('i-rations', 'market', 'Smoked fish, a week', 2.5, 'Rations, if you like smoked fish. You will.', 'travel'),
    it('i-boat', 'market', 'Hire a punt for the day', 4, 'Flat-bottomed. Pole included. Bring it back.', 'services', { kind: 'service' }),
    it('i-cureall', 'market', 'Healer\'s salve', 50, 'Restores 2d4 + 2 hit points. Stings.', 'healing'),
    it('i-spear', 'smith', 'Eel spear', 3, 'Three barbed tines. Works on more than eels.'),
    it('i-shield', 'smith', 'Shield', 10, 'Oak, banded in iron, a heron painted on the front.'),
    it('i-sword', 'smith', 'Longsword', 15, 'Plain, honest steel.'),
    it('i-chain', 'smith', 'Chain shirt', 50, 'Oiled against the damp.'),
    it('i-hook', 'smith', 'Grappling hook', 2, 'Forged for hauling nets. Good for walls too.'),
    it('i-fogglass', 'glass', 'Fog-glass', 120, 'Look through it and the mist thins for an hour.', 'magic'),
    it('i-calm', 'glass', 'Draught of Still Water', 75, 'Breathe underwater for ten minutes. Tastes of pond.', 'magic'),
  ];
  s.entries = [
    { id: 'e-wenna', kind: 'person', slug: 'wenna', name: 'Captain Wenna Quill', title: 'Master of the Patient Heron', summary: 'Ran the ferry across the Mere for twenty years. Doesn\'t like the fog this year.', nickname: '', hint: '', areas: ['The Pier'], links: [], facts: [{ id: 'e-wenna-f1', slug: 'heard-the-bell', text: 'Heard the drowned bell ring twice on the crossing, and turned the ferry around.' }], sceneId: 's-wenna', stage: 'found', start: 'found', dmNote: 'She\'ll take the party out to the belfry for 5 gp, but won\'t tie up.', secrets: '', foundAt: now, foundIn: null },
    { id: 'e-bettany', kind: 'person', slug: 'bettany', name: 'Bettany Crane', title: 'Keeper of the Lantern & Eel', summary: 'Pours the drinks and knows everyone\'s business. Calls everyone "lamb".', nickname: '', hint: '', areas: ['Marrowmere'], links: ['e-lantern-eel'], facts: [{ id: 'e-bettany-f1', slug: 'knew-pell', text: 'Was the last to see Pell the bellringer, three nights ago.' }, { id: 'e-bettany-f2', slug: 'keeps-the-key', text: 'Keeps a spare key to the belfry behind the bar, "for emergencies".' }], sceneId: 's-bettany', stage: 'found', start: 'found', dmNote: 'Her line: "Sit, lamb. The fog\'s not going anywhere."', secrets: '', foundAt: now, foundIn: null },
    { id: 'e-reeve', kind: 'person', slug: 'reeve', name: 'Reeve Tobias Marsh', title: 'Reeve of Marrowmere', summary: 'Wears the brass chain of office everywhere, even to bed, people say.', nickname: 'The man with the brass chain', hint: 'Someone in town is paying good coin to find the bellringer.', areas: ['Marrowmere'], links: ['e-pell'], facts: [{ id: 'e-reeve-f1', slug: 'pays-twenty', text: 'Offers twenty gold apiece to anyone who brings Pell home.' }, { id: 'e-reeve-f2', slug: 'afraid-of-water', text: 'Can\'t swim, and has never once set foot in a boat.' }], sceneId: 's-reeve', stage: 'rumored', start: 'rumored', dmNote: 'Nervous. Wants this solved before the Lantern Fair.', secrets: 'His grandfather sealed the old village under the Mere.', wants: 'Quiet, and the Lantern Fair to go ahead.', voice: 'Clipped, polite, keeps clearing his throat.' },
    { id: 'e-pell', kind: 'person', slug: 'pell', name: 'Pell', title: 'The bellringer', summary: 'Rowed out to ring the evening bell and didn\'t come back.', nickname: 'The missing bellringer', hint: 'Someone rows out to the belfry every evening. Not lately.', areas: ['The Mere'], links: ['e-belfry'], facts: [{ id: 'e-pell-f1', slug: 'heard-voices', text: 'Heard voices answering the bell from under the water.' }], sceneId: 's-pell', stage: 'hidden', start: 'hidden', dmNote: 'Found alive in the belfry loft, guarding the bell rope.', secrets: '' },
    { id: 'e-lantern-eel', kind: 'place', slug: 'lantern-eel', name: 'The Lantern & Eel', title: 'Bettany\'s tavern', summary: 'Warm, crooked, and built on twenty stilts.', nickname: '', hint: '', areas: ['Marrowmere'], links: ['e-bettany'], facts: [], stage: 'found', start: 'found', pin: { sceneId: 's-map', pinId: 'mm1' }, dmNote: '', secrets: '', foundAt: now, foundIn: null },
    { id: 'e-belfry', kind: 'place', slug: 'drowned-belfry', name: 'The Drowned Belfry', title: 'All that\'s left of Old Marrow', summary: 'A bell tower standing alone in the middle of the Mere. The village it served is underneath.', nickname: 'The tower in the water', hint: 'A bell tower standing in the middle of the lake.', areas: ['The Mere'], links: ['e-pell'], facts: [{ id: 'e-belfry-f1', slug: 'rings-twice', text: 'The bell rang twice at midnight with nobody in the tower.' }, { id: 'e-belfry-f2', slug: 'old-marrow', text: 'A whole village, Old Marrow, lies under the water beneath it.' }], stage: 'rumored', start: 'rumored', pin: { sceneId: 's-map', pinId: 'mm4' }, dmNote: '', secrets: '' },
    { id: 'e-shrine', kind: 'place', slug: 'shrine', name: 'Shrine of the Still Water', title: '', summary: 'A white chapel on the far shore.', nickname: '', hint: 'Lights on the far shore.', areas: ['The Mere'], links: [], facts: [], stage: 'hidden', start: 'hidden', pin: { sceneId: 's-map', pinId: 'mm5' }, dmNote: '', secrets: '' },
    { id: 'e-shop-market', kind: 'shop', slug: 'reedwater-market', name: 'Reedwater Market', title: 'Stalls on rafts', summary: '', nickname: '', hint: '', areas: ['Marrowmere'], links: [], facts: [], stage: 'hidden', dmNote: '', secrets: '', shopId: 'market' },
    { id: 'e-shop-smith', kind: 'shop', slug: 'ferrow-daughters', name: 'Ferrow & Daughters', title: 'Smiths', summary: '', nickname: '', hint: '', areas: ['Marrowmere'], links: [], facts: [], stage: 'hidden', dmNote: '', secrets: '', shopId: 'smith' },
    { id: 'e-shop-glass', kind: 'shop', slug: 'glass-heron', name: 'The Glass Heron', title: 'Tonics and charms', summary: '', nickname: '', hint: '', areas: ['Marrowmere'], links: [], facts: [], stage: 'hidden', dmNote: '', secrets: '', shopId: 'glass' },
    { id: 'e-mon-reedlurk', kind: 'monster', slug: 'reedlurk', name: 'Reedlurk', title: 'Eel-backed ambusher', summary: 'Lies flat in the shallows, all teeth and slime.', nickname: 'Something in the reeds', hint: 'Fishermen say the reeds bite back this year.', areas: ['The Mere'], links: [], facts: [{ id: 'e-mon-reedlurk-f1', slug: 'hates-light', text: 'Flinches from bright lantern light.' }], stage: 'rumored', start: 'rumored', dmNote: '', secrets: '', templateId: 'm-reedlurk' },
    { id: 'e-mon-fogmoth', kind: 'monster', slug: 'fog-moth', name: 'Fog Moth', title: 'A moth the size of a dog', summary: 'Drinks lantern oil. Sheds a choking grey dust.', nickname: '', hint: '', areas: ['The Mere'], links: [], facts: [], stage: 'hidden', start: 'hidden', dmNote: '', secrets: '', templateId: 'm-fogmoth' },
  ];
  s.monsters = [
    { id: 'm-reedlurk', name: 'Reedlurk', displayName: 'Something in the reeds', ac: 12, hp: '18', initBonus: 2, speed: '20 ft., swim 40 ft.', attacks: [{ name: 'Bite', bonus: 4, damage: '1d8 + 2' }], abilities: [{ id: 'drag', name: 'Drag Under', text: 'A bitten creature makes a DC 12 Str save or is pulled into the water.' }, { id: 'reeds', name: 'Reed Camouflage', text: 'Hidden while still in the reeds.' }], resist: '', immune: '', notes: '', dmNote: 'Two of them, one each side of the boat.' },
    { id: 'm-fogmoth', name: 'Fog Moth', displayName: 'A great grey moth', ac: 11, hp: '13', initBonus: 3, speed: 'fly 40 ft.', attacks: [{ name: 'Wing buffet', bonus: 3, damage: '1d6 + 1' }], abilities: [{ id: 'dust', name: 'Choking Dust', text: '10-ft cloud, DC 11 Con save or poisoned until end of next turn.', recharge: 5 }], resist: '', immune: '', notes: '', dmNote: 'Goes for whoever holds the lantern.' },
  ];
  s.episodes = [{ id: 'ep1', title: 'The Bell That Rang Twice', beats: [
    { id: 'b1', title: 'Across the Mere', notes: ['Everyone arrives together on the Patient Heron, at dusk, in the fog.', 'Captain Wenna is jumpy: the bell rang twice last night and she nearly turned back.', 'Ask each player: "Why did you get on that boat?" One answer each.'], checks: [], branches: [], actions: [{ type: 'show', ref: 'prop/crossing' }], readAloud: ['"The fog lifts just long enough to show you lights on stilts, and a tower standing alone in the water."'], readAloudAt: 0 },
    { id: 'b2', title: 'Marrowmere', notes: ['The ferry ties up at the pier. Show them the map: the town, the market, the tower in the middle of the Mere.'], checks: [], branches: [], actions: [{ type: 'show', ref: 'map/marrowmere' }] },
    { id: 'b3', title: 'The Lantern & Eel', notes: ['Bettany pours drinks, calls everyone "lamb", and points at the notice board.', 'The Reeve\'s notice is new: the bellringer is missing.'], checks: [], branches: [], actions: [{ type: 'show', ref: 'person/bettany' }] },
    { id: 'b4', title: 'The Reeve\'s offer', notes: ['Reeve Marsh bustles in, chain clinking. Twenty gold each to bring Pell home.', 'If they haggle: he goes to twenty-five, then sweats.'], checks: [{ skill: 'Charisma (Persuasion)', dc: 14, what: 'get more pay', success: '25 gp each' }], branches: [{ when: 'they refuse', then: 'Bettany slides the belfry key across the bar anyway.' }], actions: [{ type: 'reveal', ref: 'person/reeve', stage: 'found' }], readAloud: ['"You\'re the new faces off the ferry? Good. I need faces nobody here will miss."'], readAloudAt: 0 },
    { id: 'b5', title: 'Supplies at the market', notes: ['Open Reedwater Market. Lanterns and waders matter out on the Mere.', 'Pay the advance: 5 gp each from the Reeve.'], checks: [], branches: [], actions: [{ type: 'bank' }] },
    { id: 'b6', title: 'Out to the belfry', notes: ['Wenna rows them out but won\'t tie up. The fog closes behind them.'], checks: [{ skill: 'Wisdom (Perception)', dc: 13, what: 'spot movement in the reeds', fail: 'the reedlurks get a surprise round' }], branches: [], actions: [{ type: 'show', ref: 'prop/belfry' }, { type: 'reveal', ref: 'place/drowned-belfry', stage: 'found' }] },
    { id: 'b7', title: 'Something in the reeds', notes: ['Two reedlurks hit the boat from both sides; a fog moth comes for the lantern.'], checks: [], branches: [], actions: [{ type: 'fight', monsters: [{ name: 'Reedlurk', count: 2 }, { name: 'Fog Moth', count: 1 }] }] },
    { id: 'b8', title: 'The bellringer', notes: ['Pell is in the loft, cold and stubborn, holding the bell rope.', '"If I stop ringing, they come up."'], checks: [], branches: [], actions: [{ type: 'reveal', ref: 'person/pell', stage: 'found' }, { type: 'fact', ref: 'person/pell/heard-voices' }] },
  ] }];
  s.jobs = [
    { id: 'j-bell', status: 'open', pinned: true, createdAt: now, title: 'Missing: Our Bellringer', postedBy: 'Reeve Tobias Marsh', body: 'Pell rowed out to ring the evening bell three nights ago and has not come back.', reward: { kind: 'each', cp: 2000 }, renown: 0, renownPoints: 3, style: 'handbill',
      look: { pin: 'red', font: 'caps', kicker: 'By order of the Reeve of Marrowmere', titleSize: 54, listLabel: 'Wanted', list: [{ head: 'Steady Rowers', text: 'to reach the belfry in the fog' }, { head: 'Sharp Eyes', text: 'to find what rang the bell twice' }], footer: 'Twenty gold apiece to bring Pell home.\nAsk for the Reeve at the Lantern & Eel.', signNote: 'Reeve of Marrowmere' },
      place: { x: 690, y: 70, rot: 1, w: 520, z: 20 }, dm: { adventure: 'Episode one: The Bell That Rang Twice', loot: '', twists: '', notes: '' }, pinnedAt: now },
    { id: 'j-hat', status: 'open', pinned: false, createdAt: now, title: 'Lost: one heron-feather hat', postedBy: 'Odalys, at the market', body: 'Blew off the pier in the wind. Grey, three feathers, very fine. A gold piece and my gratitude.', reward: { kind: 'total', cp: 100 }, renown: 0, style: 'bill', dm: { adventure: '', loot: '', twists: 'A heron is wearing it.', notes: '' } },
    { id: 'j-nets', status: 'open', pinned: false, createdAt: now, title: 'Something is cutting our nets', postedBy: 'The Fishers of the Mere', body: 'Every net on the north shore cut clean through, three mornings running. Fifty gold for whoever stops it.', reward: { kind: 'total', cp: 5000 }, renown: 1, style: 'official', dm: { adventure: 'Reedlurk nest in the north reeds', loot: '', twists: '', notes: '' } },
  ];
  const n = (id: string, style: Notice["style"], title: string, body: string, sign: string, look: Notice["look"], place: Notice["place"]): Notice => ({ id, slug: id, style, title, body, sign, look, up: true, place, createdAt: now, dmNote: '' });
  s.notices = [
    n('lantern-fair', 'parchment', 'The Lantern Fair', 'Floating lanterns on the Mere at the turn of the season. Bring a candle and a wish.', 'The Reeve\'s office', { pin: 'red', font: 'poster', titleSize: 44, ink: 'red' }, { x: 60, y: 50, w: 320, rot: -3, z: 1 }),
    n('no-swimming', 'cream', 'No Swimming', 'Past the third marker post. By order. Yes, that means you.', 'The Reeve of Marrowmere', { pin: 'blue', band: true, titleSize: 30, align: 'left' }, { x: 400, y: 40, w: 270, rot: 2, z: 2 }),
    n('lost-cat', 'white', 'Lost: grey cat', 'Answers to Barnacle. Does not answer, really. Likes eels.', 'Ask at the Lantern & Eel', { pin: 'green', font: 'hand', titleSize: 38 }, { x: 430, y: 340, w: 250, rot: -4, z: 3 }),
    n('ferry', 'aged', 'Ferry Times', 'Twice a week, fog permitting. Fog has not been permitting.', 'Captain W. Quill', { pin: 'red', titleSize: 32 }, { x: 80, y: 470, w: 310, rot: 2, z: 4 }),
    n('eels', 'white', 'Eels for sale', 'Smoked, pickled, or still arguing. Best on the Mere.', 'Ferrow\'s youngest', { pin: 'green', font: 'hand', titleSize: 36 }, { x: 100, y: 790, w: 280, rot: -2, z: 6 }),
    n('choir', 'cream', 'Choir Practice', 'Shrine of the Still Water, every evening the bell rings. Which lately is never.', 'Sister Ondine', { pin: 'blue', titleSize: 28 }, { x: 1330, y: 500, w: 290, rot: 3, z: 7 }),
    n('punts', 'parchment', 'Punts for hire', 'By the day or the hour. Bring it back the right way up.', 'The market', { pin: 'red', font: 'poster', titleSize: 36 }, { x: 1320, y: 800, w: 300, rot: -2, z: 8 }),
  ];
  s.tables = [{ id: 'rt-rumors', name: 'Marrowmere rumors', die: 6, kind: 'rumor', areas: ['Marrowmere'], dmNote: '', createdAt: now, rows: [
    { from: 1, to: 1, text: 'The bell only rings when the water is perfectly still.' }, { from: 2, to: 2, text: 'Old Marrow had a church, a mill and forty houses. They\'re all still down there.' },
    { from: 3, to: 3, text: 'The Reeve\'s grandfather flooded the valley on purpose.' }, { from: 4, to: 4, text: 'Fishers have seen lights moving under the water at night.' },
    { from: 5, to: 5, text: 'Pell had a sweetheart on the far shore.' }, { from: 6, to: 6, text: 'Something has been cutting the nets on the north shore.' } ] }];
  s.arrival = { introKind: 'custom', title: 'The Lantern & Eel', captain: 'Wenna Quill', welcome: 'Welcome to Marrowmere. Take a seat.',
    template: 'You\'re invited to The Bell under Marrowmere! Tap your link before we play: {link}',
    slides: [
      { id: 'sl1', image: img['intro-ferry-tall'], text: 'Three days on the Patient Heron, and the fog has not lifted once.' },
      { id: 'sl2', image: img['intro-town-tall'], text: 'Then lights. A town on stilts, standing in the lake: Marrowmere.' },
      { id: 'sl3', image: img['belfry-tall'], text: 'And out in the middle of the water, a bell tower with no church beneath it. Last night, it rang twice.' },
    ] };
  s.renownProgress = true;
  return s;
}
