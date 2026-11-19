// The notice board: every note on it (plain notices, job flyers, player flyers)
// hangs where the DM put it. Positions are on the cork, which is BOARD_W x BOARD_H.
import type { Flyer, GameState, Job, NoteFont, NoteLook, NotePlace, Notice, Paper, PinColor, Scene } from "./types";

/** The cork inside the frame, in TV pixels. */
export const BOARD_W = 1836;
export const BOARD_H = 996;
/** How many notes can hang at once (all kinds together), so the TV stays readable. */
export const BOARD_MAX = 40;
/** How many notes the drawer can hold, besides jobs and player flyers. */
export const NOTICES_MAX = 120;
export const NOTE_W_MIN = 160;
export const NOTE_W_MAX = 640;
export const TITLE_SIZE_MIN = 14;
export const TITLE_SIZE_MAX = 90;
export const LIST_MAX = 8;

export type NoteKind = "notice" | "job" | "flyer";

/** A handout that is really a close-up of a job flyer on the board (Artum's Winterfest handbill).
 *  Players already have the job on their Jobs tab, so it never stays in Discover → Handouts. */
export function isFlyerHandout(sc: Pick<Scene, "kind" | "art">): boolean {
  return sc.kind === "handout" && sc.art?.builtin === "artum-notice";
}

export const PAPERS: { id: Paper; label: string; job?: boolean }[] = [
  { id: "scrawl", label: "Scrawled note", job: true },
  { id: "bill", label: "Merchant’s bill", job: true },
  { id: "official", label: "Official notice", job: true },
  { id: "sealed", label: "Sealed envelope", job: true },
  { id: "cream", label: "Cream paper" },
  { id: "parchment", label: "Parchment" },
  { id: "aged", label: "Old paper" },
  { id: "white", label: "Cheap paper" },
  { id: "ash", label: "Grey paper" },
  { id: "slate", label: "Blue-grey paper" },
  { id: "ice", label: "Pale blue paper" },
  { id: "dark", label: "Dark card" },
  { id: "red", label: "Red card" },
  { id: "handbill", label: "Printed handbill" },
];
export const PAPER_IDS = PAPERS.map((p) => p.id) as [Paper, ...Paper[]];
export const PIN_IDS: [PinColor, ...PinColor[]] = ["red", "blue", "green", "black", "gold", "cream", "none"];
export const FONT_IDS: [NoteFont, ...NoteFont[]] = ["caps", "poster", "hand", "plain"];
export const FONT_LABELS: Record<NoteFont, string> = { caps: "Printed capitals", poster: "Poster", hand: "Handwriting", plain: "Book type" };
export const PIN_LABELS: Record<PinColor, string> = { red: "Red", blue: "Blue", green: "Green", black: "Black", gold: "Brass", cream: "Bone", none: "No pin" };

/** The eight spots pinned cards used before free placement: left, top, tilt. Only the upgrade uses them. */
export const LEGACY_SLOTS: [number, number, number][] = [
  [1300, 290, -4],
  [110, 290, 3],
  [990, 600, -3],
  [1580, 250, 4],
  [1460, 640, 3],
  [330, 760, -2],
  [700, 520, 2],
  [1620, 700, -4],
];

/** The four papers the bounty board always had. They draw their own layout. */
export function isJobPaper(p: Paper): p is "scrawl" | "bill" | "official" | "sealed" {
  return p === "scrawl" || p === "bill" || p === "official" || p === "sealed";
}

/** The width a paper starts at. */
export function defaultWidth(p: Paper): number {
  if (p === "handbill") return 520;
  if (p === "sealed") return 300;
  if (isJobPaper(p)) return 330;
  return 290;
}

export function noticesOf(g: Pick<GameState, "notices">): Notice[] {
  return g.notices ?? [];
}

