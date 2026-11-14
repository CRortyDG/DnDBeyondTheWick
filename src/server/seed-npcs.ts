// The starter People compendium. Server-only, like the seed run sheet, so the
// locked facts never ship in the browser code the TV and phones download.
import type { GameState, Npc } from "@/shared/types";
import { npcFromScene, npcsOf } from "@/shared/people";

type SeedNpc = Omit<Npc, "facts" | "met"> & { facts: string[] };

/** Drafted from "Just Desserts". Every fact starts locked; the DM reveals them in play. */
export const SEED_NPCS: SeedNpc[] = [
  {
    id: "npc-mags",
    name: "Mags Wick",
    title: "Keeper of the Flickering Candle",
    blurb: "The halfling who runs the Flickering Candle. Calls everyone “pet” or “duck”, and never forgets a tab.",
    sceneId: "s-mags",
    mood: "friendly",
    facts: [
      "Poured the party their first drinks in Candlefair, on a tab none of them could pay.",
      "Asks every newcomer what they’d do with a fortune, and remembers the answer.",
      "Will let a tab run at her own counter, up to a point.",
    ],
    dmNote: "Her lines: “pet”, “duck”. She sells Artum’s job: “Twenty-five gold? Duck, that’s three months of tips.”",
  },
  {
    id: "npc-artum",
    name: "Artum",
    title: "Planner of Winterfest",
    blurb: "Balding, spectacled and permanently worried. Short of helpers, never short of complaints.",
    sceneId: "s-artum",
    facts: [
      "His hired helpers quit the morning of the feast, after someone fell off a ladder.",
      "Paid the party’s tab at the Candle, then told them they owed him.",
      "Docks wages out loud, item by item, for anything broken.",
      "Ordered brand-new recipes for the Winterfest feast, never served before.",
    ],
    dmNote: "Pays 25 gp each for the day, minus breakage. Backhanded thanks to the “volunteers” in his toast.",
  },
  {
    id: "npc-chef",
    name: "The Chef",
    title: "Head cook of the Winterfest feast",
    blurb: "A ginger beard, a tall hat and a lot of pride in his desserts.",
    sceneId: "s-chef",
    facts: ["Bought his new recipes from a traveling merchant.", "Every recipe page bears the same symbol.", "The pages won’t burn. They come out of the fire cold."],
    dmNote: "Mortified after the pudding fight. Pushes a page into the party’s hands: “I don’t want it in my kitchen.”",
  },
  {
    id: "npc-bolla",
    name: "Bolla",
    title: "Minds the horses at the banquet hall",
    blurb: "Loud, cheerful and usually in the middle of the chaos.",
    facts: ["Knows every horse’s quirks: “He likes his left ear scratched!”"],
    dmNote: "No portrait yet: introduce Bolla from the People tab during the horses beat.",
  },
  {
    id: "npc-captain",
    name: "The captain",
    title: "Master of the Gull’s Promise",
    blurb: "Brought the party across to Candlefair.",
    facts: ["Once carried a peddler who paid in coin the captain had never seen before."],
    dmNote: "Throwaway on the docks, but the same captain returns later.",
  },
];

/**
 * Once per game: the starter entries (an entry whose portrait the table has
 * already seen counts as met, quietly), plus an entry for every other portrait.
 */
export function withSeedNpcs<T extends GameState | null>(state: T): T {
  if (!state || state.upgrades?.includes("npcs")) return state;
  const list = (state.npcs ??= []);
  const have = new Set(list.map((n) => n.id));
  const metAt = (sceneId: string | undefined) => {
    const sc = sceneId ? state.scenes.find((x) => x.id === sceneId && x.kind === "portrait") : undefined;
    return sc?.known ? { at: state.createdAt ?? 0, sessionId: null } : undefined;
  };
  for (const seed of SEED_NPCS) {
    if (have.has(seed.id)) continue;
    const { facts, ...rest } = seed;
    const n: Npc = { ...structuredClone(rest), facts: facts.map((text, i) => ({ id: `${seed.id}-f${i + 1}`, text })) };
    if (n.sceneId && !state.scenes.some((x) => x.id === n.sceneId && x.kind === "portrait")) delete n.sceneId;
    const met = metAt(n.sceneId);
    if (met) n.met = met;
    list.push(n);
  }
  for (const sc of state.scenes) {
    if (sc.kind !== "portrait" || npcsOf(state).some((n) => n.sceneId === sc.id)) continue;
    const n = npcFromScene(sc, `npc-${sc.id}`);
    const met = metAt(sc.id);
    if (met) n.met = met;
    list.push(n);
  }
  state.upgrades = [...(state.upgrades ?? []), "npcs"];
  return state;
}
