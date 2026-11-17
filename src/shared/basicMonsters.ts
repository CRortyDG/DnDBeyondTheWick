import type { MonsterAbility, MonsterAttack } from "./types";

/**
 * Basic monsters a new DM can add to an empty library in one tap.
 * Numbers come from the free System Reference Document 5.1 by Wizards of the
 * Coast LLC (https://dnd.wizards.com/resources/systems-reference-document),
 * licensed under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/).
 * Only the numbers and short reminders combat mode needs, not full stat blocks.
 */
export const BASIC_MONSTERS_CREDIT =
  "Stats from the System Reference Document 5.1 by Wizards of the Coast LLC, CC BY 4.0.";

export interface BasicMonster {
  name: string;
  /** Challenge rating, as a label ("1/4"). */
  cr: string;
  ac: number;
  hp: string;
  initBonus: number;
  speed: string;
  attacks: MonsterAttack[];
  abilities: Omit<MonsterAbility, "id">[];
  resist?: string;
  immune?: string;
  notes?: string;
}

const a = (name: string, bonus: number, damage: string): MonsterAttack => ({ name, bonus, damage });

export const BASIC_MONSTERS: BasicMonster[] = [
  { name: "Commoner", cr: "0", ac: 10, hp: "1d8", initBonus: 0, speed: "30 ft.", attacks: [a("Club", 2, "1d4 bludgeoning")], abilities: [] },
  { name: "Giant Rat", cr: "1/8", ac: 12, hp: "2d6", initBonus: 2, speed: "30 ft.", attacks: [a("Bite", 4, "1d4+2 piercing")], abilities: [{ name: "Pack Tactics", text: "Advantage on attacks if an ally is within 5 ft. of the target." }] },
  { name: "Kobold", cr: "1/8", ac: 12, hp: "2d6-2", initBonus: 2, speed: "30 ft.", attacks: [a("Dagger", 4, "1d4+2 piercing"), a("Sling", 4, "1d4+2 bludgeoning")], abilities: [{ name: "Pack Tactics", text: "Advantage on attacks if an ally is within 5 ft. of the target." }, { name: "Sunlight Sensitivity", text: "Disadvantage on attacks and sight checks in sunlight." }] },
  { name: "Bandit", cr: "1/8", ac: 12, hp: "2d8+2", initBonus: 1, speed: "30 ft.", attacks: [a("Scimitar", 3, "1d6+1 slashing"), a("Light crossbow", 3, "1d8+1 piercing")], abilities: [] },
  { name: "Cultist", cr: "1/8", ac: 12, hp: "2d8", initBonus: 1, speed: "30 ft.", attacks: [a("Scimitar", 3, "1d6+1 slashing")], abilities: [{ name: "Dark Devotion", text: "Advantage on saves against being charmed or frightened." }] },
  { name: "Guard", cr: "1/8", ac: 16, hp: "2d8+2", initBonus: 1, speed: "30 ft.", attacks: [a("Spear", 3, "1d6+1 piercing")], abilities: [] },
  { name: "Goblin", cr: "1/4", ac: 15, hp: "2d6", initBonus: 2, speed: "30 ft.", attacks: [a("Scimitar", 4, "1d6+2 slashing"), a("Shortbow", 4, "1d6+2 piercing")], abilities: [{ name: "Nimble Escape", text: "Disengage or Hide as a bonus action." }] },
  { name: "Skeleton", cr: "1/4", ac: 13, hp: "2d8+4", initBonus: 2, speed: "30 ft.", attacks: [a("Shortsword", 4, "1d6+2 piercing"), a("Shortbow", 4, "1d6+2 piercing")], abilities: [], immune: "Poison; exhaustion, poisoned", notes: "Vulnerable to bludgeoning." },
  { name: "Zombie", cr: "1/4", ac: 8, hp: "3d8+9", initBonus: -2, speed: "20 ft.", attacks: [a("Slam", 3, "1d6+1 bludgeoning")], abilities: [{ name: "Undead Fortitude", text: "Dropped to 0 HP: DC 5 + damage taken Con save to drop to 1 HP instead (not radiant or a crit).", onDeath: true }], immune: "Poison; poisoned" },
  { name: "Wolf", cr: "1/4", ac: 13, hp: "2d8+2", initBonus: 2, speed: "40 ft.", attacks: [a("Bite", 4, "2d4+2 piercing")], abilities: [{ name: "Knock down", text: "A bite hit: DC 11 Str save or knocked prone." }, { name: "Pack Tactics", text: "Advantage on attacks if an ally is within 5 ft. of the target." }] },
  { name: "Orc", cr: "1/2", ac: 13, hp: "2d8+6", initBonus: 1, speed: "30 ft.", attacks: [a("Greataxe", 5, "1d12+3 slashing"), a("Javelin", 5, "1d6+3 piercing")], abilities: [{ name: "Aggressive", text: "Bonus action: move up to its speed toward an enemy it can see." }] },
  { name: "Hobgoblin", cr: "1/2", ac: 18, hp: "2d8+2", initBonus: 1, speed: "30 ft.", attacks: [a("Longsword", 3, "1d8+1 slashing"), a("Longbow", 3, "1d8+1 piercing")], abilities: [{ name: "Martial Advantage", text: "Once a turn, +2d6 damage if an ally is within 5 ft. of the target." }] },
  { name: "Thug", cr: "1/2", ac: 11, hp: "5d8+10", initBonus: 0, speed: "30 ft.", attacks: [a("Mace", 4, "1d6+2 bludgeoning"), a("Heavy crossbow", 2, "1d10 piercing")], abilities: [{ name: "Multiattack", text: "Two mace attacks." }, { name: "Pack Tactics", text: "Advantage on attacks if an ally is within 5 ft. of the target." }] },
  { name: "Gnoll", cr: "1/2", ac: 15, hp: "5d8", initBonus: 1, speed: "30 ft.", attacks: [a("Bite", 4, "1d4+2 piercing"), a("Spear", 4, "1d6+2 piercing"), a("Longbow", 3, "1d8+1 piercing")], abilities: [{ name: "Rampage", text: "Drops a creature to 0 HP: bonus action move half its speed and bite." }] },
  { name: "Ghoul", cr: "1", ac: 12, hp: "5d8", initBonus: 2, speed: "30 ft.", attacks: [a("Bite", 2, "2d6+2 piercing"), a("Claws", 4, "2d4+2 slashing")], abilities: [{ name: "Paralyzing claws", text: "A claw hit (not elves or undead): DC 10 Con save or paralyzed 1 minute, save at the end of each turn." }], immune: "Poison; charmed, exhaustion, poisoned" },
  { name: "Bugbear", cr: "1", ac: 16, hp: "5d8+5", initBonus: 2, speed: "30 ft.", attacks: [a("Morningstar", 4, "2d8+2 piercing"), a("Javelin", 4, "1d6+2 piercing")], abilities: [{ name: "Surprise Attack", text: "+2d6 damage on a hit against a surprised creature in the first round." }] },
  { name: "Giant Spider", cr: "1", ac: 14, hp: "4d10+4", initBonus: 3, speed: "30 ft., climb 30 ft.", attacks: [a("Bite", 5, "1d8+3 piercing + 2d8 poison (DC 11 Con half)")], abilities: [{ name: "Web", text: "Ranged +5, 30/60 ft.: restrained. DC 12 Str to escape; the web has AC 10, 5 HP.", recharge: 5 }] },
  { name: "Brown Bear", cr: "1", ac: 11, hp: "4d10+12", initBonus: 0, speed: "40 ft., climb 30 ft.", attacks: [a("Bite", 6, "1d8+4 piercing"), a("Claws", 6, "2d6+4 slashing")], abilities: [{ name: "Multiattack", text: "One bite and one claws." }] },
  { name: "Bandit Captain", cr: "2", ac: 15, hp: "10d8+20", initBonus: 3, speed: "30 ft.", attacks: [a("Scimitar", 5, "1d6+3 slashing"), a("Dagger", 5, "1d4+3 piercing")], abilities: [{ name: "Multiattack", text: "Two scimitar attacks and one dagger." }, { name: "Parry", text: "Reaction: +2 AC against one melee hit it can see." }] },
  { name: "Ogre", cr: "2", ac: 11, hp: "7d10+21", initBonus: -1, speed: "40 ft.", attacks: [a("Greatclub", 6, "2d8+4 bludgeoning"), a("Javelin", 6, "2d6+4 piercing")], abilities: [] },
  { name: "Veteran", cr: "3", ac: 17, hp: "9d8+18", initBonus: 1, speed: "30 ft.", attacks: [a("Longsword", 5, "1d8+3 slashing"), a("Shortsword", 5, "1d6+3 piercing"), a("Heavy crossbow", 3, "1d10+1 piercing")], abilities: [{ name: "Multiattack", text: "Two longsword attacks; with a shortsword drawn, one shortsword attack too." }] },
  { name: "Owlbear", cr: "3", ac: 13, hp: "7d10+21", initBonus: 1, speed: "40 ft.", attacks: [a("Beak", 7, "1d10+5 piercing"), a("Claws", 7, "2d8+5 slashing")], abilities: [{ name: "Multiattack", text: "One beak and one claws." }] },
];
