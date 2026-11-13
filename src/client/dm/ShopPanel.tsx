"use client";

import { useState } from "react";
import { canAfford, cpToGpInput, formatCp, parseAmount } from "@/shared/money";
import type { Item } from "@/shared/types";
import { ShopBoard } from "../ui/ShopBoard";
import { TvIcon } from "../ui/icons";
import { useDm } from "./context";
import { Field } from "./Field";
import { Check } from "./Check";

export function ShopPanel() {
  const { view, run } = useDm();
  const s = view.state;
  const [ownShopId, setShopId] = useState(s.live.shopId);
  // While the shop is open on the TV, this panel and the TV show the same shop.
  const shopId = s.live.shopOpen ? s.live.shopId : ownShopId;
  const [buying, setBuying] = useState<string | null>(null);
  const shop = s.shops.find((x) => x.id === shopId) ?? s.shops[0];
  const buyers = s.players.filter((p) => !p.archived);

  const actions = (it: Item) => {
    const locked = !!it.lockReason;
    return (
      <>
        {!locked && buying !== it.id ? (
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
                    if (await run({ type: "money.buy", playerId: p.id, itemId: it.id }, `${p.name} bought ${it.name}. Remind them to add it on D&D Beyond.`)) setBuying(null);
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
        <details className="dm-edit">
          <summary>Edit</summary>
          <div className="form">
            <Field label="Name" value={it.name} onCommit={(v) => run({ type: "item.update", itemId: it.id, patch: { name: v } })} />
            <Field
              label="Price"
              value={cpToGpInput(it.priceCp)}
              hint="gp, or 2 sp, or 5 gp 3 sp"
              onCommit={(v) => {
                const cp = parseAmount(v);
                if (cp === null) return false;
                void run({ type: "item.update", itemId: it.id, patch: { priceCp: cp } });
              }}
            />
            <Field label="Description" value={it.description} multiline onCommit={(v) => run({ type: "item.update", itemId: it.id, patch: { description: v } })} />
            <Field label="Locked because (blank = for sale)" value={it.lockReason} placeholder="e.g. Arrives at level 5" onCommit={(v) => run({ type: "item.update", itemId: it.id, patch: { lockReason: v } })} />
            <Check checked={it.hidePrice} onChange={(v) => run({ type: "item.update", itemId: it.id, patch: { hidePrice: v } })}>
              Hide the price while locked (??? gp)
            </Check>
            <div className="inline">
              <button
                className="btn small"
                type="button"
                onClick={() => run({ type: "item.update", itemId: it.id, patch: { lockReason: locked ? "" : "Not for sale yet" } })}
              >
                {locked ? "Unlock" : "Lock"}
              </button>
              <label className="inline-label">
                Move to
                <select className="fld" value={it.shopId} onChange={(e) => run({ type: "item.update", itemId: it.id, patch: { shopId: e.target.value } })}>
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
      </>
    );
  };

  return (
    <div className="dm-shop">
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
        ) : (
          <button className="btn primary" type="button" onClick={() => run({ type: "live.shop", open: true, shopId: shop.id }, `${shop.name} is on the TV.`)}>
            <TvIcon /> Show {shop.name} on the TV
          </button>
        )}
      </div>

      <ShopBoard
        shops={s.shops}
        items={s.items}
        shopId={shop.id}
        onShop={(id) => {
          setShopId(id);
          setBuying(null);
          if (s.live.shopOpen) void run({ type: "live.shop", open: true, shopId: id });
        }}
        size="page"
        dmPrices
        actions={actions}
      />

      <div className="panel-grid">
        <section className="box">
          <h3>This shop</h3>
          <div className="form" key={shop.id}>
            <Field label="Shop name" value={shop.name} onCommit={(v) => run({ type: "shop.update", shopId: shop.id, patch: { name: v } })} />
            <Field label="Subtitle" value={shop.subtitle} onCommit={(v) => run({ type: "shop.update", shopId: shop.id, patch: { subtitle: v } })} />
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
        <AddItem shopId={shop.id} />
        <AddShop onAdded={() => {}} />
      </div>
    </div>
  );
}

function AddItem({ shopId }: { shopId: string }) {
  const { view, run, toast } = useDm();
  const [f, setF] = useState({ shopId, name: "", price: "", description: "", lockReason: "", hidePrice: false });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });
  return (
    <section className="box">
      <h3>Add an item</h3>
      <form
        className="form"
        onSubmit={async (e) => {
          e.preventDefault();
          const cp = parseAmount(f.price || "0");
          if (!f.name.trim() || cp === null) return toast("Give the item a name and a price.");
          if (await run({ type: "item.add", item: { shopId: f.shopId, name: f.name, priceCp: cp, description: f.description, lockReason: f.lockReason, hidePrice: f.hidePrice } }, `Added ${f.name}.`)) {
            setF({ ...f, name: "", price: "", description: "", lockReason: "", hidePrice: false });
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
          Locked until (leave blank if for sale now)
          <input className="fld" value={f.lockReason} onChange={set("lockReason")} placeholder="e.g. Arrives at level 5" />
        </label>
        <label className="check">
          <input type="checkbox" checked={f.hidePrice} onChange={set("hidePrice")} /> Hide the price while locked
        </label>
        <button className="btn primary" type="submit">
          Add item
        </button>
      </form>
    </section>
  );
}

function AddShop({ onAdded }: { onAdded: () => void }) {
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
          if (await run({ type: "shop.add", name, subtitle }, `Opened ${name}.`)) {
            setName("");
            setSubtitle("");
            onAdded();
          }
        }}
      >
        <label>
          Name
          <input className="fld" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Subtitle
          <input className="fld" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="e.g. Everything smells of fish" />
        </label>
        <button className="btn" type="submit">
          Add shop
        </button>
      </form>
    </section>
  );
}
