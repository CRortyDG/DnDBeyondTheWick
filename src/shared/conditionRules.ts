// What each condition does, in a line or two (2024 rules, in our own words), so
// a player with "Grappled" on their phone doesn't have to ask the table.
// Keyed by lower-case name: the fight uses "Grappled", the sheet "grappled".

export const CONDITION_RULES: Record<string, string> = {
  blinded: "You can’t see. Your attacks have disadvantage, attacks against you have advantage, and checks that need sight fail.",
  charmed: "You can’t attack the one who charmed you or aim harmful magic at them. They have advantage on social checks with you.",
  deafened: "You can’t hear, and checks that need hearing fail.",
  exhaustion: "Each level: −2 on every d20 roll and −5 ft of speed. At level 6 you die. A long rest takes one level off.",
  frightened: "While you can see what scares you: disadvantage on checks and attacks, and you can’t move closer to it.",
  grappled: "Your speed is 0. Disadvantage on attacks against anyone but the grappler, who can drag you along. Use your action to escape (Athletics or Acrobatics against their DC).",
  incapacitated: "No actions, bonus actions or reactions, and you can’t speak. Concentration ends. Disadvantage on initiative.",
  invisible: "You can’t be seen. Your attacks have advantage, attacks against you have disadvantage (unless they can see you). Advantage on initiative.",
  paralyzed: "Incapacitated and can’t move. You fail Strength and Dexterity saves. Attacks against you have advantage, and a hit from within 5 ft is a critical.",
  petrified: "Turned to stone: incapacitated, can’t move, fail Strength and Dexterity saves. Attacks against you have advantage. You resist all damage and can’t be poisoned.",
  poisoned: "Disadvantage on attack rolls and ability checks.",
  prone: "You can crawl, or stand up for half your speed. Your attacks have disadvantage. Attacks from within 5 ft have advantage, from farther away disadvantage.",
  restrained: "Your speed is 0. Disadvantage on your attacks and Dexterity saves. Attacks against you have advantage.",
  stunned: "Incapacitated. You fail Strength and Dexterity saves. Attacks against you have advantage.",
  unconscious: "Incapacitated and prone: you drop what you hold and can’t move. You fail Strength and Dexterity saves. Attacks against you have advantage, and a hit from within 5 ft is a critical.",
};

/** The rule text for a condition by any casing ("Grappled", "grappled"), or undefined for a custom one. */
export function conditionRule(name: string): string | undefined {
  return CONDITION_RULES[name.trim().toLowerCase()];
}

/** A small mark for each condition, so a TV chip or a map token can show it at a glance. */
export const CONDITION_GLYPHS: Record<string, string> = {
  blinded: "◉",
  charmed: "♥",
  deafened: "◌",
  exhaustion: "☾",
  frightened: "!",
  grappled: "✊",
  incapacitated: "✕",
  invisible: "◇",
  paralyzed: "≋",
  petrified: "▲",
  poisoned: "☠",
  prone: "↓",
  restrained: "⛓",
  stunned: "✶",
  unconscious: "z",
};

/** The mark for a condition by any casing; a custom one gets its first letter. */
export function conditionGlyph(name: string): string {
  return CONDITION_GLYPHS[name.trim().toLowerCase()] ?? (name.trim().charAt(0).toUpperCase() || "?");
}
