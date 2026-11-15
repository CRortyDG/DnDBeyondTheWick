// Bulk import: forgiving parsing, per-line errors, the same slugs as manual entries, all-or-nothing.
import { describe, expect, it } from "vitest";
import { IMPORT_EXAMPLES, IMPORT_MAX, parseEntries, parseItems, parseMonsters, readyCount } from "@/shared/bulkImport";
import { dmCommand, playerCommand, type Command } from "@/shared/commands";
import { apply, type Ctx } from "@/shared/reducer";
import { seedGame } from "@/shared/seed";
import { hydrate } from "@/server/store";
import type { GameState } from "@/shared/types";

const DM: Ctx = { now: 1000, actor: { role: "dm" } };
const run = (g: GameState, cmd: Command) => apply(g, dmCommand.parse(cmd) as Command, { ...DM, rand: () => 0.5 }).state;
const game = () => hydrate(seedGame("t"))!;

describe("monsters", () => {
  it("reads the example and a pasted stat block", () => {
    const plan = parseMonsters(
      `${IMPORT_EXAMPLES.monsters}

## Bandit Captain
Armor Class 15 (studded leather)
Hit Points 65 (10d8 + 20)
Speed 30 ft.
dex: 16 (+3)
attack: Scimitar. Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) slashing damage.
ability: Fire Breath (Recharge 5–6) | DC 12 Dex, 2d6
ability: Parry (1/Day) | +2 AC
- Leads from the back
Damage Resistances cold`,
      [],
    );
    expect(plan.rows.map((r) => r.errors)).toEqual([[], []]);
    const [gob, cap] = plan.rows.map((r) => r.body!);
    expect(gob).toMatchObject({ name: "Goblin", displayName: "Something in the bushes", ac: 15, hp: "2d6", initBonus: 2, speed: "30 ft", dmNote: "Flees at half HP" });
    expect(gob.attacks).toEqual([{ name: "Scimitar", bonus: 4, damage: "1d6+2" }]);
    expect(cap).toMatchObject({ ac: 15, hp: "10d8+20", initBonus: 3, speed: "30 ft", resist: "cold" });
    expect(cap.attacks[0]).toEqual({ name: "Scimitar", bonus: 5, damage: "1d6 + 3 slashing" });
    expect(cap.abilities).toEqual([
      { name: "Fire Breath", text: "DC 12 Dex, 2d6", recharge: 5 },
      { name: "Parry", text: "+2 AC", uses: 1 },
    ]);
    expect(cap.notes).toContain("Leads from the back");
  });

  it("flags errors by line and skips duplicates", () => {
    const plan = parseMonsters("## Goblin\nhp: lots\nac: x\n\n## Orc\nhp: 15\n\nstray line", [{ name: "orc" }]);
    expect(plan.rows[0].errors).toEqual(["Line 2: HP must be a number like 21 or dice like 6d6.", "Line 3: AC must be a number like 15."]);
    expect(plan.rows[1].duplicate).toBe(true);
    expect(readyCount(plan)).toBe(0);
  });
});

describe("discovery", () => {
  it("gives the same slugs as a hand-made entry, including repeats", () => {
    let g = game();
    g = run(g, { type: "entry.add", entry: { kind: "person", name: "Bolla Stone" } });
    const plan = parseEntries(`${IMPORT_EXAMPLES.entries}\n\n## place: The Old Mill\nstart: found\n\n## Person: Bolla  Stone!\n\n## faction/Night Owls\nareas: Docks, Candlefair`, g.entries!);
    expect(plan.rows.map((r) => r.ref)).toEqual(["person/mags-wick", "place/the-old-mill", "person/bolla-stone-2", "faction/night-owls"]);
    const body = plan.rows[3].body!;
    expect(body.entry).toMatchObject({ kind: "faction", name: "Night Owls", areas: ["Docks", "Candlefair"] });
  });

  it("reads every field and rejects shops and monsters", () => {
    const plan = parseEntries(`## mystery: The green light\ntitle: Over the river\nsummary: Seen at night.\nrumor: A light | Something glows.\nstart: rumored\nfact: It's a lantern\nfact: Fennick lit it\nsecret: It's a signal\ndm: Reveal in ch 3\n\n## shop: Nope\n\n## monster: Nope`, []);
    const b = plan.rows[0].body!;
    expect(b.entry).toMatchObject({ kind: "mystery", title: "Over the river", summary: "Seen at night.", nickname: "A light", hint: "Something glows.", start: "rumored", secrets: "It's a signal", dmNote: "Reveal in ch 3" });
    expect(b.facts).toEqual(["It's a lantern", "Fennick lit it"]);
    expect(plan.rows[1].errors[0]).toMatch(/Shop page/);
    expect(plan.rows[2].errors[0]).toMatch(/Monsters page/);
  });

  it("imports into Discovery with the slugs the preview showed, rumors as rumors", () => {
    let g = game();
    const plan = parseEntries("## place: Lantern Hill\nstart: rumored\nrumor: The hill | It glows.\n\n## item: Brass Key\nfact: Opens the mill", g.entries ?? []);
    g = run(g, { type: "import.bulk", entries: plan.rows.map((r) => r.body!) });
    const hill = g.entries!.find((e) => e.name === "Lantern Hill")!;
    expect(`${hill.kind}/${hill.slug}`).toBe(plan.rows[0].ref);
    expect(hill.stage).toBe("rumored");
    expect(hill.start).toBe("rumored");
    const key = g.entries!.find((e) => e.name === "Brass Key")!;
    expect(key.stage).toBe("hidden");
    expect(key.facts.map((f) => f.text)).toEqual(["Opens the mill"]);
  });
});

