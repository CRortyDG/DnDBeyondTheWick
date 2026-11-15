// Assets: everything the TV can show, reached by a short name ("ref") from
// wherever it lives. People, places, shops and monsters live in Discovery;
// maps live with their pins; handouts and pictures are props; a few screens
// are built in. The quick bar, the finder, run-sheet beats ("show: ...") and
// the DM's Show buttons all speak in these refs.
//
//   person/mags          a Discovery entry (any kind/slug)
//   map/candlefair       a map; map/candlefair/3 zooms to pin 3
//   prop/artums-notice   a handout, image or other picture
//   note/tale-night      one note from the notice board, up close
//   board, leads, table, stinger, black   built-in screens
//   ambient/rainy-night  a built-in ambient scene (see ambient.ts)
//
// All DM-only: refs, the quick bar and suggestions never reach the TV or a phone.

import { entriesOf, entryScene, findRef, kindInfo, slugify } from "./discovery";
import { boardNotes, findBoardNote, noteRef, type BoardNote } from "./board";
import { AMBIENT, ambientById, type AmbientId } from "./ambient";
import type { Beat, BeatAction, Entry, GameState, Pin, Scene, SceneKind } from "./types";

export type AssetGame = Pick<GameState, "scenes" | "entries"> & Partial<Pick<GameState, "quick" | "monsters" | "notices" | "jobs" | "flyers">>;

/** The built-in screens, and the scene kind each one shows (leads is an overlay, not a scene). */
export const SCREENS = ["board", "leads", "table", "stinger", "black"] as const;
export type Screen = (typeof SCREENS)[number];
const SCREEN_KIND: Record<Exclude<Screen, "leads">, SceneKind> = { board: "notice", table: "table", stinger: "stinger", black: "black" };
export const SCREEN_LABEL: Record<Screen, string> = { board: "Notice board", leads: "Leads board", table: "The Table", stinger: "The stinger", black: "Black screen" };

/** Number keys in bar order. */
export const QUICK_KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0] as const;
export const RECENT_MAX = 6;

const SEG = "[a-z0-9][a-z0-9-]{0,39}";
/** A ref as stored: a screen, kind/slug, or map/slug/pin. */
export const SHOW_REF_RE = new RegExp(`^(?:[a-z]{3,12}|[a-z][a-z-]{1,23}/${SEG}(?:/${SEG})?)$`);

export interface Asset {
  ref: string;
  /** What the DM calls it: "Mags Wick", "Candlefair map", "3 · The Bakery". */
  label: string;
  /** People, Places, ..., Maps, Pins, Props, Screens. */
  group: string;
  /** A second line: "Person · Rumored", "on Candlefair map". */
  sub?: string;
  entry?: Entry;
  scene?: Scene;
  pin?: Pin;
  screen?: Screen;
  /** A note from the notice board (shown up close over the board). */
  note?: BoardNote;
  /** A built-in ambient scene. */
  ambient?: AmbientId;
}

// ---------------------------------------------------------------------------
// Slugs for maps and props

/** "Candlefair map" -> "candlefair", "Artum's notice" -> "artums-notice". */
export function sceneSlugBase(sc: Pick<Scene, "label" | "kind">): string {
  let b = slugify(sc.label).replace(/^the-/, "");
  if (sc.kind === "map") b = b.replace(/-map$/, "").replace(/^map-of-(?:the-)?/, "") || b;
  return b;
}

export function sceneSlug(sc: Pick<Scene, "label" | "kind" | "slug">): string {
  return sc.slug || sceneSlugBase(sc);
}

/** A slug for a scene, unique among scenes. */
export function uniqueSceneSlug(scenes: Pick<Scene, "id" | "label" | "kind" | "slug">[], want: string, exceptId?: string): string {
  const base = slugify(want);
  const taken = new Set(scenes.filter((x) => x.id !== exceptId).map((x) => sceneSlug(x)));
  let slug = base;
  for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;
  return slug;
}

