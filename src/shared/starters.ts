// Starting points for players who have never played: six kinds of hero in
// plain words, each with the recipe to build it in D&D Beyond (2024 rules).
//
// This file is sent to every phone that opens an Arrival link, so it stays
// campaign-neutral: nothing about the story beyond the boat and Winterfest.

export const STARTER_IDS = ["protector", "sneak", "spellcaster", "healer", "wild", "charmer"] as const;
export type StarterId = (typeof STARTER_IDS)[number];

export interface Starter {
  id: StarterId;
  /** The plain-words name, shown big. */
  title: string;
  /** One line: what they're like. */
  feel: string;
  /** One line: what you do on your turn. */
  turn: string;
  /** The D&D Beyond recipe (2024 rules). */
  dnd: { cls: string; species: string; background: string };
  /** Which ability score to put the highest number in. */
  best: string;
  /** Suggestions the player can keep or change. */
  sampleName: string;
  sampleWhy: string;
}

export const STARTERS: Starter[] = [
  {
    id: "protector",
    title: "The Protector",
    feel: "Stands in front and takes the hits so nobody else has to.",
    turn: "Step up and swing your sword, or raise your shield for a friend.",
    dnd: { cls: "Fighter", species: "Human", background: "Soldier" },
    best: "Strength",
    sampleName: "Brannoc Hale",
    sampleWhy: "Done with soldiering. Looking for somewhere quiet.",
  },
  {
    id: "sneak",
    title: "The Sneak",
    feel: "Quick, clever, and very good with locks.",
    turn: "Slip round the side and strike where they aren’t looking.",
    dnd: { cls: "Rogue", species: "Halfling", background: "Criminal" },
    best: "Dexterity",
    sampleName: "Pip Tallow",
    sampleWhy: "Left Baldur’s Gate in a hurry. Don’t ask.",
  },
  {
    id: "spellcaster",
    title: "The Spellcaster",
    feel: "Learned big magic from old books, and wants more.",
    turn: "Pick a spell from your book: fire, frost, or a clever trick.",
    dnd: { cls: "Wizard", species: "Elf", background: "Sage" },
    best: "Intelligence",
    sampleName: "Ilvara Quen",
    sampleWhy: "Chasing a rare book someone swears went north.",
  },
  {
    id: "healer",
    title: "The Healer",
    feel: "Keeps everyone standing, with a little help from above.",
    turn: "Heal a friend with a touch, or call down holy light on a foe.",
    dnd: { cls: "Cleric", species: "Dwarf", background: "Acolyte" },
    best: "Wisdom",
    sampleName: "Dagna Stoutbraid",
    sampleWhy: "My temple sent me where help is needed.",
  },
  {
    id: "wild",
    title: "The Wild One",
    feel: "Talks to animals and is happiest outdoors.",
    turn: "Call up vines and wind, and later turn into an animal yourself.",
    dnd: { cls: "Druid", species: "Gnome", background: "Guide" },
    best: "Wisdom",
    sampleName: "Fennick Moss",
    sampleWhy: "The forest told me to go north. It was very insistent.",
  },
  {
    id: "charmer",
    title: "The Charmer",
    feel: "Can talk their way out of anything, with a song and a little magic.",
    turn: "Cheer your friends on, charm a stranger, or mock a foe until it hurts.",
    dnd: { cls: "Bard", species: "Tiefling", background: "Entertainer" },
    best: "Charisma",
    sampleName: "Lyra Vane",
    sampleWhy: "Heard Winterfest pays well for a good song.",
  },
];

export function starterById(id: string | null | undefined): Starter | null {
  return STARTERS.find((s) => s.id === id) ?? null;
}

/** "Help me choose": three questions, two answers each. */
export const QUIZ = [
  { q: "When trouble starts, you’d rather…", a: ["Be right in the middle of it", "Hang back and be clever"] },
  { q: "Magic?", a: ["Yes, please", "Not really my thing"] },
  { q: "Around other people, you’d rather…", a: ["Look after them", "Do your own thing"] },
] as const;

/** The suggestion for a set of answers (0 or 1 for each question). */
export function quizPick(answers: readonly number[]): StarterId {
  const [front, magic, care] = answers.map((a) => a === 0);
  if (front) {
    if (!magic) return "protector";
    return care ? "healer" : "wild";
  }
  if (!magic) return care ? "charmer" : "sneak";
  return care ? "charmer" : "spellcaster";
}
