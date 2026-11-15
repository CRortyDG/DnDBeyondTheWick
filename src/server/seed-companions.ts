// Starter companions and hirelings for Candlefair. DM-only stat blocks, server-only
// like the seed monsters, so DM notes never ship in the browser code.
import type { CompanionTemplate, GameState } from "@/shared/types";

const base = { hidden: [], tvHealth: "state", atZero: "saves", takesShare: false, resist: "", dmNote: "", abilities: [] } as const;

export const SEED_COMPANIONS: CompanionTemplate[] = [
  {
    ...base,
    id: "ct-sellsword",
    name: "Sellsword",
    combat: true,
    ac: 14,
    hp: 11,
    initBonus: 1,
    speed: "30 ft.",
    attacks: [{ name: "Spear", bonus: 3, damage: "1d6 + 1" }],
    abilities: [],
    offers: "Brave until someone else runs.",
    hidden: [],
  },
  {
    ...base,
    id: "ct-trollbark-guide",
    name: "Trollbark guide",
    combat: true,
    ac: 13,
    hp: 16,
    initBonus: 2,
    speed: "30 ft.",
    attacks: [{ name: "Shortbow", bonus: 4, damage: "1d6 + 2" }],
    abilities: [],
    offers: "Survival +5. Knows the safe paths.",
    hidden: [],
  },
  {
    ...base,
    id: "ct-porter",
    name: "Porter",
    combat: false,
    ac: 10,
    hp: 4,
    initBonus: 0,
    speed: "30 ft.",
    attacks: [],
    abilities: [],
    offers: "Carries the heavy stuff. Stays back from fights.",
    hidden: [],
  },
  {
    ...base,
    id: "ct-fennick",
    name: "Fennick",
    entryId: "e-fennick",
    needs: "friendly",
    takesShare: true,
    combat: true,
    ac: 11,
    hp: 9,
    initBonus: 0,
    speed: "30 ft.",
    attacks: [{ name: "Club", bonus: 2, damage: "1d4" }],
    abilities: [],
    offers: "Only joins once Friendly. Takes a share.",
    dmNote: "Still sore about the boat. Loyal once he likes you.",
    hidden: [],
  },
];

/** The shop's hire items, by seed id, and who they bring. */
const HIRES: { itemId: string; templateId: string }[] = [
  { itemId: "c-sellsword", templateId: "ct-sellsword" },
  { itemId: "i33", templateId: "ct-trollbark-guide" },
  { itemId: "c-porter", templateId: "ct-porter" },
];

/**
 * Once per game: the four starter companions, and the Rusty Candle's "Hire a …
 * (per day)" items turned into hires (paid per session like rent, the hireling
 * joins the party). An item the DM already changed into something else is left alone.
 */
export function withSeedCompanions<T extends GameState | null>(state: T): T {
  if (!state || state.upgrades?.includes("companions")) return state;
  const list = (state.companionTemplates ??= []);
  for (const t of SEED_COMPANIONS) {
    if (list.some((x) => x.id === t.id || x.name.toLowerCase() === t.name.toLowerCase())) continue;
    const copy = structuredClone(t);
    if (copy.entryId && !(state.entries ?? []).some((e) => e.id === copy.entryId)) {
      delete copy.entryId;
      delete copy.needs;
    }
    list.push(copy);
  }
  for (const h of HIRES) {
    const it = state.items.find((x) => x.id === h.itemId);
    if (!it || !list.some((t) => t.id === h.templateId)) continue;
    if (it.kind !== "purchase" && it.kind !== "service" && it.kind !== "recurring") continue;
    it.kind = "recurring";
    it.oneAtATime = true;
    it.companionTemplateId = h.templateId;
  }
  state.upgrades = [...(state.upgrades ?? []), "companions"];
  return state;
}