/** The screen a scene stands for: the first scene of each built-in kind. */
function screenOf(g: AssetGame, sc: Scene): Screen | null {
  for (const [screen, kind] of Object.entries(SCREEN_KIND) as [Screen, SceneKind][]) {
    if (sc.kind === kind && g.scenes.find((x) => x.kind === kind)?.id === sc.id) return screen;
  }
  return null;
}

/** Portrait scenes are people's (and monsters', places') pictures: the entry that owns it. */
export function pictureOwner(g: AssetGame, sc: Scene): Entry | undefined {
  return sc.kind === "portrait" ? entriesOf(g).find((e) => e.sceneId === sc.id) : undefined;
}

/** Is this scene one of the Maps & props (rather than someone's picture)? */
export function isProp(g: AssetGame, sc: Scene): boolean {
  return sc.kind !== "map" && !pictureOwner(g, sc) && !screenOf(g, sc);
}

export const entryRef = (e: Pick<Entry, "kind" | "slug">) => `${e.kind}/${e.slug}`;

/** The ref that shows this scene. */
export function refForScene(g: AssetGame, sc: Scene): string {
  const owner = pictureOwner(g, sc);
  if (owner) return entryRef(owner);
  if (sc.kind === "map") return `map/${sceneSlug(sc)}`;
  return screenOf(g, sc) ?? `prop/${sceneSlug(sc)}`;
}

/** What the TV shows right now, as a ref (a map zoomed to a pin is that pin). */
export function liveRef(g: AssetGame & Pick<GameState, "live">): string | null {
  if (g.live.ambient && ambientById(g.live.ambient.id)) return `ambient/${g.live.ambient.id}`;
  const sc = g.scenes.find((x) => x.id === g.live.sceneId);
  if (!sc) return null;
  const close = g.live.note && boardNotes(g).find((n) => n.kind === g.live.note!.kind && n.id === g.live.note!.id);
  if (close) return noteRef(close);
  const base = refForScene(g, sc);
  const pin = g.live.focus && sc.map?.pins.find((p) => p.id === g.live.focus!.pinId);
  return pin && base.startsWith("map/") ? `${base}/${pin.number}` : base;
}

// ---------------------------------------------------------------------------
// Resolving

function mapBySlug(g: AssetGame, slug: string): Scene | undefined {
  return g.scenes.find((x) => x.kind === "map" && sceneSlug(x) === slug);
}

export function resolveRef(g: AssetGame, ref: string | null | undefined): Asset | null {
  if (!ref) return null;
  const r = ref.trim().toLowerCase();
  if ((SCREENS as readonly string[]).includes(r)) {
    const screen = r as Screen;
    const scene = screen === "leads" ? undefined : g.scenes.find((x) => x.kind === SCREEN_KIND[screen]);
    return { ref: r, label: SCREEN_LABEL[screen], group: "Screens", screen, ...(scene ? { scene } : {}) };
  }
  const [head, slug, rest] = r.split("/");
  if (!slug) return null;
  if (head === "map") {
    const scene = mapBySlug(g, slug);
    if (!scene) return null;
    if (rest === undefined) return { ref: r, label: scene.label, group: "Maps", sub: `${scene.map?.pins.length ?? 0} locations`, scene };
    const pin = scene.map?.pins.find((p) => String(p.number) === rest || slugify(p.name) === rest);
    if (!pin) return null;
    return { ref: `map/${slug}/${pin.number}`, label: pinLabel(pin), group: "Pins", sub: `on ${scene.label}${pin.discovered ? "" : " · hidden"}`, scene, pin };
  }
  if (head === "note" || head === "flyer") {
    const note = rest === undefined ? findBoardNote(g, slug) : undefined;
    return note ? noteAsset(note) : null;
  }
  if (head === "ambient") {
    const a = rest === undefined ? ambientById(slug) : undefined;
    return a ? ambientAsset(a) : null;
  }
  if (head === "prop") {
    const scene = g.scenes.find((x) => x.kind !== "map" && sceneSlug(x) === slug);
    return scene ? { ref: r, label: scene.label, group: "Props", sub: propSub(scene), scene } : null;
  }
  const hit = rest === undefined ? findRef(g, r) : null;
  if (!hit) return null;
  return entryAsset(g, hit.entry);
}

