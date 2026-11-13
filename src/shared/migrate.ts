// Upgrades a stored game to the current shape the first time it's read.
// Safe to run on an already-current game.
import type { GameState, Item, Shop } from "./types";

type Any = Record<string, unknown>;

export function upgrade(raw: unknown): GameState {
  const g = raw as Any & { schema?: number };
  if (g.schema === 2) return g as unknown as GameState;

  // 1 -> 2: shop visibility, item tiers, stock, special orders, banners.
  const shops = ((g.shops as Any[]) ?? []).map(
    (s): Shop => ({
      id: String(s.id),
      name: String(s.name),
      subtitle: String(s.subtitle ?? ""),
      // Phase 2: every shop starts hidden; the DM opens them in play.
      visibility: "hidden",
      playerIds: [],
    }),
  );
  const items = ((g.items as Any[]) ?? []).map((i): Item => {
    const lock = String(i.lockReason ?? "");
    return {
      id: String(i.id),
      shopId: String(i.shopId),
      name: String(i.name),
      priceCp: Number(i.priceCp ?? 0),
      description: String(i.description ?? ""),
      tier: lock ? "locked" : "sale",
      reason: lock,
      hint: "",
      hidePrice: !!i.hidePrice,
      stock: null,
      restockNote: "",
    };
  });
  const live = { ...(g.live as Any), shopOpen: false } as unknown as GameState["live"];
  return { ...(g as unknown as GameState), schema: 2, shops, items, live, orders: [], banner: null };
}
