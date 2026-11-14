// The starter storyboard: threads and story beats for the year, plus stub
// Discovery entries for the people and places the beats need. Server-only,
// like the seed run sheet and entries, so none of this ships in the browser
// code the TV and phones download. Added once per game (upgrade tag
// "story-seed"), so deletes stick. Backstory lanes are kept up to date on
// every read.

import type { Entry, EntryKind, GameState, StoryBeat, StoryBeatType, StoryLink, StoryThread } from "@/shared/types";
import { entriesOf } from "@/shared/discovery";
import { emptyStory, ensureBackstory, presetRange } from "@/shared/story";

const TAG = "story-seed";

/** People, places and factions the beats need. Made hidden, only if there isn't one already. */
const STUBS: { id: string; kind: EntryKind; slug: string; name: string; title?: string; dmNote: string }[] = [
  { id: "e-mardon", kind: "person", slug: "mardon", name: "Mardon Rueh", title: "Leader of the bandits in the twin towers", dmNote: "Stub from the storyboard: fill in. May hire the party against the Eomane family (Baldur's Gate thread)." },
  { id: "e-rolf", kind: "person", slug: "rolf", name: "Rolf Twyrtho", title: "Trader", dmNote: "Stub from the storyboard: fill in. Posted the ransom flyer for his brother Adon." },
  { id: "e-adon", kind: "person", slug: "adon", name: "Adon Twyrtho", title: "Rolf's brother", dmNote: "Stub from the storyboard: fill in. Held for ransom by the bandits." },
  { id: "e-eomane", kind: "faction", slug: "eomane-family", name: "The Eomane family", dmNote: "Stub from the storyboard: fill in. Mardon's enemies in Baldur's Gate; leads to Blood Night." },
  { id: "e-warlocks-crypt", kind: "place", slug: "warlocks-crypt", name: "Warlock's Crypt", dmNote: "Stub from the storyboard: fill in. Named in the fall; the finale at Winterfest Y2." },
];

const THREADS: StoryThread[] = [
  { id: "th-merchant", name: "The Merchant", color: "#b0473a", kind: "main", description: "The merchant who sells wishes written on ledger pages, and what they cost.", goal: "Find her, her ledger and the crypt by Winterfest Y2." },
  { id: "th-candle", name: "Mags's Candle", color: "#c99a3a", kind: "side", description: "The Flickering Candle's flame is too perfect. Mags made a deal.", goal: "Mags's page is found and the choice made." },
  { id: "th-baldurs-gate", name: "Baldur's Gate", color: "#4f7a9a", kind: "side", description: "The road south and the city: Rolf's brother, the bandits, Mardon and the Eomanes.", goal: "Blood Night." },
  { id: "th-candlefair", name: "Candlefair", color: "#5d8a5a", kind: "place", description: "The town itself: what the party builds and mends, and how the town changes for it.", goal: "" },
];

type SeedBeat = {
  id: string;
  thread: string;
  window: string | "anytime" | null;
  type: StoryBeatType;
  title: string;
  summary?: string;
  dmNotes?: string;
  /** Entry ids, item ids ("item:..."), job ids ("job:..."). */
  links?: string[];
  after?: string[];
  repeat?: boolean;
};

