"use client";

import { useState } from "react";
import { canAfford, cpToGpInput, formatCp, parseAmount } from "@/shared/money";
import type { Item, ItemTier, Shop, ShopVisibility } from "@/shared/types";
import { ShopBoard } from "../ui/ShopBoard";
import { TvIcon } from "../ui/icons";
import { useDm } from "./context";
import { Field } from "./Field";
import { Check } from "./Check";

const TIERS: [ItemTier, string][] = [
  ["sale", "For sale"],
  ["locked", "Locked (visible, with a reason)"],
  ["rumored", "Rumored (??? and a hint)"],
  ["hidden", "Hidden (players don't see it)"],
];

const VIS_NOTE: Record<ShopVisibility, string | null> = { all: null, hidden: "hidden", some: "secret" };

export function ShopPanel() {
  const { view, run } = useDm();
  const s = view.state;
  const [ownShopId, setShopId] = useState(s.live.shopId);
  // While the shop is open on the TV, this panel and the TV show the same shop.
  const shopId = s.live.shopOpen ? s.live.shopId : ownShopId;
  const [buying, setBuying] = useState<string | null>(null);
  const [quiet, setQuiet] = useState(false);
  const shop = s.shops.find((x) => x.id === shopId) ?? s.shops[0];
  const buyers = s.players.filter((p) => !p.archived);

  const actions = (it: Item) => {
    const buyable = it.tier === "sale" && it.stock !== 0 && !s.shops.find((x) => x.id === it.shopId)?.closed;
    return (
      <>
        {buyable && buying !== it.id ? (
          <button className="btn small" type="button" onClick={() => setBuying(it.id)}>
            Buy
          </button>
        ) : null}
        {buying === it.id ? (
          <div className="buyers" role="group" aria-label={`Who's buying ${it.name}?`}>
            <span className="note">Who&rsquo;s buying?</span>
            {buyers.map((p) => {
              const ok = canAfford(p.balanceCp, it.priceCp);
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
                      : `${p.name} bought ${it.name}. Remind them to add it on D&D Beyond.`;
                    if (await run({ type: "money.buy", playerId: p.id, itemId: it.id }, msg)) setBuying(null);
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
            Put on sale
          </button>
        ) : null}
        <ItemEditor it={it} quiet={quiet} />
      </>
    );
  };

  return (
    <div className="dm-shop">
      <ShopVisibilityBox key={shop.id} shop={shop} quiet={quiet} />

      <div className="inline shop-tv-row">
        {s.live.shopOpen ? (
          <>
            <span className="note tv-follows">
              <TvIcon /> The shop is open on the TV, and it follows these tabs.
            </span>
            <button className="btn" type="button" onClick={() => run({ type: "live.shop", open: false })}>
              Close the shop on the TV
            </button>
          </>
        ) : shop.visibility === "all" ? (
          <button className="btn primary" type="button" onClick={() => run({ type: "live.shop", open: true, shopId: shop.id }, `${shop.name} is on the TV.`)}>
            <TvIcon /> Show {shop.name} on the TV
          </button>
        ) : (
          <span className="note">The TV only shows shops open to everyone.</span>
        )}
        <span className="spacer" />
        <Check checked={quiet} onChange={setQuiet}>
          Quietly (no &ldquo;New at&hellip;&rdquo; banner on the TV)
        </Check>
      </div>

      <ShopBoard
        shops={s.shops}
        items={s.items}
        shopId={shop.id}
        onShop={(id) => {
          setShopId(id);
          setBuying(null);
          const next = s.shops.find((x) => x.id === id);
          if (s.live.shopOpen && next?.visibility === "all") void run({ type: "live.shop", open: true, shopId: id });
        }}
        size="page"
        dm
        tabNote={(sh) => VIS_NOTE[(sh as Shop).visibility]}
        actions={actions}
      />

      <OrdersBox />

      <div className="panel-grid">
        <section className="box">
          <h3>This shop</h3>
          <div className="form" key={shop.id}>
            <Field label="Shop name" value={shop.name} onCommit={(v) => run({ type: "shop.update", shopId: shop.id, patch: { name: v } })} />
            <Field label="Tagline" value={shop.subtitle} onCommit={(v) => run({ type: "shop.update", shopId: shop.id, patch: { subtitle: v } })} />
            <Check checked={!!shop.closed} onChange={(v) => run({ type: "shop.update", shopId: shop.id, patch: { closed: v } })}>
              Closed: players see the name and tagline, but no goods
            </Check>
            <Check checked={!!shop.secretSales || shop.visibility === "some"} onChange={(v) => run({ type: "shop.update", shopId: shop.id, patch: { secretSales: v } })}>
              Secret sales: purchases here never show on the TV or other players&rsquo; phones{shop.visibility === "some" ? " (always, while it's for selected players)" : ""}
            </Check>
            <button
              className="btn small danger"
              type="button"
              onClick={() => {
                if (confirm(`Remove ${shop.name} and all its items?`)) void run({ type: "shop.remove", shopId: shop.id }, `Removed ${shop.name}.`);
              }}
            >
              Remove this shop
            </button>
          </div>
        </section>
        <AddItem shopId={shop.id} quiet={quiet} />
        <AddShop />
      </div>
    </div>
  );
}

/** Hidden / everyone / some players, for one shop. */
function ShopVisibilityBox({ shop, quiet }: { shop: Shop; quiet: boolean }) {
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
        <h3>{shop.name}</h3>
        <span className="note">
          {shop.visibility === "hidden" ? "Hidden: nobody but you sees this shop." : shop.visibility === "all" ? "Open to everyone, and it can go on the TV." : "Secret offer: only the players ticked below see it. Never on the TV."}
        </span>
      </div>
      <div className="inline" role="group" aria-label="Who can see this shop">
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
      <div className="checks">
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

function ItemEditor({ it, quiet }: { it: Item; quiet: boolean }) {
  const { view, run } = useDm();
  const s = view.state;
  const patch = (p: Partial<Item>) => run({ type: "item.update", itemId: it.id, patch: p, quiet });
  return (
    <details className="dm-edit">
      <summary>Edit</summary>
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
            label="Special order: arrives after (sessions)"
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
        <Field label="DM note (only you see this)" value={it.dmNote ?? ""} multiline onCommit={(v) => patch({ dmNote: v })} />
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
          <button
            className="btn small danger"
            type="button"
            onClick={() => {
              if (confirm(`Remove ${it.name} from the shop?`)) void run({ type: "item.remove", itemId: it.id }, `Removed ${it.name}.`);
            }}
          >
            Remove
          </button>
        </div>
      </div>
    </details>
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

function AddItem({ shopId, quiet }: { shopId: string; quiet: boolean }) {
  const { view, run, toast } = useDm();
  const blank = { shopId, name: "", price: "", description: "", tier: "sale" as ItemTier, reason: "", hint: "" };
  const [f, setF] = useState(blank);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <section className="box">
      <h3>Add an item</h3>
      <form
        className="form"
        onSubmit={async (e) => {
          e.preventDefault();
          const cp = parseAmount(f.price || "0");
          if (!f.name.trim() || cp === null) return toast("Give the item a name and a price.");
          const item = { shopId: f.shopId, name: f.name, priceCp: cp, description: f.description, tier: f.tier, reason: f.reason, hint: f.hint };
          if (await run({ type: "item.add", item, quiet }, `Added ${f.name}.`)) setF({ ...blank, shopId: f.shopId });
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
          <input className="fld" value={f.name} onChange={set("name")} />
        </label>
        <label>
          Price
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
        <p className="note">Stock, special orders and fine print are under Edit on the card once it&rsquo;s added.</p>
        <button className="btn primary" type="submit">
          Add item
        </button>
      </form>
    </section>
  );
}

function AddShop() {
  const { run } = useDm();
  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  return (
    <section className="box">
      <h3>Add a shop</h3>
      <form
        className="form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          if (await run({ type: "shop.add", name, subtitle }, `Added ${name}. It starts hidden.`)) {
            setName("");
            setSubtitle("");
          }
        }}
      >
        <label>
          Name
          <input className="fld" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Tagline
          <input className="fld" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="e.g. Everything smells of fish" />
        </label>
        <button className="btn" type="submit">
          Add shop (starts hidden)
        </button>
      </form>
    </section>
  );
}
