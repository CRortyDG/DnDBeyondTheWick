// Upgrades a stored game to the current shape the first time it's read.
// Safe to run on an already-current game.
import { emptyProgress } from "./seed";
import type { GameState, Item, ItemCategory, Shop } from "./types";

type Any = Record<string, unknown>;

export function upgrade(raw: unknown): GameState {
  const g = raw as Any & { schema?: number };
  if (g.schema === 2) return withRequests(g as unknown as GameState);

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
      category: OLD_SHOP_CATEGORY[String(i.shopId)] ?? "gear",
      kind: "purchase",
    };
  });
  const live = { ...(g.live as Any), shopOpen: false } as unknown as GameState["live"];
  return withRequests({ ...(g as unknown as GameState), schema: 2, shops, items, live, orders: [], banner: null });
}

/** Phone purchase requests and the progression shop arrived after schema 2; older saves just have none. */
function withRequests(g: GameState): GameState {
  const empty = emptyProgress();
  const current = Array.isArray(g.requests) && (Object.keys(empty) as (keyof typeof empty)[]).every((k) => g[k] !== undefined) && g.items.every((i) => i.category && i.kind);
  if (current) return g;
  const out: GameState = Array.isArray(g.requests) ? { ...g } : { ...g, requests: [] };
  for (const k of Object.keys(empty) as (keyof typeof empty)[]) {
    if (out[k] === undefined) (out as unknown as Any)[k] = empty[k];
  }
  if (out.items.some((i) => !i.category || !i.kind)) {
    out.items = out.items.map((i) => (i.category && i.kind ? i : { ...i, category: i.category ?? OLD_SHOP_CATEGORY[i.shopId] ?? "gear", kind: i.kind ?? (i.arrivesInSessions ? "order" : "purchase") }));
  }
  return out;
}

/** Best guess for items made before categories (the old seed's shops). */
const OLD_SHOP_CATEGORY: Record<string, ItemCategory> = {
  general: "gear",
  smith: "gear",
  apoth: "healing",
  candle: "services",
  docks: "travel",
  town: "building",
  bg: "magic",
  training: "services",
  peddler: "magic",
};
