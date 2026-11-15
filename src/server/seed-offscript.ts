// The off-script kit's starter tables for Candlefair: rumors around town and
// street encounters, d20 each. Server-only, like the other seeds. Added once
// per game (upgrade tag "offscript-seed"), so edits and deletes stick, and
// flagged for review so the DM reads them before trusting them at the table.
// A blank campaign starts with the tag done (presets.ts), so it never gets them.

import type { GameState, RandomTable } from "@/shared/types";
import { fillRanges } from "@/shared/tables";

const TAG = "offscript-seed";

const RUMORS = [
  "Mags hasn't let the Candle's flame go out in eleven years, not even in the great storm.",
  "Someone's been rowing out to the Lantern after dark with a covered basket.",
  "The ferry bell rang by itself at midnight, three times.",
  "A merchant in a grey coat paid Bolla in coins that were warm to the touch.",
  "The temple roof leaks only over the shrine, never anywhere else.",
  "Fennick swears a fish told him the river's going to freeze early this year.",
  "The smithy's forge went cold for an hour, and the smith won't say why.",
  "A barge from Baldur's Gate tied up at the docks and nobody saw it unload.",
  "The baker's been up before dawn baking for someone who never comes in.",
  "Artum has been asking around for anyone who can read old Elvish.",
  "There's a second cellar under the Flickering Candle, bricked up long ago.",
  "Children say the willow by the mill whispers names if you bring it bread.",
  "The town council is quietly asking about the lighthouse deeds.",
  "A traveller asked for the Merchant by name, then left before supper.",
  "Lanterns along the docks keep going out one by one, always east to west.",
  "Someone's been leaving little paper boats with wishes on them in the reeds.",
  "The goats on the hill won't graze near the old cairn any more.",
  "A Trollbark ranger came into town wounded and wouldn't say what did it.",
  "Winterfest's prize this year is something no one's seen before.",
  "Orsa says she heard singing from under the river, just once.",
];

const ENCOUNTERS = [
  "A dock cat steals a fish and leaps onto a hero's shoulder.",
  "Fennick needs a hand hauling in a net that's far too heavy.",
  "A gust blows a stack of Winterfest flyers down the street.",
  "Two children challenge the heroes to a snowball (or mud) fight.",
  "A cart of candles tips over and rolls everywhere.",
  "A nervous stranger asks the way to the Flickering Candle.",
  "Rats spill out of a warehouse at the docks. fight: Giant Rat x3",
  "The lamplighter is stuck up a ladder and the ladder is leaving.",
  "A goose has taken over the bridge and will not be moved.",
  "Bolla offers a free sample of something experimental.",
  "A street preacher warns of a merchant who sells wishes.",
  "A lost traveller from Baldur's Gate with a very large hat box.",
  "Someone's prize pumpkin has rolled into the river.",
  "A fishing boat comes in with a strange carved box in its net.",
  "The baker needs an urgent delivery made across town.",
  "A pudding on a windowsill twitches. fight: Pudding Gremlin",
  "Bells ring for a wedding and the party is pulled into the dance.",
  "A pickpocket tries their luck on the shiniest-looking hero.",
  "Fog rolls in; a shape moves near the water's edge.",
  "Wolves are seen at the edge of town after dark. fight: Wolf x2",
];

function table(id: string, name: string, kind: RandomTable["kind"], lines: string[], now: number): RandomTable {
  const f = fillRanges(20, lines.map((text) => ({ text })));
  if ("error" in f) throw new Error(f.error);
  return { id, name, die: 20, kind, rows: f.rows, areas: ["Candlefair"], dmNote: "A starter table for the off-script kit. Edit it to fit your table.", createdAt: now, origin: "seed", review: { at: now, sessionId: null } };
}

export function withSeedOffscript<T extends GameState | null>(state: T): T {
  if (!state || state.upgrades?.includes(TAG)) return state;
  const now = state.createdAt ?? 0;
  const list = (state.tables ??= []);
  for (const t of [table("rt-cf-rumors", "Candlefair rumors", "rumor", RUMORS, now), table("rt-cf-street", "Candlefair street encounters", "encounter", ENCOUNTERS, now)]) {
    if (!list.some((x) => x.id === t.id || x.name === t.name)) list.push(t);
  }
  state.upgrades = [...(state.upgrades ?? []), TAG];
  return state;
}