function ambientAsset(a: (typeof AMBIENT)[number]): Asset {
  return { ref: `ambient/${a.id}`, label: a.label, group: "Ambient", sub: "Ambient scene", ambient: a.id };
}

function pinLabel(p: Pin): string {
  return p.name ? `${p.number} · ${p.name}` : `Location ${p.number}`;
}

function propSub(sc: Scene): string {
  const kind = sc.kind === "handout" ? "Handout" : sc.kind === "portrait" ? "Picture" : sc.kind === "notice" ? "Board" : sc.kind === "video" ? "Video" : "Image";
  return sc.reveal ? `${kind} · reveal` : kind;
}

function noteAsset(n: BoardNote): Asset {
  const what = n.kind === "job" ? "Job flyer" : n.kind === "flyer" ? "Player flyer" : "Note";
  return { ref: noteRef(n), label: n.title || what, group: "Notes", sub: `${what} · ${n.up ? "on the board" : "in the drawer"}`, note: n };
}

function entryAsset(g: AssetGame, e: Entry): Asset {
  const k = kindInfo(e.kind);
  const stage = e.stage === "hidden" ? "Hidden" : e.stage === "rumored" ? "Rumored" : e.stage === "known" ? "Known" : k.found;
  const scene = entryScene(g, e);
  return { ref: entryRef(e), label: e.name, group: k.plural, sub: `${k.label} · ${stage}`, entry: e, ...(scene ? { scene } : {}) };
}

/** Everything the DM can show, grouped: Discovery first, then maps, pins, props and screens. */
export function listAssets(g: AssetGame): Asset[] {
  const out: Asset[] = entriesOf(g).map((e) => entryAsset(g, e));
  const placePins = new Set(entriesOf(g).flatMap((e) => (e.pin ? [`${e.pin.sceneId}|${e.pin.pinId}`] : [])));
  const maps = g.scenes.filter((x) => x.kind === "map");
  for (const sc of maps) out.push(resolveRef(g, refForScene(g, sc))!);
  for (const sc of maps) {
    for (const p of sc.map?.pins ?? []) {
      // A pin that is a place is shown as the place.
      if (placePins.has(`${sc.id}|${p.id}`)) continue;
      out.push({ ref: `map/${sceneSlug(sc)}/${p.number}`, label: pinLabel(p), group: "Pins", sub: `on ${sc.label}${p.discovered ? "" : " · hidden"}`, scene: sc, pin: p });
    }
  }
  for (const sc of g.scenes) if (isProp(g, sc)) out.push({ ref: refForScene(g, sc), label: sc.label, group: "Props", sub: propSub(sc), scene: sc });
  for (const n of boardNotes(g)) out.push(noteAsset(n));
  for (const screen of SCREENS) out.push(resolveRef(g, screen)!);
  for (const a of AMBIENT) out.push(ambientAsset(a));
  return out;
}

/** The finder: everything matching what the DM typed, best first. */
export function findAssets(g: AssetGame, query: string, limit = 12): Asset[] {
  const all = listAssets(g);
  const q = norm(query);
  if (!q) return all.slice(0, limit);
  const scored = all
    .map((a) => {
      const label = norm(a.label);
      const nick = a.entry?.nickname ? norm(a.entry.nickname) : "";
      const score = label.startsWith(q) ? 0 : label.split(" ").some((w) => w.startsWith(q)) ? 1 : label.includes(q) || nick.includes(q) ? 2 : a.ref.includes(q.replace(/ /g, "-")) ? 3 : 9;
      return { a, score };
    })
    .filter((x) => x.score < 9);
  return scored.sort((x, y) => x.score - y.score).slice(0, limit).map((x) => x.a);
}

// ---------------------------------------------------------------------------
// The quick bar

