// Upgrades a stored game to the current shape the first time it's read.
// Safe to run on an already-current game.
import { emptyProgress, seedJobs, STINGER_SCENE } from "./seed";
import type { Beat, GameState, Item, ItemCategory, Shop } from "./types";

type Any = Record<string, unknown>;

export function upgrade(raw: unknown): GameState {
  const g = raw as Any & { schema?: number };
  if (g.schema === 2) return withJobs(withStinger(withRequests(g as unknown as GameState)));

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
  return withJobs(withStinger(withRequests({ ...(g as unknown as GameState), schema: 2, shops, items, live, orders: [], banner: null })));
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

/**
 * The animated stinger arrived after most games had saved their episodes. Once per game:
 * add "The stinger" to Scenes (just before the black screen), and a "Roll the stinger"
 * beat after each "The stinger" beat. Games without saved episodes get it from the seed.
 */
function withStinger(g: GameState): GameState {
  if (g.upgrades?.includes("stinger")) return g;
  const out: GameState = { ...g, upgrades: [...(g.upgrades ?? []), "stinger"] };
  if (!out.scenes.some((x) => x.kind === "stinger")) {
    const sc = { ...STINGER_SCENE };
    if (out.scenes.some((x) => x.id === sc.id)) sc.id = `s-stinger-${out.seq}`;
    const black = out.scenes.findIndex((x) => x.kind === "black");
    out.scenes = [...out.scenes];
    out.scenes.splice(black < 0 ? out.scenes.length : black, 0, sc);
  }
  if (out.episodes) {
    out.episodes = out.episodes.map((ep) => {
      if (ep.beats.some((b) => b.actions.some((a) => a.type === "stinger"))) return ep;
      const at = ep.beats.findIndex((b) => b.title.trim().toLowerCase() === "the stinger");
      if (at < 0) return ep;
      let id = `${ep.id}-stinger`;
      while (ep.beats.some((b) => b.id === id)) id += "x";
      const roll: Beat = {
        id,
        title: "Roll the stinger",
        notes: ["Press Next once they've opened their eyes: the TV plays the stinger (about 25 seconds, no sound) and holds on \"End of episode one\"."],
        checks: [],
        branches: [],
        actions: [{ type: "stinger" }],
      };
      const beats = [...ep.beats];
      beats.splice(at + 1, 0, roll);
      // A run already past the stinger keeps pointing at the same beat.
      out.sessions = out.sessions.map((x) =>
        x.run && x.run.episodeId === ep.id && x.run.stage !== "end" && x.run.beat > at ? { ...x, run: { ...x.run, beat: x.run.beat + 1 } } : x,
      );
      return { ...ep, beats };
    });
  }
  return out;
}

/** Starter job flyers, by the upgrade that brought them. Each set is added once per game (unpinned), so a delete sticks. */
const JOB_UPGRADES: [tag: string, ids: string[]][] = [
  ["jobs", ["j-ransom", "j-sheep", "j-envelope"]],
  ["jobs-artum", ["j-artum"]],
];

function withJobs(g: GameState): GameState {
  let out = g;
  for (const [tag, ids] of JOB_UPGRADES) {
    if (out.upgrades?.includes(tag)) continue;
    const have = new Set((out.jobs ?? []).map((j) => j.id));
    const add = seedJobs(out.createdAt ?? 0).filter((j) => ids.includes(j.id) && !have.has(j.id));
    out = { ...out, jobs: [...(out.jobs ?? []), ...add], upgrades: [...(out.upgrades ?? []), tag] };
  }
  return out;
}
