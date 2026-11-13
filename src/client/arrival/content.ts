// Everything the Arrival intro says, in one place. Edit freely.
//
// Placeholders: {SHIP}, {CAPTAIN}, {CHARACTER}. Text in *asterisks* is narration
// (italic); text in "quotes" is someone speaking.
//
// This file is sent to every phone that opens the link, so keep it to what a
// stranger stepping off the boat would see.

export const NAMES = {
  SHIP: "The Gull’s Promise",
  CAPTAIN: "Orsa Dell",
};

// The link preview's title, line and image are in arrive.html (the <meta> tags at the top).

/** Small extras in the pictures. */
export const EXTRAS = {
  /** A detail in the walk uphill. */
  uphillDetail: true,
};

export type SceneId = "sea" | "deck" | "passengers" | "rivermouth" | "town" | "docking" | "uphill" | "door" | "mags";
export type SoundBed = "ship" | "wind" | "hearth" | null;

export interface Step {
  /** Lines appear one after another. */
  lines: string[];
  /** Which part of the scene to show (the walk uphill, the door, the room). */
  shot?: number;
  /** A one-off sound when this step starts. */
  cue?: "door";
}

export interface Panel {
  scene: SceneId;
  sound: SoundBed;
  steps: Step[];
}

export const PANELS: Panel[] = [
  { scene: "sea", sound: "ship", steps: [{ lines: ["*Four days out of Baldur\u2019s Gate.*"] }] },
  { scene: "deck", sound: "ship", steps: [{ lines: ["*{CAPTAIN} doesn\u2019t look at you.*", "\u201CCandlefair by noon. Don\u2019t fall in.\u201D"] }] },
  { scene: "passengers", sound: "ship", steps: [{ lines: ["*A few other passengers. Nobody\u2019s said much.*", "*You\u2019ve all caught each other looking.*"] }] },
  { scene: "rivermouth", sound: "ship", steps: [{ lines: ["*Across the water, the old lighthouse at Lathtarl\u2019s Lantern.*"] }] },
  { scene: "town", sound: "ship", steps: [{ lines: ["*Candlefair. Somebody\u2019s hanging garlands from every roof.*"] }] },
  { scene: "docking", sound: "ship", steps: [{ lines: ["*You don\u2019t know anyone here.*"] }] },
  {
    scene: "uphill",
    sound: "wind",
    steps: [
      { shot: 0, lines: ["*A fisherman losing an argument with a rope.*"] },
      { shot: 1, lines: ["*A ladder that\u2019s seen better days. Everyone holds their breath.*"] },
      { shot: 2, lines: ["*Something sweet on the cold air.*"] },
    ],
  },
  {
    scene: "door",
    sound: "wind",
    steps: [
      { shot: 0, lines: ["*Somewhere warm. Finally.*"] },
      { shot: 1, lines: ["*Empty. A fire, a tall candle, and one halfling behind the bar.*"], cue: "door" },
    ],
  },
  {
    scene: "mags",
    sound: "hearth",
    steps: [
      { shot: 0, lines: ["\u201CNew faces. Sit anywhere.\u201D", "\u201C\u2026Not that stool.\u201D"] },
      { shot: 1, lines: ["*Strangers, every one of you. Each at your own table.*"] },
    ],
  },
];

/** The last panel is the seat page. */
export const SEAT_PAGE = {
  header: "The Flickering Candle",
  question: "Who walked in?",
  nameLabel: "Your character’s name",
  whyLabel: "Why did you get on that boat?",
  takeSeat: "Take a seat",
  decideLater: "Decide later",
  /** Shown as their candle lights. */
  claimLine: "You find a seat. Nobody bothers you. Yet.",
  seatsHeading: "Around the table",
  emptySeat: "An empty seat",
  replay: "Replay intro",
  table: "Go to your table",
  edit: "Change your name or line",
  locked: "Seats are set. See you at the table.",
  noLink: "This table keeps a guest list. Open the link the DM sent you to take your seat.",
};

/** Optional recorded sounds. Leave empty to use the ones made in the browser; put files in public/arrival/sounds/. */
export const SOUND_FILES: Partial<Record<"ship" | "wind" | "hearth" | "door", string>> = {
  // ship: "/arrival/sounds/ship.mp3",
  // wind: "/arrival/sounds/wind.mp3",
  // hearth: "/arrival/sounds/hearth.mp3",
  // door: "/arrival/sounds/door.mp3",
};

export function fill(text: string, character?: string): string {
  return text
    .replace(/\{SHIP\}/g, NAMES.SHIP)
    .replace(/\{CAPTAIN\}/g, NAMES.CAPTAIN)
    .replace(/\{CHARACTER\}/g, character?.trim() || "stranger");
}
