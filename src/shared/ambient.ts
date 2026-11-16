// Ambient scenes: built-in backdrops for when the party goes off-plan. Drawn on
// the TV in SVG and CSS (src/client/scenes/Ambient.tsx), so there's nothing to
// upload and nothing to load. Shown by ref ("ambient/rainy-night"), with an
// optional caption ("The coast road, dusk.").
//
// The ids and labels are not secrets: the TV only ever gets the one on screen.

export const AMBIENT = [
  { id: "forest-road", label: "Forest road", caption: "The forest road." },
  { id: "rainy-night", label: "Rainy night", caption: "Rain, after dark." },
  { id: "snowy-street", label: "Snowy street", caption: "A snowy street." },
  { id: "tavern-crowd", label: "Tavern crowd", caption: "A crowded taproom." },
  { id: "campfire", label: "Campfire", caption: "Around the fire." },
  { id: "coastline", label: "Coastline", caption: "The coast road." },
  { id: "river-dusk", label: "River at dusk", caption: "The river, at dusk." },
  { id: "cave-mouth", label: "Cave mouth", caption: "The mouth of a cave." },
  { id: "dungeon-corridor", label: "Dungeon corridor", caption: "Somewhere below." },
  { id: "market-day", label: "Market day", caption: "Market day." },
  { id: "ship-deck", label: "Ship deck", caption: "On deck." },
  // Storyteller scenes: for a DM who frames the game as a tale being told (a
  // narrator by the fire, a wizard in their study). They come after the places
  // above and get their own heading in the off-script panel.
  { id: "fireside", label: "Gather round the fire", caption: "Gather round the fire…", group: "storyteller" },
  { id: "flickering-candle", label: "The flickering candle", caption: "By the light of the candle…", group: "storyteller" },
  { id: "wizard-study", label: "Wizard’s study", caption: "In the wizard’s study.", group: "storyteller" },
  { id: "storybook", label: "Open storybook", caption: "Once upon a time…", group: "storyteller" },
  { id: "embers", label: "Embers", caption: "The fire burns low.", group: "storyteller" },
] as const;

export type AmbientDef = (typeof AMBIENT)[number];
/** "storyteller" scenes are the narrator's frame; the rest are places. */
export const isStoryteller = (a: AmbientDef) => "group" in a && a.group === "storyteller";

export type AmbientId = (typeof AMBIENT)[number]["id"];
export const AMBIENT_IDS = AMBIENT.map((a) => a.id) as [AmbientId, ...AmbientId[]];
export const CAPTION_MAX = 80;

export function ambientById(id: string | undefined | null): (typeof AMBIENT)[number] | undefined {
  return AMBIENT.find((a) => a.id === id);
}

export const ambientRef = (id: AmbientId) => `ambient/${id}`;

/** "ambient/rainy-night" -> "rainy-night"; anything else -> null. */
export function ambientOfRef(ref: string | null | undefined): AmbientId | null {
  const m = /^ambient\/([a-z-]+)$/.exec((ref ?? "").trim().toLowerCase());
  return m && ambientById(m[1]) ? (m[1] as AmbientId) : null;
}