/** The 10 slots, by key digit. Games not yet upgraded read their old hotkeys. */
export function quickOf(g: AssetGame): (string | null)[] {
  if (g.quick) return Array.from({ length: 10 }, (_, k) => g.quick![k] ?? null);
  const out: (string | null)[] = Array(10).fill(null);
  for (const sc of g.scenes) if (typeof sc.hotkey === "number" && out[sc.hotkey] === null) out[sc.hotkey] = refForScene(g, sc);
  return out;
}

/** The key a ref is pinned to, if any. */
export function quickKeyOf(g: AssetGame, ref: string): number | null {
  const k = quickOf(g).indexOf(ref);
  return k < 0 ? null : k;
}

/** The first free key in bar order (1..9, then 0). */
export function freeQuickKey(g: AssetGame): number | null {
  const q = quickOf(g);
  return QUICK_KEYS.find((k) => q[k] === null) ?? null;
}

// ---------------------------------------------------------------------------
// Renames: keep quick slots, recents and run sheets pointing at the same thing

/** Swap a ref prefix ("person/mags" -> "person/margaret") in one ref, also its sub-refs ("…/fact", "…/3"). */
export function renameIn(ref: string, from: string, to: string): string {
  if (ref === from) return to;
  if (ref.startsWith(from + "/")) return to + ref.slice(from.length);
  return ref;
}

export function renameRefs(g: Pick<GameState, "quick" | "recent" | "episodes">, from: string, to: string): void {
  if (!from || from === to) return;
  if (g.quick) g.quick = g.quick.map((r) => (r ? renameIn(r, from, to) : r));
  if (g.recent) g.recent = g.recent.map((r) => renameIn(r, from, to));
  for (const ep of g.episodes ?? []) {
    for (const b of ep.beats) {
      for (const a of b.actions) if (a.type === "show" || a.type === "reveal" || a.type === "fact") a.ref = renameIn(a.ref, from, to);
      if (b.dismissed) b.dismissed = b.dismissed.map((r) => renameIn(r, from, to));
    }
  }
}

// ---------------------------------------------------------------------------
// Suggestions: what a beat's own words mention

