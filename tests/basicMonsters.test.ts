import { describe, expect, it } from "vitest";
import { BASIC_MONSTERS } from "@/shared/basicMonsters";
import { monsterBody } from "@/shared/combatSchema";
import { isDice } from "@/shared/combat";

describe("basic monsters", () => {
  it("every one is a valid monster for the library, with rollable HP", () => {
    const names = new Set<string>();
    for (const m of BASIC_MONSTERS) {
      const body = { name: m.name, displayName: "", ac: m.ac, hp: m.hp, initBonus: m.initBonus, speed: m.speed, attacks: m.attacks, abilities: m.abilities, resist: m.resist ?? "", immune: m.immune ?? "", notes: m.notes ?? "", dmNote: "" };
      expect(monsterBody.safeParse(body).success, m.name).toBe(true);
      expect(isDice(m.hp), m.name).toBe(true);
      expect(names.has(m.name)).toBe(false);
      names.add(m.name);
    }
    expect(BASIC_MONSTERS.length).toBeGreaterThanOrEqual(15);
  });
});
