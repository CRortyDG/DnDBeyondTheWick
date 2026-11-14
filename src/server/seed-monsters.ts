// Starter monster templates. DM-only, and server-only like the seed run sheet,
// so stat blocks and DM notes never ship in the browser code the TV and phones load.
import type { Beat, GameState, MonsterTemplate } from "@/shared/types";

export const PUDDING_GREMLIN: MonsterTemplate = {
  id: "m-pudding-gremlin",
  name: "Pudding Gremlin",
  displayName: "Something in the pudding",
  ac: 11,
  hp: "21",
  initBonus: 1,
  speed: "",
  attacks: [{ name: "Claw", bonus: 5, damage: "1d4 + 3" }],
  abilities: [
    { id: "fire-breath", name: "Fire Breath", text: "15-ft cone, DC 11 Dex, 2d6 fire, half on a save.", recharge: 6 },
    { id: "death-burst", name: "Death Burst", text: "DC 11 Dex, 2d6, 5 ft.", onDeath: true },
    { id: "false-appearance", name: "False Appearance", text: "While it sits still, it looks like an ordinary pudding." },
    { id: "create-gremlin", name: "Create Gremlin", text: "A new gremlin forms from an ordinary pudding within 10 ft.", uses: 1 },
  ],
  resist: "",
  immune: "Fire",
  notes: "",
  dmNote: "Start with two; only one uses Create Gremlin.",
};

/** The run sheet beat that becomes a fight, and the fight it sets up. */
const FIGHT_BEATS: { title: string; monsters: { name: string; count: number }[] }[] = [{ title: "the pudding fight", monsters: [{ name: "Pudding Gremlin", count: 2 }] }];

/**
 * Once per game: add the starter monsters to the library, and give the saved
 * "The pudding fight" beat its fight line (in place of the old "action: initiative").
 */
export function withSeedMonsters<T extends GameState | null>(state: T): T {
  if (!state) return state;
  const done = new Set(state.upgrades ?? []);
  if (!done.has("monsters")) {
    const list = (state.monsters ??= []);
    if (!list.some((m) => m.id === PUDDING_GREMLIN.id || m.name.toLowerCase() === PUDDING_GREMLIN.name.toLowerCase())) list.push(structuredClone(PUDDING_GREMLIN));
    state.upgrades = [...(state.upgrades ?? []), "monsters"];
  }
  if (!done.has("fight-beat")) {
    for (const ep of state.episodes ?? []) {
      for (const b of ep.beats as Beat[]) {
        const want = FIGHT_BEATS.find((x) => x.title === b.title.trim().toLowerCase());
        if (want && !b.actions.some((a) => a.type === "fight")) b.actions.push({ type: "fight", monsters: structuredClone(want.monsters) });
      }
    }
    state.upgrades = [...(state.upgrades ?? []), "fight-beat"];
  }
  return state;
}