describe("shop items", () => {
  it("reads items, groups under a # shop heading, and plans new shops", () => {
    const g = game();
    const plan = parseItems(`${IMPORT_EXAMPLES.items}\n\n# Shop: The Smithy\n## Iron nails\nprice: 2 cp\ncategory: weapons\n\n## The Lighthouse fund\nkind: pooled project\ngoal: 500 gp\n\n## Medal\nkind: earned\nshop: ${g.shops[0].name}`, g.shops, g.items);
    expect(plan.rows.map((r) => r.errors)).toEqual([[], [], [], []]);
    expect(plan.rows[0].body).toEqual({ shop: "The Docks Stall", item: { name: "Healing potion", priceCp: 5000, description: "Heals 2d4+2.", tier: "sale", category: "healing", kind: "purchase", stock: 3 } });
    expect(plan.rows[1].body!.shop).toBe("The Smithy");
    expect(plan.rows[1].body!.item).toMatchObject({ priceCp: 2, category: "gear" });
    expect(plan.rows[2].body!.item).toMatchObject({ kind: "project", priceCp: 50000 });
    expect(plan.newShops).toEqual(g.shops.some((x) => x.name === "The Smithy") ? ["The Docks Stall"] : ["The Docks Stall", "The Smithy"]);
  });

  it("needs a shop and a price, and imports all or nothing", () => {
    let g = game();
    const bad = parseItems("## Rope\ncategory: gear", g.shops, g.items);
    expect(bad.rows[0].errors.join(" ")).toMatch(/which shop/);
    expect(bad.rows[0].errors.join(" ")).toMatch(/needs a price/);
    const plan = parseItems("# The Docks Stall\n## Rope\nprice: 1 gp\n## Lamp\nprice: 5 sp", g.shops, g.items);
    const shops = g.shops.length;
    g = run(g, { type: "import.bulk", items: plan.rows.map((r) => r.body!) });
    expect(g.shops.length).toBe(shops + 1);
    const stall = g.shops.at(-1)!;
    expect(g.items.filter((i) => i.shopId === stall.id).map((i) => i.name)).toEqual(["Rope", "Lamp"]);
    // Nothing is half done: a bad row throws and the state is untouched.
    const before = JSON.stringify(g);
    expect(() => apply(g, { type: "import.bulk", monsters: [{ name: "Ok", displayName: "", ac: 10, hp: "5", initBonus: 0, speed: "", attacks: [], abilities: [], resist: "", immune: "", notes: "", dmNote: "" }], entries: [{ entry: { kind: "place", name: "" } }] } as Command, { ...DM, rand: () => 0.5 })).toThrow();
    expect(JSON.stringify(g)).toBe(before);
  });
});

describe("the import command", () => {
  it("adds monsters the run sheet's fight: line can find, DM only, capped", () => {
    let g = game();
    const plan = parseMonsters(IMPORT_EXAMPLES.monsters, g.monsters ?? []);
    g = run(g, { type: "import.bulk", monsters: plan.rows.map((r) => r.body!) });
    expect(g.monsters!.some((m) => m.name === "Goblin" && m.hp === "2d6")).toBe(true);
    expect(playerCommand.safeParse({ type: "import.bulk", monsters: [] }).success).toBe(false);
    const many = Array.from({ length: IMPORT_MAX + 1 }, (_, i) => ({ shop: "A", item: { name: `x${i}`, priceCp: 1 } }));
    expect(dmCommand.safeParse({ type: "import.bulk", items: many }).success).toBe(false);
    const lots = parseItems(Array.from({ length: IMPORT_MAX + 3 }, (_, i) => `## Thing ${i}\nshop: A\nprice: 1`).join("\n"), [], []);
    expect(readyCount(lots)).toBe(IMPORT_MAX);
  });
});