/** "Winterfest Needs Hands!" -> "winterfest-needs-hands". */
export function slugify(s: string): string {
  return (
    s
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[’']/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "note"
  );
}

/** One thing on (or for) the board, whatever kind it is. */
export interface BoardNote {
  kind: NoteKind;
  id: string;
  /** @flyer/<slug> in run sheets and the storyboard. */
  slug: string;
  title: string;
  /** Hanging on the board right now. */
  up: boolean;
  place?: NotePlace;
}

/** Everything the DM can put on the board, with a slug unique across all three kinds. */
export type BoardGame = Partial<Pick<GameState, "notices" | "jobs" | "flyers">>;

export function boardNotes(g: BoardGame): BoardNote[] {
  const out: BoardNote[] = [];
  const used = new Set<string>();
  const take = (want: string) => {
    let s = want;
    for (let i = 2; used.has(s); i++) s = `${want}-${i}`;
    used.add(s);
    return s;
  };
  for (const n of noticesOf(g)) out.push({ kind: "notice", id: n.id, slug: take(n.slug || slugify(n.title)), title: n.title, up: n.up, place: n.place });
  for (const j of g.jobs ?? []) out.push({ kind: "job", id: j.id, slug: take(slugify(j.style === "sealed" ? j.title || "sealed-envelope" : j.title)), title: j.title, up: j.pinned && j.status !== "expired", place: j.place });
  for (const f of g.flyers ?? []) out.push({ kind: "flyer", id: f.id, slug: take(slugify(f.title)), title: f.title, up: f.up, place: f.place });
  return out;
}

/**
 * Find a note by its short name, with or without "@flyer/" or "note/" in front.
 * A job also answers to its poster's first name ("@flyer/rolf"), when only one job has it.
 */
export function findBoardNote(g: BoardGame, ref: string): BoardNote | undefined {
  const slug = ref
    .trim()
    .toLowerCase()
    .replace(/^@?(?:flyer|note)\//, "");
  const all = boardNotes(g);
  const hit = all.find((n) => n.slug === slug);
  if (hit) return hit;
  const posters = all.filter((n) => n.kind === "job" && posterSlug((g.jobs ?? []).find((j) => j.id === n.id)?.postedBy ?? "") === slug);
  return posters.length === 1 ? posters[0] : undefined;
}

/** "Rolf Twyrtho, trader" -> "rolf". */
export function posterSlug(postedBy: string): string {
  const first = postedBy.trim().split(/[\s,]+/)[0] ?? "";
  return first ? slugify(first) : "";
}

/** The ref that shows a note up close on the TV. */
export const noteRef = (n: Pick<BoardNote, "slug">) => `note/${n.slug}`;

/** Notes hanging right now, of every kind. */
export function upCount(g: Pick<GameState, "notices" | "jobs" | "flyers">): number {
  return noticesOf(g).filter((n) => n.up).length + (g.jobs ?? []).filter((j) => j.pinned && j.status !== "expired").length + g.flyers.filter((f) => f.up).length;
}

/** The top of the stack, so a note put up or brought forward lands over the rest. */
export function topZ(g: Pick<GameState, "notices" | "jobs" | "flyers">): number {
  let z = 0;
  for (const n of boardNotes(g)) if (n.place && n.place.z > z) z = n.place.z;
  return z;
}

/** A rough height for a note, to find room for a new one. */
export function guessHeight(n: { style?: Paper; title?: string; body?: string; look?: NoteLook }, w: number): number {
  if (n.style === "sealed") return 200;
  const chars = (n.body?.length ?? 0) + (n.look?.footer?.length ?? 0);
  const perLine = Math.max(14, w / 9);
  const lines = Math.ceil(chars / perLine) + (n.look?.list?.length ?? 0) * 2;
  return Math.min(700, 130 + lines * 22 + (n.look?.image ? w * 0.6 : 0));
}

/** The least crowded spot on the board for a note this wide. */
export function freeSpot(g: Pick<GameState, "notices" | "jobs" | "flyers">, w: number, h: number): { x: number; y: number } {
  const boxes = boardNotes(g)
    .filter((n) => n.up && n.place)
    .map((n) => ({ x: n.place!.x, y: n.place!.y, w: n.place!.w, h: 300 }));
  let best = { x: 40, y: 40, cost: Infinity };
  for (let y = 40; y <= BOARD_H - Math.min(h, BOARD_H - 80) - 40; y += 40) {
    for (let x = 40; x <= BOARD_W - w - 40; x += 40) {
      let cost = 0;
      for (const b of boxes) {
        const ox = Math.max(0, Math.min(x + w, b.x + b.w) - Math.max(x, b.x));
        const oy = Math.max(0, Math.min(y + h, b.y + b.h) - Math.max(y, b.y));
        cost += ox * oy;
      }
      if (cost < best.cost) best = { x, y, cost };
      if (cost === 0) return { x, y };
    }
  }
  return { x: best.x, y: best.y };
}

/** Keep a place on the board, with sane numbers. */
export function cleanPlace(p: NotePlace): NotePlace {
  const w = Math.round(Math.min(NOTE_W_MAX, Math.max(NOTE_W_MIN, p.w)));
  return {
    x: Math.round(Math.min(BOARD_W - 60, Math.max(-w + 60, p.x))),
    y: Math.round(Math.min(BOARD_H - 60, Math.max(-20, p.y))),
    rot: Math.round(Math.max(-30, Math.min(30, p.rot)) * 10) / 10,
    w,
    z: Math.round(Math.max(0, Math.min(1_000_000, p.z))),
  };
}

/** Trim a look, dropping what's empty. */
export function cleanLook(l: NoteLook): NoteLook {
  const out: NoteLook = {};
  if (l.pin) out.pin = l.pin;
  if (l.font) out.font = l.font;
  if (l.align) out.align = l.align;
  if (l.band) out.band = true;
  if (l.ink) out.ink = l.ink;
  const str = (k: "kicker" | "sub" | "footer" | "signNote" | "listLabel", max: number) => {
    const v = (l[k] ?? "").trim().slice(0, max);
    if (v) out[k] = v;
  };
  str("kicker", 80);
  str("sub", 80);
  str("footer", 400);
  str("signNote", 80);
  str("listLabel", 30);
  if (l.titleSize) out.titleSize = Math.round(Math.min(TITLE_SIZE_MAX, Math.max(TITLE_SIZE_MIN, l.titleSize)));
  const list = (l.list ?? []).map((x) => ({ head: x.head.trim().slice(0, 40), text: x.text.trim().slice(0, 160) })).filter((x) => x.head || x.text).slice(0, LIST_MAX);
  if (list.length) out.list = list;
  if (l.image) out.image = l.image;
  return out;
}

/** A place for something going up: where it was last, else the emptiest spot, on top of the stack. */
export function placeFor(g: Pick<GameState, "notices" | "jobs" | "flyers">, n: { style?: Paper; title?: string; body?: string; look?: NoteLook; place?: NotePlace }): NotePlace {
  if (n.place) return n.place;
  const w = defaultWidth(n.style ?? "white");
  const at = freeSpot(g, w, guessHeight(n, w));
  return { ...at, rot: tiltFor(at.x + at.y), w, z: topZ(g) + 1 };
}

/** A small, steady tilt, so new notes don't all hang dead straight. */
function tiltFor(seed: number): number {
  const t = [-3, 2, -2, 3, -1, 4, -4, 1];
  return t[Math.abs(Math.round(seed / 40)) % t.length];
}

/** What a job or flyer is, in the board's terms (for the editor). */
export type BoardThing = { kind: "notice"; n: Notice } | { kind: "job"; j: Job } | { kind: "flyer"; f: Flyer };
