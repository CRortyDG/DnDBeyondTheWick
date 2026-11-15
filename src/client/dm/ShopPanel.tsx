"use client";
import { townOf } from "@/shared/presets";

import { TrustSelect } from "./TrustSelect";
import { useEffect, useState } from "react";
import { canAfford, cpToGpInput, formatCp, parseAmount } from "@/shared/money";
import type { Item, ItemTier, Shop, ShopVisibility } from "@/shared/types";
import { ShopBoard } from "../ui/ShopBoard";
import { TvIcon } from "../ui/icons";
import { useDm } from "./context";
import { rankName, ranksOf, tierOf } from "@/shared/renown";
import { Field } from "./Field";
import { Check } from "./Check";
import { ContributeBox, GrantBox, KindFields, RunningBox } from "./ItemExtras";
import { categoryLabel, categoriesFor, creditCp, firstChargeCp, KINDS, raisedCp } from "@/shared/progress";
import { PageHead } from "./PageHead";
import { Drawer } from "./Drawer";
import { MenuItem, RowMenu } from "./RowMenu";
import { GearIcon, PlusIcon } from "./navIcons";
import type { ShopMode } from "../ui/ShopBoard";
import type { ItemCategory, ItemKind } from "@/shared/types";

const TIERS: [ItemTier, string][] = [
  ["sale", "For sale"],
  ["locked", "Locked (visible, with a reason)"],
  ["rumored", "Rumored (??? and a hint)"],
  ["hidden", "Hidden (players don't see it)"],
];

const VIS_NOTE: Record<ShopVisibility, string | null> = { all: null, hidden: "hidden", some: "secret" };

const KIND_SHORT: Record<ItemKind, string> = { purchase: "", recurring: "per month", service: "service", order: "special order", training: "training", project: "project", earned: "earned" };
const TIER_TAG: Record<ItemTier, string> = { sale: "for sale", locked: "locked", rumored: "rumored", hidden: "hidden" };
const VIS_LABEL: Record<ShopVisibility, string> = { all: "open", hidden: "hidden", some: "secret" };

