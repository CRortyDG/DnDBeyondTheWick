"use client";

// Selling loot: offer something from your sheet to a shop. The DM names the
// final price; the gold and the item move when they approve.

import { useState } from "react";
import { formatCp, parseAmount } from "@/shared/money";
import type { PlayerView } from "@/shared/projection";
import { halfPrice } from "@/shared/requests";
import type { SheetItem } from "@/shared/sheetGear";
import { useSrdGear } from "../ui/SheetInventory";
import { Sheet } from "./Sheet";

type Send = (c: object) => Promise<string | null>;

/** Shops I could sell to now: open to me and not waiting on Renown or anyone's goodwill. */
export function sellShops(view: PlayerView) {
  return view.shops.filter((s) => !s.closed && !s.needs && !s.goodwill);
}

/** Sheet line → "2 offered to the Smithy", for pending sales. */
export function offeredLines(view: PlayerView): Record<string, string> {
  const out: Record<string, string> = {};
  for (const r of view.myRequests) {
    if (r.kind !== "sell" || r.status !== "pending" || !r.sheetItemId) continue;
    const prev = out[r.sheetItemId];
    const line = `${r.qty} offered${r.shopName ? ` to ${r.shopName}` : ""}`;
    out[r.sheetItemId] = prev ? `${prev}, ${line}` : line;
  }
  return out;
}

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** What one of these costs new: in this shop, in the shop it came from, or in the SRD list. */
function listPrice(view: PlayerView, it: SheetItem, shopId: string, srdCost: string | undefined): { cp: number; from: string } | null {
  const priced = view.items.filter((x) => x.priceCp !== null && x.priceCp > 0);
  const here = priced.find((x) => x.shopId === shopId && (x.id === it.from || sameName(x.name, it.name)));
  if (here) return { cp: here.priceCp!, from: "here" };
  const origin = priced.find((x) => x.id === it.from) ?? priced.find((x) => sameName(x.name, it.name));
  if (origin) return { cp: origin.priceCp!, from: view.shops.find((s) => s.id === origin.shopId)?.name ?? "the shop" };
  const srd = srdCost ? parseAmount(srdCost) : null;
  if (srd) return { cp: srd, from: "the rulebook" };
  return null;
}

export function SellSheet({ view, item, send, onClose, onDone }: { view: PlayerView; item: SheetItem; send: Send; onClose: () => void; onDone: (msg: string) => void }) {
  const shops = sellShops(view);
  const [shopId, setShopId] = useState(shops.length === 1 ? shops[0].id : "");
  const held = view.myRequests.filter((r) => r.kind === "sell" && r.status === "pending" && r.sheetItemId === item.id).reduce((a, r) => a + r.qty, 0);
  const free = Math.max(0, item.qty - held);
  const [qty, setQty] = useState(Math.min(1, free) || 1);
  const [ask, setAsk] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const all = useSrdGear(!!item.srd);
  const srdCost = item.srd ? all?.find((x) => x.i === item.srd)?.c : undefined;
  const list = shopId ? listPrice(view, item, shopId, srdCost) : null;
  const suggest = list ? halfPrice(list.cp) * qty : 0;
  const askCp = ask.trim() ? parseAmount(ask) : suggest;
  const shop = shops.find((s) => s.id === shopId);
  const why = !shops.length
    ? "No shop is open to you right now."
    : free <= 0
      ? "You've already offered all of these. Cancel that offer first."
      : !shopId
        ? "Pick a shop"
        : askCp === null || askCp < 0
          ? "Enter a price, like 5 or 2 gp 5 sp, or leave it blank"
          : null;

  const submit = async () => {
    if (why || askCp === null) return;
    setBusy(true);
    const e = await send({ type: "me.requestSell", sheetItemId: item.id, shopId, qty, askCp, note: note.trim() });
    setBusy(false);
    if (e) return setErr(e);
    onDone(`Offered ${qty > 1 ? `${qty} × ` : ""}${item.name} to ${shop?.name ?? "the shop"}. It stays in your pack until the DM agrees a price.`);
  };

  return (
    <Sheet label={`Sell ${item.name}`} onClose={onClose} className="pl-item-sheet">
      <h2>Sell {item.name}</h2>
      <p className="note">The shopkeeper makes the final offer (your DM). When they agree, the gold lands in your purse and the item leaves your sheet.</p>
      <div className="form">
        <label>
          To
          <select className="fld" value={shopId} onChange={(e) => setShopId(e.target.value)} style={{ width: "100%" }}>
            <option value="">Choose a shop&hellip;</option>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        {item.qty > 1 ? (
          <div className="qty" role="group" aria-label="How many">
            <button type="button" className="btn" aria-label="One fewer" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))}>
              &minus;
            </button>
            <span className="qty-n" aria-live="polite">
              {qty}
            </span>
            <button type="button" className="btn" aria-label="One more" disabled={qty >= free} onClick={() => setQty((q) => Math.min(free, q + 1))}>
              +
            </button>
            <span className="qty-total">of {free}</span>
          </div>
        ) : null}
        <label>
          Your asking price (optional)
          <input className="fld amt" inputMode="decimal" value={ask} onChange={(e) => setAsk(e.target.value)} placeholder={suggest ? formatCp(suggest) : "DM names it"} />
        </label>
        {list ? (
          <p className="note">
            New, {qty > 1 ? "these cost" : "it costs"} {formatCp(list.cp * qty)} {list.from === "here" ? "here" : `(${list.from})`}. Shops usually pay about half.
          </p>
        ) : shopId ? (
          <p className="note">Leave it blank and the DM names a price.</p>
        ) : null}
        <label>
          Note to the DM (optional)
          <input className="fld" value={note} maxLength={120} onChange={(e) => setNote(e.target.value)} placeholder="taken off the bandit chief · it's barely scratched" />
        </label>
        {why ? <p className="sheet-why">{why}</p> : null}
        {err ? (
          <p className="error-text" role="alert">
            {err}
          </p>
        ) : null}
        <button type="button" className="btn primary big" disabled={!!why || busy} onClick={submit}>
          Offer it{askCp ? ` for ${formatCp(askCp)}` : ""}
        </button>
      </div>
      <button type="button" className="btn big" onClick={onClose}>
        Close
      </button>
    </Sheet>
  );
}