const BEATS: SeedBeat[] = [
  // The Merchant
  { id: "sb-symbol", thread: "th-merchant", window: "winterfest-y1", type: "clue", title: "The symbol on the baker's recipes", summary: "The broken-ring mark is on the baker's recipes.", dmNotes: "Episode 1 (Just Desserts).", links: ["e-broken-ring", "e-baker", "e-merchant"] },
  { id: "sb-stinger", thread: "th-merchant", window: "winterfest-y1", type: "reveal", title: "The stinger after Episode 1", summary: "The animated stinger: she was here.", dmNotes: "Episode 1 (Just Desserts), after the last beat.", links: ["e-merchant"], after: ["sb-symbol"] },
  { id: "sb-frozen", thread: "th-merchant", window: "end-winterfest-y1", type: "consequence", title: "Someone is found in a frozen sleep", summary: "Someone the party met is found in a frozen sleep.", dmNotes: "Who: TBD.", after: ["sb-stinger"] },
  {
    id: "sb-lucky",
    thread: "th-merchant",
    window: "spring",
    type: "choice",
    title: "Someone suddenly lucky",
    summary: "Someone in town is suddenly, weirdly lucky. A purchase turns out to be a ledger page. Burn it?",
    dmNotes: "Burning it frees them and undoes the wish. It needs their consent, releases cold, and alerts her.",
    links: ["e-broken-ring", "e-merchant"],
    after: ["sb-symbol"],
  },
  { id: "sb-noticed", thread: "th-merchant", window: "summer", type: "consequence", title: "She notices them", summary: "Something they own changes overnight, or a letter arrives.", links: ["e-merchant"], after: ["sb-lucky"] },
  { id: "sb-rule", thread: "th-merchant", window: "summer", type: "reveal", title: "The rule: a page only burns in a fire lit for someone else", summary: "A ledger page only burns in a fire lit for someone else.", links: ["e-broken-ring"], after: ["sb-lucky"] },
  { id: "sb-symbol-bg", thread: "th-merchant", window: "summer", type: "clue", title: "The symbol appears in Baldur's Gate", summary: "The broken ring turns up in Baldur's Gate.", links: ["e-broken-ring", "e-baldurs-gate"], after: ["sb-symbol"] },
  { id: "sb-cold", thread: "th-merchant", window: "fall", type: "consequence", title: "The cold comes early", summary: "Frost months early. The town feels it." },
  { id: "sb-buyers", thread: "th-merchant", window: "fall", type: "reveal", title: "What happens to buyers at Winterfest", summary: "What happens to everyone who bought a wish when Winterfest comes.", links: ["e-merchant"], after: ["sb-rule"] },
  { id: "sb-crypt", thread: "th-merchant", window: "fall", type: "clue", title: "Warlock's Crypt is named", summary: "Someone names Warlock's Crypt.", links: ["e-warlocks-crypt"] },
  { id: "sb-finale", thread: "th-merchant", window: "winterfest-y2", type: "reveal", title: "She returns", summary: "She returns. Who she is. The crypt and the finale.", links: ["e-merchant", "e-warlocks-crypt"], after: ["sb-crypt", "sb-buyers"] },

  // Mags's Candle
  { id: "sb-wax", thread: "th-candle", window: "anytime", type: "background", title: "The candle never needs new wax", repeat: true, links: ["e-mags", "e-candle"] },
  { id: "sb-flicker", thread: "th-candle", window: "anytime", type: "background", title: "The flame never flickers", repeat: true, links: ["e-mags", "e-candle"] },
  { id: "sb-too-perfect", thread: "th-candle", window: "fall", type: "clue", title: "The Candle's “too perfect” clues stop being subtle", links: ["e-mags", "e-candle"] },
  { id: "sb-mags-page", thread: "th-candle", window: "fall-or-winterfest-y2", type: "choice", title: "Mags's page is found in the candle's brass holder", summary: "A ledger page in the brass holder: Mags's wish.", dmNotes: "Write Mags's page as a fact on Mags.", links: ["e-mags", "e-candle", "e-broken-ring"], after: ["sb-too-perfect"] },
  {
    id: "sb-wears",
    thread: "th-candle",
    window: "anytime",
    type: "consequence",
    title: "The tavern wears overnight",
    summary: "The tavern wears overnight; the townsfolk help; the party relights a candle that finally flickers.",
    links: ["e-mags", "e-candle"],
    after: ["sb-mags-page"],
  },

  // Baldur's Gate
  { id: "sb-rolf", thread: "th-baldurs-gate", window: "after-winterfest-y1", type: "choice", title: "Rolf's flyer: rescue his brother", summary: "Rescue Rolf's brother Adon from the bandits (Robber Baron).", links: ["job:j-ransom", "e-rolf", "e-adon", "e-mardon"] },
  { id: "sb-mardon", thread: "th-baldurs-gate", window: "anytime", type: "choice", title: "Mardon asks for help against the Eomanes", summary: "Mardon asks them to help against the Eomane family.", links: ["e-mardon", "e-eomane"], after: ["sb-rolf"] },
  { id: "sb-blood-night", thread: "th-baldurs-gate", window: "anytime", type: "reveal", title: "Blood Night", summary: "Blood Night (book chapter 6).", links: ["e-eomane", "e-baldurs-gate"], after: ["sb-mardon"] },

  // Candlefair: one per shop project
  { id: "sb-ferry", thread: "th-candlefair", window: "anytime", type: "consequence", title: "The ferry runs after dark again", links: ["item:d-ferry", "e-docks"] },
  { id: "sb-forge", thread: "th-candlefair", window: "anytime", type: "consequence", title: "A new forge in the smithy", links: ["item:s-forge"] },
  { id: "sb-temple-roof", thread: "th-candlefair", window: "anytime", type: "consequence", title: "The temple roof is mended", links: ["item:i40"] },
  { id: "sb-lighthouse", thread: "th-candlefair", window: "anytime", type: "consequence", title: "The Lantern's lighthouse is lit", links: ["item:t-lighthouse", "e-lantern"] },
];