export function ShopPanel() {
  const { view, run } = useDm();
  const s = view.state;
  const [ownShopId, setShopId] = useState(s.live.shopId);
  // While the shop is open on the TV, this panel and the TV show the same shop.
  const shopId = s.live.shopOpen ? s.live.shopId : ownShopId;
  const [buying, setBuying] = useState<string | null>(null);
  const [quiet, setQuiet] = useState(false);
  const [mode, setMode] = useState<ShopMode>("shop");
  const [category, setCategory] = useState<ItemCategory | undefined>(undefined);
  const [preview, setPreview] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<null | "item" | "shop" | "settings">(null);
  // After adding a shop, jump to it once it arrives.
  const [newShop, setNewShop] = useState<{ name: string; known: Set<string> } | null>(null);
  useEffect(() => {
    if (!newShop) return;
    const made = s.shops.find((x) => !newShop.known.has(x.id) && x.name === newShop.name) ?? s.shops.find((x) => !newShop.known.has(x.id));
    if (made) {
      setShopId(made.id);
      setNewShop(null);
    }
  }, [newShop, s.shops]);
  // What the cards show the DM: progress on projects and who has earned what.
  const cards = s.items.map((i) => ({
    ...i,
    ...(i.renown ? { renownName: rankName(i.renown, s) } : {}),
    ...(i.kind === "project" ? { raisedCp: raisedCp(s, i.id), funded: !!s.effectsOn[i.id] } : {}),
    ...(i.kind === "earned" ? { earnedBy: s.players.filter((p) => s.awards.some((a) => a.itemId === i.id && a.playerIds.includes(p.id))).map((p) => p.name) } : {}),
  }));
  const shop = s.shops.find((x) => x.id === shopId) ?? s.shops[0];
  const buyers = s.players.filter((p) => !p.archived);
  const editingItem = s.items.find((x) => x.id === editing);

  const pickShop = (id: string) => {
    setShopId(id);
    setBuying(null);
    const next = s.shops.find((x) => x.id === id);
    if (s.live.shopOpen && next?.visibility === "all") void run({ type: "live.shop", open: true, shopId: id });
  };

  const actions = (it: Item, compact = false) => {
    const buyable = tierOf(s, it) === "sale" && it.stock !== 0 && !s.shops.find((x) => x.id === it.shopId)?.closed && !(it.kind === "project" && s.effectsOn[it.id]);
    const cost = firstChargeCp(s, it);
    return (
      <>
        {buyable && buying !== it.id && it.kind !== "earned" ? (
          <button className="btn small" type="button" onClick={() => setBuying(it.id)}>
            {it.kind === "project" ? "Put gold in" : it.kind === "recurring" ? "Rent" : it.kind === "training" ? "Enroll" : "Buy"}
          </button>
        ) : null}
        {it.kind === "earned" && buying !== it.id ? (
          <button className="btn small" type="button" onClick={() => setBuying(it.id)}>
            Grant
          </button>
        ) : null}
        {buying === it.id && it.kind === "earned" ? <GrantBox it={it} onDone={() => setBuying(null)} /> : null}
        {buying === it.id && it.kind === "project" ? <ContributeBox it={it} onDone={() => setBuying(null)} /> : null}
        {buying === it.id && it.kind !== "earned" && it.kind !== "project" ? (
          <div className="buyers" role="group" aria-label={`Who's buying ${it.name}?`}>
            <span className="note">Who&rsquo;s buying?</span>
            {buyers.map((p) => {
              const ok = canAfford(p.balanceCp + creditCp(s, p.id, it.shopId), cost);
              return (
                <button
                  key={p.id}
                  className="btn small primary"
                  type="button"
                  disabled={!ok}
                  title={ok ? undefined : `${p.name} has ${formatCp(p.balanceCp)}`}
                  onClick={async () => {
                    const msg = it.arrivesInSessions
                      ? `${p.name} ordered ${it.name}. It arrives in ${it.arrivesInSessions} sessions.`
                      : it.kind === "recurring"
                        ? `${p.name} rents ${it.name}. Rent is due at the end of each session.`
                        : it.kind === "training"
                          ? `${p.name} started ${it.name}. One lesson is charged at the end of each session.`
                          : `${p.name} bought ${it.name}. Remind them to add it on D&D Beyond.`;
                    let question: string | undefined;
                    if (it.prompt) {
                      question = window.prompt(it.prompt)?.trim();
                      if (!question) return;
                    }
                    if (await run({ type: "money.buy", playerId: p.id, itemId: it.id, ...(question ? { question } : {}) }, msg)) setBuying(null);
                  }}
                >
                  {p.name}
                </button>
              );
            })}
            <button className="btn small" type="button" onClick={() => setBuying(null)}>
              Cancel
            </button>
          </div>
        ) : null}
        {it.tier !== "sale" ? (
          <button className="btn small" type="button" onClick={() => run({ type: "item.update", itemId: it.id, patch: { tier: "sale" }, quiet }, quiet ? `${it.name} is for sale (quietly).` : `${it.name} is for sale.`)}>
            {it.tier === "locked" ? "Unlock" : "Put on sale"}
          </button>
        ) : null}
        {compact ? null : (
          <button className="btn small ghost" type="button" onClick={() => setEditing(it.id)}>
            Edit
          </button>
        )}
      </>
    );
  };

  const openCount = s.shops.filter((x) => x.visibility !== "hidden").length;
  const forSale = s.items.filter((i) => tierOf(s, i) === "sale").length;
  const onTheWay = s.orders.filter((o) => !o.arrived).length;

  const head = (
    <PageHead
      title="Shop"
      sub="Storefronts, their goods, and who can see them."
      help={
        <>
          <p>A new shop starts hidden. Open it to everyone to put it on phones (and on the TV with the button up here), or to a few players as a secret offer that never reaches the TV.</p>
          <p>Items can be for sale, locked (visible, with a reason), rumored (??? and a hint) or hidden. Renown and trust gates lock an item until the party earns them. Tick Quietly to skip the &ldquo;New at&hellip;&rdquo; banner on the TV.</p>
        </>
      }
      actions={
        <>
          <button className="btn" type="button" onClick={() => setDrawer("shop")}>
            <PlusIcon size={16} /> Shop
          </button>
          {shop ? (
            <button className="btn" type="button" onClick={() => setDrawer("item")}>
              <PlusIcon size={16} /> Item
            </button>
          ) : null}
          {s.live.shopOpen ? (
            <button className="btn primary" type="button" onClick={() => run({ type: "live.shop", open: false })}>
              <TvIcon /> Close on the TV
            </button>
          ) : shop && shop.visibility === "all" ? (
            <button className="btn primary" type="button" onClick={() => run({ type: "live.shop", open: true, shopId: shop.id }, `${shop.name} is on the TV.`)}>
              <TvIcon /> Show on the TV
            </button>
          ) : null}
        </>
      }
      stats={[
        { label: "Open shops", value: `${openCount} of ${s.shops.length}`, tone: openCount ? "ok" : "muted" },
        { label: "For sale", value: forSale, tone: "gold" },
        ...(onTheWay ? [{ label: "Orders on the way", value: onTheWay }] : []),
        ...(s.live.shopOpen ? [{ label: "On the TV", value: s.shops.find((x) => x.id === s.live.shopId)?.name ?? "Shop", tone: "gold" as const }] : []),
      ]}
    />
  );

  const drawers = (
    <>
      {drawer === "item" && shop ? (
        <Drawer title="New item" subtitle={`In ${shop.name}`} onClose={() => setDrawer(null)} closeLabel="Cancel">
          <AddItem shopId={shop.id} quiet={quiet} onAdded={() => setDrawer(null)} />
        </Drawer>
      ) : null}
      {drawer === "shop" ? (
        <Drawer title="New shop" subtitle="It starts hidden" onClose={() => setDrawer(null)} closeLabel="Cancel">
          <AddShop
            onAdded={(name) => {
              setDrawer(null);
              setNewShop({ name, known: new Set(s.shops.map((x) => x.id)) });
            }}
          />
        </Drawer>
      ) : null}
      {drawer === "settings" && shop ? (
        <Drawer title={shop.name} subtitle="Shop settings" onClose={() => setDrawer(null)}>
          <ShopSettings shop={shop} onRemoved={() => setDrawer(null)} />
        </Drawer>
      ) : null}
      {editingItem ? (
        <Drawer title={editingItem.name} subtitle={`${formatCp(editingItem.priceCp)} · ${TIER_TAG[editingItem.tier]}`} onClose={() => setEditing(null)} wide>
          <ItemEditor it={editingItem} quiet={quiet} onRemoved={() => setEditing(null)} />
        </Drawer>
      ) : null}
    </>
  );

  if (!shop) {
    // A blank campaign (or every shop removed): start with one.
    return (
      <div className="dm-shop pg">
        {head}
        <div className="pg-empty-card">
          <p>No shops yet. Add one; it starts hidden, so players only see it once you open it to them.</p>
          <button className="btn primary" type="button" onClick={() => setDrawer("shop")}>
            <PlusIcon size={16} /> Add a shop
          </button>
        </div>
        {drawers}
      </div>
    );
  }

  const items = s.items.filter((i) => i.shopId === shop.id);

  return (
    <div className="dm-shop pg">
      {head}
      <div className="shop-layout">
        <nav className="shop-fronts" aria-label="Storefronts">
          {s.shops.map((sh) => {
            const n = s.items.filter((i) => i.shopId === sh.id).length;
            const onTv = s.live.shopOpen && s.live.shopId === sh.id;
            return (
              <button key={sh.id} type="button" className={`shop-front${sh.id === shop.id ? " on" : ""}`} aria-current={sh.id === shop.id ? "true" : undefined} onClick={() => pickShop(sh.id)}>
                <span className="shop-front-name">{sh.name}</span>
                <span className="shop-front-meta">
                  <span className={`vis-dot vis-${sh.visibility}`} aria-hidden="true" />
                  {VIS_LABEL[sh.visibility]}
                  {sh.closed ? " · closed" : ""} · {n} {n === 1 ? "item" : "items"}
                  {onTv ? <span className="tag on-tv">TV</span> : null}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="shop-main">
          <ShopVisibilityBox key={shop.id} shop={shop} quiet={quiet} onSettings={() => setDrawer("settings")} />

          <div className="pg-toolbar">
            <div className="seg" role="group" aria-label="View">
              <button type="button" className={`btn small${preview ? "" : " on"}`} aria-pressed={!preview} onClick={() => setPreview(false)}>
                List
              </button>
              <button type="button" className={`btn small${preview ? " on" : ""}`} aria-pressed={preview} onClick={() => setPreview(true)}>
                As players see it
              </button>
            </div>
            <span className="grow" />
            <Check checked={quiet} onChange={setQuiet}>
              Quietly (no &ldquo;New at&hellip;&rdquo; banner on the TV)
            </Check>
          </div>

          {preview ? (
            <ShopBoard town={townOf(s)} shops={s.shops} items={cards} shopId={shop.id} mode={mode} onMode={setMode} category={category} onCategory={setCategory} onShop={pickShop} size="page" dm tabNote={(sh) => VIS_NOTE[(sh as Shop).visibility]} actions={(it) => actions(it)} />
          ) : (
            <ol className="scene-list pg-list shop-items">
              {items.map((it) => {
                const eff = tierOf(s, it);
                const card = cards.find((c) => c.id === it.id) as (typeof cards)[number] & { raisedCp?: number; earnedBy?: string[] };
                const bits = [categoryLabel(it.category, townOf(s)), KIND_SHORT[it.kind], it.stock !== null ? (it.stock === 0 ? "sold out" : `${it.stock} left`) : "", it.description].filter(Boolean);
                return (
                  <li key={it.id} className={`scene-item list-row item-row tier-${eff}${editing === it.id ? " selected" : ""}`}>
                    <div className="scene-row">
                      <button type="button" className="row-main" onClick={() => setEditing(it.id)} title={`Edit ${it.name}`}>
                        <span className="row-title">{it.name}</span>
                        <span className="row-sub">{bits.join(" · ")}</span>
                      </button>
                      <span className="row-meta">
                        {eff !== it.tier ? <span className="tag">gated</span> : null}
                        <span className={`tag tier-tag tier-${eff}`}>{TIER_TAG[eff]}</span>
                        {it.kind === "project" ? <span className="tag">{formatCp(card.raisedCp ?? 0)} raised</span> : null}
                        {it.kind === "earned" && card.earnedBy?.length ? <span className="tag">{card.earnedBy.length} earned</span> : null}
                        <span className="pg-money">{it.priceLabel || formatCp(it.priceCp)}</span>
                      </span>
                      <span className="item-actions">{actions(it, true)}</span>
                      <RowMenu label={it.name}>
                        <MenuItem onClick={() => setEditing(it.id)}>Edit</MenuItem>
                        {(["sale", "locked", "rumored", "hidden"] as ItemTier[])
                          .filter((t) => t !== it.tier)
                          .map((t) => (
                            <MenuItem key={t} onClick={() => run({ type: "item.update", itemId: it.id, patch: { tier: t }, quiet })}>
                              Make it {TIER_TAG[t]}
                            </MenuItem>
                          ))}
                      </RowMenu>
                    </div>
                  </li>
                );
              })}
              {items.length === 0 ? (
                <li className="pg-empty">
                  Nothing in {shop.name} yet.{" "}
                  <button className="linkish" type="button" onClick={() => setDrawer("item")}>
                    Add the first item
                  </button>
                </li>
              ) : null}
            </ol>
          )}

          <OrdersBox />
          <RunningBox />
        </div>
      </div>
      {drawers}
    </div>
  );
}

/** Name, tagline, gates and removal for one shop. */
function ShopSettings({ shop, onRemoved }: { shop: Shop; onRemoved: () => void }) {
  const { view, run } = useDm();
  const s = view.state;
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <div className="form" key={shop.id}>
        <Field label="Shop name" value={shop.name} onCommit={(v) => run({ type: "shop.update", shopId: shop.id, patch: { name: v } })} />
        <Field label="Tagline" value={shop.subtitle} onCommit={(v) => run({ type: "shop.update", shopId: shop.id, patch: { subtitle: v } })} />
        <Check checked={!!shop.closed} onChange={(v) => run({ type: "shop.update", shopId: shop.id, patch: { closed: v } })}>
          Closed: players see the name and tagline, but no goods
        </Check>
        <Check checked={!!shop.secretSales || shop.visibility === "some"} onChange={(v) => run({ type: "shop.update", shopId: shop.id, patch: { secretSales: v } })}>
          Secret sales: purchases here never show on the TV or other players&rsquo; phones{shop.visibility === "some" ? " (always, while it's for selected players)" : ""}
        </Check>
        <label>
          Needs Renown (until then: name and rank only, no goods)
          <select className="fld" value={shop.renown ?? 0} onChange={(e) => run({ type: "shop.update", shopId: shop.id, patch: { renown: Number(e.target.value) } })}>
            {ranksOf(s).map((r, i) => (
              <option key={r.name} value={i}>
                {i === 0 ? "No Renown needed" : r.name}
              </option>
            ))}
          </select>
        </label>
        <TrustSelect value={shop.trust} onChange={(trust) => void run({ type: "shop.update", shopId: shop.id, patch: { trust } })} />
      </div>
      <section className="box danger-zone">
        <h3>{shop.name}</h3>
        <div className="inline">
          {confirming ? (
            <>
              <button className="btn small" type="button" onClick={() => setConfirming(false)}>
                Keep it
              </button>
              <button
                className="btn small danger"
                type="button"
                onClick={async () => {
                  if (await run({ type: "shop.remove", shopId: shop.id }, `Removed ${shop.name}.`)) onRemoved();
                }}
              >
                Remove {shop.name}, its items and its Discover entry
              </button>
            </>
          ) : (
            <button className="btn small danger" type="button" onClick={() => setConfirming(true)}>
              Remove this shop
            </button>
          )}
        </div>
      </section>
    </>
  );
}

/** Hidden / everyone / some players, for one shop. */
function ShopVisibilityBox({ shop, quiet, onSettings }: { shop: Shop; quiet: boolean; onSettings: () => void }) {
  const { view, run, toast } = useDm();
  const players = view.state.players.filter((p) => !p.archived);
  const [picked, setPicked] = useState<string[]>(shop.playerIds);
  const set = (visibility: ShopVisibility, ids = picked) =>
    run(
      { type: "shop.visibility", shopId: shop.id, visibility, playerIds: ids, quiet },
      visibility === "all" ? `${shop.name} is open to everyone${quiet ? " (quietly)" : ""}.` : visibility === "hidden" ? `${shop.name} is hidden.` : `${shop.name} is open to ${ids.length} ${ids.length === 1 ? "player" : "players"} only.`,
    );
  return (
    <section className={`box vis-box vis-${shop.visibility}`} aria-label={`Who can see ${shop.name}`}>
      <div className="box-head">
        <div>
          <h3>{shop.name}</h3>
          {shop.subtitle ? <p className="vis-tagline">{shop.subtitle}</p> : null}
        </div>
        <button className="btn small" type="button" onClick={onSettings}>
          <GearIcon size={14} /> Shop settings
        </button>
      </div>
      <div className="vis-row">
      <span className="vis-label">Who can see it</span>
      <div className="seg" role="group" aria-label="Who can see this shop">
        <button type="button" className={`btn small${shop.visibility === "hidden" ? " on" : ""}`} aria-pressed={shop.visibility === "hidden"} onClick={() => set("hidden")}>
          Hidden
        </button>
        <button type="button" className={`btn small${shop.visibility === "all" ? " on" : ""}`} aria-pressed={shop.visibility === "all"} onClick={() => set("all")}>
          Everyone
        </button>
        <button
          type="button"
          className={`btn small${shop.visibility === "some" ? " on" : ""}`}
          aria-pressed={shop.visibility === "some"}
          onClick={() => (picked.length ? set("some") : toast("Tick the players who should see it first."))}
        >
          Selected players
        </button>
      </div>
        <span className="note">
          {shop.visibility === "hidden" ? "Nobody but you sees this shop." : shop.visibility === "all" ? "Open to everyone, and it can go on the TV." : "Secret offer: only the ticked players see it. Never on the TV."}
          {shop.closed ? " Closed for now." : ""}
        </span>
      </div>
      <div className={`checks vis-players${shop.visibility === "some" ? "" : " dim"}`}>
        {players.map((p) => (
          <label className="check" key={p.id}>
            <input
              type="checkbox"
              checked={picked.includes(p.id)}
              onChange={(e) => {
                const ids = e.target.checked ? [...picked, p.id] : picked.filter((x) => x !== p.id);
                setPicked(ids);
                if (shop.visibility === "some" && ids.length) void set("some", ids);
              }}
            />
            {p.name}
          </label>
        ))}
      </div>
    </section>
  );
}

function ItemEditor({ it, quiet, onRemoved }: { it: Item; quiet: boolean; onRemoved: () => void }) {
  const { view, run } = useDm();
  const [confirming, setConfirming] = useState(false);
  const s = view.state;
  const patch = (p: Partial<Item>) => run({ type: "item.update", itemId: it.id, patch: p, quiet });
  return (
    <div className="item-editor">
      <div className="form">
        <label>
          Shown as
          <select className="fld" value={it.tier} onChange={(e) => patch({ tier: e.target.value as ItemTier })}>
            {TIERS.map(([t, l]) => (
              <option key={t} value={t}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label>
          Needs Renown
          <select className="fld" value={it.renown ?? 0} onChange={(e) => patch({ renown: Number(e.target.value) })}>
            {ranksOf(s).map((r, i) => (
              <option key={r.name} value={i}>
                {i === 0 ? "No Renown needed" : r.name}
              </option>
            ))}
          </select>
        </label>
        <TrustSelect value={it.trust} onChange={(trust) => void patch({ trust })} />
        {(it.renown || it.trust) && it.tier === "sale" ? <Field label="Line under the rank (optional)" value={it.reason} placeholder="e.g. Mags only rents it to people she trusts." onCommit={(v) => patch({ reason: v })} /> : null}
        <Field label="Name" value={it.name} onCommit={(v) => patch({ name: v })} />
        <Field
          label="Price"
          value={cpToGpInput(it.priceCp)}
          hint="gp, or 2 sp, or 5 gp 3 sp"
          onCommit={(v) => {
            const cp = parseAmount(v);
            if (cp === null) return false;
            void patch({ priceCp: cp });
          }}
        />
        <Field label="Description" value={it.description} multiline onCommit={(v) => patch({ description: v })} />
        {it.tier === "locked" ? (
          <>
            <Field label="Locked because" value={it.reason} placeholder="e.g. The smith needs iron from Orlumbor" onCommit={(v) => patch({ reason: v })} />
            <Check checked={it.hidePrice} onChange={(v) => patch({ hidePrice: v })}>
              Hide the price (??? gp)
            </Check>
          </>
        ) : null}
        {it.tier === "rumored" ? <Field label="The rumor (one line)" value={it.hint} placeholder="e.g. They say you can still hear her singing." onCommit={(v) => patch({ hint: v })} /> : null}
        <div className="inline">
          <Field
            label="Stock (blank = no limit)"
            value={it.stock === null ? "" : String(it.stock)}
            type="number"
            onCommit={(v) => {
              if (v.trim() === "") return void patch({ stock: null });
              const n = Number(v);
              if (!Number.isInteger(n) || n < 0) return false;
              void patch({ stock: n });
            }}
          />
          <Field label="When sold out" value={it.restockNote} placeholder="e.g. Restocks next tenday" onCommit={(v) => patch({ restockNote: v })} />
        </div>
        <div className="inline">
          <Field
            label={it.kind === "order" ? "Special order: arrives after (sessions)" : "Special order: arrives after (sessions; blank = not an order)"}
            value={it.arrivesInSessions ? String(it.arrivesInSessions) : ""}
            type="number"
            onCommit={(v) => {
              const n = v.trim() === "" ? 0 : Number(v);
              if (!Number.isInteger(n) || n < 0) return false;
              void patch({ arrivesInSessions: n });
            }}
          />
          <Field label="Price shown as" value={it.priceLabel ?? ""} placeholder="e.g. Free*" onCommit={(v) => patch({ priceLabel: v })} />
        </div>
        <Check checked={!it.oneAtATime && !it.arrivesInSessions} onChange={(v) => patch({ oneAtATime: !v })}>
          Players can ask for several at once{it.arrivesInSessions ? " (special orders are one at a time)" : ""}
        </Check>
        <Field label="Fine print" value={it.finePrint ?? ""} placeholder="e.g. *Payment will be collected later." onCommit={(v) => patch({ finePrint: v })} />
        <KindFields it={it} patch={patch} />
        <Field label="DM note (only you see this)" value={it.dmNote ?? ""} multiline placeholder="e.g. Fennick becomes an ally" onCommit={(v) => patch({ dmNote: v })} />
        <div className="inline">
          <label className="inline-label">
            Move to
            <select className="fld" value={it.shopId} onChange={(e) => patch({ shopId: e.target.value })}>
              {s.shops.map((sh) => (
                <option key={sh.id} value={sh.id}>
                  {sh.name}
                </option>
              ))}
            </select>
          </label>
          <span className="grow" />
          {confirming ? (
            <>
              <button className="btn small" type="button" onClick={() => setConfirming(false)}>
                Keep it
              </button>
              <button
                className="btn small danger"
                type="button"
                onClick={async () => {
                  if (await run({ type: "item.remove", itemId: it.id }, `Removed ${it.name}.`)) onRemoved();
                }}
              >
                Remove {it.name}
              </button>
            </>
          ) : (
            <button className="btn small danger" type="button" onClick={() => setConfirming(true)}>
              Remove item
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Special orders on their way up the coast. */
function OrdersBox() {
  const { view, run } = useDm();
  const s = view.state;
  const pending = s.orders.filter((o) => !o.arrived);
  if (!s.orders.length) return null;
  const name = (id: string) => s.players.find((p) => p.id === id)?.name ?? "someone who left";
  return (
    <section className="box">
      <h3>Special orders</h3>
      {pending.length === 0 ? <p className="note">Nothing on its way. Arrived orders: {s.orders.length}.</p> : null}
      <ul className="orders">
        {pending.map((o) => (
          <li key={o.id}>
            <span>
              <b>{o.itemName}</b> for {name(o.playerId)} &middot; arrives at session {o.arrivesAtSession}
            </span>
            <span className="inline">
              <button className="btn small primary" type="button" onClick={() => run({ type: "order.arrive", orderId: o.id }, `${o.itemName} has arrived.`)}>
                It&rsquo;s here
              </button>
              <button
                className="btn small"
                type="button"
                onClick={() => {
                  if (confirm(`Cancel ${o.itemName} and refund ${formatCp(o.priceCp)} to ${name(o.playerId)}?`)) void run({ type: "order.cancel", orderId: o.id, refund: true }, "Order cancelled and refunded.");
                }}
              >
                Cancel and refund
              </button>
            </span>
          </li>
        ))}
      </ul>
      <p className="note">Orders arrive by themselves when their session starts. The TV says so.</p>
    </section>
  );
}

function AddItem({ shopId, quiet, onAdded }: { shopId: string; quiet: boolean; onAdded: () => void }) {
  const { view, run, toast } = useDm();
  const blank = { shopId, name: "", price: "", description: "", tier: "sale" as ItemTier, reason: "", hint: "", category: "gear" as ItemCategory, kind: "purchase" as ItemKind };
  const [f, setF] = useState(blank);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form
        className="form"
        onSubmit={async (e) => {
          e.preventDefault();
          const cp = parseAmount(f.price || "0");
          if (!f.name.trim() || cp === null) return toast("Give the item a name and a price.");
          const item = { shopId: f.shopId, name: f.name, priceCp: cp, description: f.description, tier: f.tier, reason: f.reason, hint: f.hint, category: f.category, kind: f.kind };
          if (await run({ type: "item.add", item, quiet }, `Added ${f.name}.`)) {
            setF({ ...blank, shopId: f.shopId });
            onAdded();
          }
        }}
      >
        <label>
          Shop
          <select className="fld" value={f.shopId} onChange={set("shopId")}>
            {view.state.shops.map((sh) => (
              <option key={sh.id} value={sh.id}>
                {sh.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Name
          <input className="fld" autoFocus value={f.name} onChange={set("name")} />
        </label>
        <label>
          Category
          <select className="fld" value={f.category} onChange={set("category")}>
            {categoriesFor(townOf(view.state)).map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Type
          <select className="fld" value={f.kind} onChange={set("kind")}>
            {KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          {f.kind === "project" ? "Goal" : f.kind === "recurring" ? "Price per month" : f.kind === "training" ? "Total price" : "Price"}
          <input className="fld" value={f.price} onChange={set("price")} inputMode="decimal" placeholder="gp, or 5 gp 3 sp" />
        </label>
        <label>
          Description
          <input className="fld" value={f.description} onChange={set("description")} />
        </label>
        <label>
          Shown as
          <select className="fld" value={f.tier} onChange={set("tier")}>
            {TIERS.map(([t, l]) => (
              <option key={t} value={t}>
                {l}
              </option>
            ))}
          </select>
        </label>
        {f.tier === "locked" ? (
          <label>
            Locked because
            <input className="fld" value={f.reason} onChange={set("reason")} placeholder="e.g. Arrives at level 5" />
          </label>
        ) : null}
        {f.tier === "rumored" ? (
          <label>
            The rumor
            <input className="fld" value={f.hint} onChange={set("hint")} placeholder="e.g. Someone in town has been watching you." />
          </label>
        ) : null}
        <p className="note">Stock, lessons, effects and fine print are under Edit once it&rsquo;s added.</p>
        <button className="btn primary" type="submit">
          Add item
        </button>
      </form>
  );
}

function AddShop({ onAdded }: { onAdded: (name: string) => void }) {
  const { run } = useDm();
  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  return (
    <form
        className="form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          if (await run({ type: "shop.add", name, subtitle }, `Added ${name}. It starts hidden.`)) {
            onAdded(name.trim());
            setName("");
            setSubtitle("");
          }
        }}
      >
        <label>
          Name
          <input className="fld" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Tagline
          <input className="fld" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="e.g. Everything smells of fish" />
        </label>
        <button className="btn" type="submit">
          Add shop (starts hidden)
        </button>
      </form>
  );
}
