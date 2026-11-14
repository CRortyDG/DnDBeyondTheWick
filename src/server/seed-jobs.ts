// DM-only notes for the starter job flyers. They live on the server, like the
// seed run sheet, so they never ship in browser code.
import type { GameState, JobDmNotes } from "@/shared/types";

export const SEED_JOB_NOTES: Record<string, Partial<JobDmNotes>> = {
  "j-artum": {
    adventure: "Episode one: “Just Desserts” (Episodes tab)",
    notes: "25 gp a day per player, as on Artum’s printed notice.",
  },
  "j-ransom": {
    adventure: "“Robber Baron” (Adventures in Faerûn, Sword Coast)",
    loot: "Roughly 500 gp in coins and gems in the hideout, plus a Potion of Climbing and a Spell Scroll of See Invisibility.",
    twists: "The leader, Mardon Rueh, may offer to hire the party against the Eomane family, which leads to “Blood Night” (chapter 6).",
  },
  "j-sheep": { notes: "Placeholder: attach a real adventure later." },
  "j-envelope": { notes: "Placeholder for a Baldur’s Gate patron job." },
};

/**
 * Fill in a starter job's notes once per game (only the fields still empty),
 * so a note the DM clears or rewrites stays that way.
 */
export function withSeedJobNotes<T extends GameState | null>(state: T): T {
  if (!state?.jobs) return state;
  for (const j of state.jobs) {
    const notes = SEED_JOB_NOTES[j.id];
    const tag = `notes:${j.id}`;
    if (!notes || state.upgrades?.includes(tag)) continue;
    for (const k of Object.keys(notes) as (keyof JobDmNotes)[]) if (!j.dm[k]) j.dm[k] = notes[k] ?? "";
    state.upgrades = [...(state.upgrades ?? []), tag];
  }
  return state;
}