/** Lowercase, straight apostrophes, words and spaces only. */
function norm(t: string): string {
  return t
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/[^\p{L}\p{N}' ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Words that name a job or a rank, not a person ("Captain Orsa Dell" is "Orsa" or "Dell"). */
const NOT_A_NAME = new Set(["captain", "lady", "lord", "master", "mister", "mistress", "sister", "brother", "mother", "father", "sir", "dame", "old", "young", "little", "keeper", "with", "from", "that", "this", "your"]);

interface Needle {
  text: string;
  ref: string;
  /** Lower wins a tie at the same spot: entries, pins, maps, props, screens. */
  rank: number;
}

function needles(g: AssetGame): Needle[] {
  const out: Needle[] = [];
  const add = (text: string | undefined, ref: string, rank: number) => {
    const t = norm(text ?? "").replace(/^the /, "");
    if (t.length >= 3 && !out.some((n) => n.text === t && n.ref === ref)) out.push({ text: t, ref, rank });
  };
  // Hidden entries are never suggested: one key or "Accept all" would put a secret on the TV.
  for (const e of entriesOf(g)) {
    if (e.stage === "hidden") continue;
    const ref = entryRef(e);
    add(e.name, ref, 0);
    if (e.nickname.trim().length >= 4) add(e.nickname, ref, 0);
    if (e.kind === "person") {
      const words = norm(e.name).split(" ");
      if (words.length > 1) for (const w of words) if (w.length >= 4 && !NOT_A_NAME.has(w)) add(w, ref, 0);
    }
  }
  const placePins = new Set(entriesOf(g).flatMap((e) => (e.pin ? [`${e.pin.sceneId}|${e.pin.pinId}`] : [])));
  for (const sc of g.scenes) {
    if (sc.kind === "map") {
      const ref = `map/${sceneSlug(sc)}`;
      add(sc.label, ref, 2);
      for (const p of sc.map?.pins ?? []) if (p.name && !placePins.has(`${sc.id}|${p.id}`)) add(p.name, `${ref}/${p.number}`, 1);
    } else if (isProp(g, sc)) add(sc.label, refForScene(g, sc), 3);
  }
  add("notice board", "board", 4);
  add("leads board", "leads", 4);
  add("black screen", "black", 4);
  add("stinger", "stinger", 4);
  return out;
}

const escape = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The assets these words mention, in the order they come up. */
export function mentions(g: AssetGame, text: string): string[] {
  // "@person/mags" in the text: written on purpose, so it comes first (hidden entries still never).
  const explicit: string[] = [];
  for (const m of text.matchAll(/(?<![\w@./])@([a-z][a-z-]{1,23}\/[a-z0-9][a-z0-9-]{0,39})/g)) {
    const a = resolveRef(g, m[1]);
    if (a && a.entry?.stage !== "hidden" && !explicit.includes(a.ref)) explicit.push(a.ref);
  }
  const hay = ` ${norm(text.replace(/(?<![\w@./])@[a-z][a-z-]{1,23}\/[a-z0-9-]+/g, " "))} `;
  type Hit = { at: number; len: number; ref: string; rank: number };
  const hits: Hit[] = [];
  for (const n of needles(g)) {
    const re = new RegExp(`(?<=[^\\p{L}\\p{N}'])${escape(n.text)}(?:'s)?(?=[^\\p{L}\\p{N}])`, "gu");
    for (const m of hay.matchAll(re)) hits.push({ at: m.index!, len: n.text.length, ref: n.ref, rank: n.rank });
  }
  hits.sort((a, b) => a.at - b.at || b.len - a.len || a.rank - b.rank);
  const refs: string[] = [];
  let end = -1;
  for (const h of hits) {
    if (h.at < end) continue;
    end = h.at + h.len;
    if (!refs.includes(h.ref)) refs.push(h.ref);
  }
  return [...explicit, ...refs.filter((r) => !explicit.includes(r))];
}

/** Everything a beat says, for mentions. */
export function beatText(b: Pick<Beat, "title" | "readAloud" | "notes" | "checks" | "branches">): string {
  return [b.title, ...(b.readAloud ?? []), ...b.notes, ...b.checks.map((c) => c.what), ...b.branches.flatMap((x) => [x.when, x.then])].join(" \n ");
}

/** The ref a beat action shows, if it shows one. */
export function actionRef(g: AssetGame, a: BeatAction): string | null {
  if (a.type === "show") return a.ref;
  if (a.type === "scene") {
    const sc = g.scenes.find((x) => x.id === a.sceneId);
    return sc ? refForScene(g, sc) : null;
  }
  if (a.type === "black" || a.type === "stinger") return a.type;
  return null;
}

/** Does landing on this beat already change what the TV shows? */
const showsSomething = (a: BeatAction) => a.type === "show" || a.type === "scene" || a.type === "black" || a.type === "stinger";

export interface BeatSuggestions {
  /** The first thing the beat mentions, offered as its show (only when it has none). */
  suggested: string | null;
  /** Everything else it mentions, as one-key buttons while it runs. */
  also: string[];
}

export function beatSuggestions(g: AssetGame, b: Pick<Beat, "title" | "readAloud" | "notes" | "checks" | "branches" | "actions" | "dismissed">): BeatSuggestions {
  const accepted = new Set(b.actions.map((a) => actionRef(g, a)).filter((r): r is string => !!r));
  const dismissed = new Set(b.dismissed ?? []);
  const found = mentions(g, beatText(b)).filter((r) => !accepted.has(r));
  const offer = b.actions.some(showsSomething) ? null : (found.find((r) => !dismissed.has(r)) ?? null);
  return { suggested: offer, also: found.filter((r) => r !== offer) };
}

/** What a beat puts one key away while it runs: its own shows, then what it mentions. */
export function beatAssets(g: AssetGame, b: Beat): string[] {
  const own = b.actions.map((a) => actionRef(g, a)).filter((r): r is string => !!r);
  const { suggested, also } = beatSuggestions(g, b);
  return [...new Set([...own, ...(suggested ? [suggested] : []), ...also])].filter((r) => resolveRef(g, r)).slice(0, 9);
}
