// The starter Discovery entries. Server-only, like the seed run sheet, so hidden
// entries, locked facts and DM notes never ship in the browser code the TV and
// phones download.
import type { Entry, GameState, Stage } from "@/shared/types";
import { entriesOf, entryFromScene, factSlug, isFound } from "@/shared/discovery";

type SeedEntry = Pick<Entry, "id" | "kind" | "slug" | "name"> & Partial<Omit<Entry, "facts">> & { stage: Stage; facts?: string[] };

/** Drafted from "Just Desserts" and the Discovery spec. Every fact starts locked. */
export const SEED_ENTRIES: SeedEntry[] = [
  // People
  {
    id: "e-orsa",
    kind: "person",
    slug: "orsa",
    name: "Captain Orsa Dell",
    title: "Master of the Gull’s Promise",
    summary: "Got you here. Didn’t let you fall in.",
    stage: "found",
    areas: ["The Docks"],
    facts: ["Once carried a peddler who paid in coin the captain had never seen before."],
    dmNote: "Throwaway on the docks, but the same captain returns later.",
  },
  {
    id: "e-mags",
    kind: "person",
    slug: "mags",
    name: "Mags Wick",
    title: "Keeper of the Flickering Candle",
    summary: "Runs the Flickering Candle. Sit anywhere. Not that stool.",
    sceneId: "s-mags",
    silhouette: "/art/silhouettes/mags-wick.png",
    stage: "found",
    areas: ["Candlefair"],
    facts: [
      "Poured the party their first drinks in Candlefair, on a tab none of them could pay.",
      "Asks every newcomer what they’d do with a fortune, and remembers the answer.",
      "Will let a tab run at her own counter, up to a point.",
    ],
    dmNote: "Her lines: “pet”, “duck”. She sells Artum’s job: “Twenty-five gold? Duck, that’s three months of tips.”",
  },
  {
    id: "e-artum",
    kind: "person",
    slug: "artum",
    name: "Artum",
    title: "Planner of Winterfest",
    summary: "Balding, spectacled and permanently worried. Short of helpers, never short of complaints.",
    hint: "Whoever nailed up the Help Wanted poster.",
    sceneId: "s-artum",
    silhouette: "/art/silhouettes/artum.png",
    stage: "rumored",
    areas: ["Candlefair"],
    facts: [
      "His hired helpers quit the morning of the feast, after someone fell off a ladder.",
      "Paid the party’s tab at the Candle, then told them they owed him.",
      "Docks wages out loud, item by item, for anything broken.",
      "Ordered brand-new recipes for the Winterfest feast, never served before.",
    ],
    dmNote: "Pays 25 gp each for the day, minus breakage. Backhanded thanks to the “volunteers” in his toast.",
  },
  { id: "e-fennick", kind: "person", slug: "fennick", name: "Fennick", hint: "A fisherman losing an argument with a rope.", stage: "rumored", areas: ["The Docks"] },
  { id: "e-baker", kind: "person", slug: "the-baker", name: "The baker", hint: "Something sweet on the cold air.", stage: "rumored", areas: ["Candlefair"] },
  {
    id: "e-chef",
    kind: "person",
    slug: "the-chef",
    name: "The Chef",
    title: "Head cook of the Winterfest feast",
    summary: "A ginger beard, a tall hat and a lot of pride in his desserts.",
    sceneId: "s-chef",
    silhouette: "/art/silhouettes/chef.png",
    stage: "hidden",
    areas: ["Candlefair"],
    facts: ["Bought his new recipes from a traveling merchant.", "Every recipe page bears the same symbol.", "The pages won’t burn. They come out of the fire cold."],
    dmNote: "Mortified after the pudding fight. Pushes a page into the party’s hands: “I don’t want it in my kitchen.”",
  },
  {
    id: "e-bolla",
    kind: "person",
    slug: "bolla",
    name: "Bolla",
    title: "Minds the horses at the banquet hall",
    summary: "Loud, cheerful and usually in the middle of the chaos.",
    stage: "hidden",
    areas: ["Candlefair"],
    facts: ["Knows every horse’s quirks: “He likes his left ear scratched!”"],
    dmNote: "No portrait yet: find Bolla from the Discovery tab during the horses beat.",
  },
  { id: "e-merchant", kind: "person", slug: "the-merchant", name: "The merchant", stage: "hidden", dmNote: "The villain. Never seed facts players could see." },
];

function toSeed(e: SeedEntry): Entry {
  const { facts, stage, ...rest } = e;
  const out: Entry = {
    title: "",
    summary: "",
    nickname: "",
    hint: "",
    areas: [],
    links: [],
    dmNote: "",
    secrets: "",
    ...structuredClone(rest),
    stage,
    facts: [],
  };
  if (stage !== "hidden") out.start = stage;
  for (const t of facts ?? []) out.facts.push({ id: `${e.id}-f${out.facts.length + 1}`, slug: factSlug(out.facts, t), text: t });
  return out;
}

/**
 * Once per game: the starter entries at their starting stage (a portrait the
 * table has already seen counts as found, quietly), plus an entry for every
 * other portrait scene. An entry that's already there keeps what the DM wrote.
 */
export function withSeedEntries<T extends GameState | null>(state: T): T {
  if (!state || state.upgrades?.includes("discovery-seed")) return state;
  const list = (state.entries ??= []);
  const have = new Set(list.map((n) => n.id));
  const portrait = (id: string | undefined) => (id ? state.scenes.find((x) => x.id === id && x.kind === "portrait") : undefined);
  for (const seed of SEED_ENTRIES) {
    if (have.has(seed.id)) continue;
    const e = toSeed(seed);
    const sc = portrait(e.sceneId);
    if (e.sceneId && !sc) delete e.sceneId;
    if (sc?.known && !isFound(e.stage)) e.stage = "found";
    if (isFound(e.stage)) {
      e.foundAt = state.createdAt ?? 0;
      e.foundIn = null;
      if (sc) sc.known = true;
    }
    list.push(e);
  }
  for (const sc of state.scenes) {
    if (sc.kind !== "portrait" || entriesOf(state).some((n) => n.sceneId === sc.id)) continue;
    const e = entryFromScene(list, sc, `e-${sc.id}`);
    if (sc.known) {
      e.stage = "found";
      e.foundAt = state.createdAt ?? 0;
      e.foundIn = null;
    }
    list.push(e);
  }
  state.upgrades = [...(state.upgrades ?? []), "discovery-seed"];
  return state;
}