function stub(x: (typeof STUBS)[number]): Entry {
  return { id: x.id, kind: x.kind, slug: x.slug, name: x.name, title: x.title ?? "", summary: "", nickname: "", hint: "", stage: "hidden", areas: [], links: [], facts: [], dmNote: x.dmNote, secrets: "" };
}

export function withSeedStory<T extends GameState | null>(state: T): T {
  if (!state) return state;
  const st = (state.story ??= emptyStory());
  if (!state.upgrades?.includes(TAG)) {
    const entries = (state.entries ??= []);
    for (const x of STUBS) {
      if (entries.some((e) => e.id === x.id || (e.kind === x.kind && e.slug === x.slug))) continue;
      entries.push(stub(x));
    }
    /** A seed id, or the DM's own entry that a stub would have duplicated. */
    const entryId = (id: string): string | undefined => {
      if (entries.some((e) => e.id === id)) return id;
      const x = STUBS.find((y) => y.id === id);
      return x ? entries.find((e) => e.kind === x.kind && e.slug === x.slug)?.id : undefined;
    };
    for (const t of THREADS) if (!st.threads.some((x) => x.id === t.id)) st.threads.push({ ...t });
    const have = new Set(st.beats.map((b) => b.id));
    for (const b of BEATS) {
      if (have.has(b.id) || !st.threads.some((t) => t.id === b.thread)) continue;
      const links: StoryLink[] = [];
      for (const l of b.links ?? []) {
        if (l.startsWith("item:")) {
          const id = l.slice(5);
          if (state.items.some((i) => i.id === id)) links.push({ kind: "item", id });
        } else if (l.startsWith("job:")) {
          const id = l.slice(4);
          if ((state.jobs ?? []).some((j) => j.id === id)) links.push({ kind: "job", id });
        } else {
          const id = entryId(l);
          if (id) links.push({ kind: "entry", id });
        }
      }
      const beat: StoryBeat = {
        id: b.id,
        threadId: b.thread,
        title: b.title,
        summary: b.summary ?? "",
        dmNotes: b.dmNotes ?? "",
        type: b.type,
        links,
        after: (b.after ?? []).filter((a) => BEATS.some((x) => x.id === a)),
        status: "planned",
        plays: [],
        createdAt: state.createdAt ?? 0,
      };
      if (b.window === "anytime") beat.window = "anytime";
      else if (b.window) beat.window = presetRange(b.window);
      if (b.repeat) beat.repeat = true;
      st.beats.push(beat);
    }
    state.upgrades = [...(state.upgrades ?? []), TAG];
  }
  ensureBackstory(st, state.players);
  return state;
}
