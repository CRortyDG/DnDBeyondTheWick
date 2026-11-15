"use client";

import { useState, type ReactNode } from "react";
import { formatCp } from "@/shared/money";
import type { PlayerView, PublicItem } from "@/shared/projection";
import type { ItemCategory } from "@/shared/types";
import { categoriesWith, cheapestFirst, type ShopMode } from "../ui/ShopBoard";
import { LockIcon } from "../ui/icons";
import { dueNow, whyNot } from "./Requests";

/**
 * The market on a phone: a compact list of goods, price on the right.
 * Tapping a row opens its parchment card in a sheet (the RequestSheet), where
 * the player asks for it. The TV and DM keep the parchment-card board.
 */
export function Market({
  view,
  shopId,
  onShop,
  mode,
  onMode,
  category,
  onCategory,
  availableFor,
  onOpen,
  footer,
}: {
  view: PlayerView;
  shopId: string;
  onShop: (id: string) => void;
  mode: ShopMode;
  onMode: (m: ShopMode) => void;
  category?: ItemCategory;
  onCategory: (c: ItemCategory) => void;
  availableFor: (it: PublicItem) => number;
  onOpen: (itemId: string) => void;
  footer?: ReactNode;
}) {
  const [q, setQ] = useState("");
  const { shops, items } = view;
  const title = view.game.town ? `${view.game.town} Market` : "The Market";
  const shopName = new Map(shops.map((s) => [s.id, s.name]));
  const mine = items.filter((i) => shopName.has(i.shopId));
  const cats = categoriesWith(mine);
  const byCategory = mode === "category" && cats.length > 0;
  const cat = cats.find((c) => c.id === category) ?? cats[0];
  const shop = shops.find((s) => s.id === shopId) ?? shops[0];
  const query = q.trim().toLowerCase();
  const searching = query.length > 0;

  const list: PublicItem[] = searching
    ? cheapestFirst(mine.filter((i) => i.tier !== "rumored" && `${i.name} ${i.description}`.toLowerCase().includes(query)))
    : byCategory
      ? cheapestFirst(mine.filter((i) => i.category === cat.id))
      : mine.filter((i) => i.shopId === shop?.id);
  const closed = !searching && !byCategory && shop && (shop.closed || shop.needs || shop.goodwill);
  const chips = byCategory ? cats.map((c) => ({ id: c.id as string, name: c.label })) : shops.map((s) => ({ id: s.id, name: s.name }));
  const current = byCategory ? cat.id : shop?.id;

  return (
    <section className="pl-market" aria-label={title}>
      <div className="pl-sec-head">
        <h2>{title}</h2>
        <span>
          {shops.length} {shops.length === 1 ? "shop" : "shops"} open
        </span>
      </div>
      <div className="pl-search">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input className="fld" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the market" aria-label="Search the market" />
      </div>
      {!searching ? (
        <div className="pl-market-bar">
          <div className="pl-seg" role="group" aria-label="Browse">
            <button type="button" aria-pressed={mode === "category"} className={mode === "category" ? "on" : undefined} onClick={() => onMode("category")}>
              What it does
            </button>
            <button type="button" aria-pressed={mode === "shop"} className={mode === "shop" ? "on" : undefined} onClick={() => onMode("shop")}>
              By storefront
            </button>
          </div>
          <div className="pl-chips" role="tablist" aria-label={byCategory ? "Categories" : "Shops"}>
            {chips.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={c.id === current}
                className={`pl-chip${c.id === current ? " on" : ""}`}
                onClick={() => (byCategory ? onCategory(c.id as ItemCategory) : onShop(c.id))}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {!searching && !byCategory && shop?.subtitle ? <p className="pl-market-sub">{shop.subtitle}</p> : null}
      {closed && shop ? (
        <div className="pl-empty">
          <LockIcon size={20} />
          <p>{shop.closed ? `${shop.name} isn’t selling yet.` : shop.needs ? `${shop.name} opens when the party is ${shop.needs}.` : `${shop.name} opens with ${shop.goodwill}.`}</p>
        </div>
      ) : list.length ? (
        <ul className="pl-items">
          {list.map((it) => (
            <li key={it.id}>
              <ItemRow it={it} where={byCategory || searching ? shopName.get(it.shopId) : undefined} why={whyNot(it, availableFor(it))}
                available={availableFor(it)} onOpen={() => onOpen(it.id)} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="pl-empty">
          <p>{searching ? `Nothing here matches “${q.trim()}”.` : "Nothing on the shelves yet."}</p>
        </div>
      )}
      {footer}
    </section>
  );
}

function ItemRow({ it, where, why, available, onOpen }: { it: PublicItem; where?: string; why: string | null; available: number; onOpen: () => void }) {
  const rumor = it.tier === "rumored";
  const earned = it.kind === "earned";
  const locked = it.tier === "locked" || !!it.needs || !!it.goodwill;
  // Things you could ask for once you have the gold: say how far off you are.
  const short = !rumor && !earned && !locked && why && why.startsWith("You have");
  const sub = rumor
    ? it.hint
      ? `“${it.hint}”`
      : "A rumor"
    : short
      ? `${formatCp(dueNow(it) - Math.max(0, available))} short`
      : locked || (why && it.tier === "sale" && !earned)
        ? why
        : [where, it.description].filter(Boolean).join(" · ");
  return (
    <button type="button" className={`pl-item${rumor ? " rumor" : ""}${locked || rumor ? " locked" : ""}${why && !rumor ? " cant" : ""}`} onClick={onOpen}>
      <span className="pl-item-ico" aria-hidden="true">
        {rumor ? "?" : locked ? <LockIcon size={18} /> : CATEGORY_GLYPH[it.category] ?? CATEGORY_GLYPH.gear}
      </span>
      <span className="pl-item-main">
        <span className="pl-item-name">
          {rumor ? "???" : it.name}
          {earned ? <span className="earned-badge">Earned</span> : null}
          {it.discountPct ? <span className="pl-item-off">{it.discountPct}% off</span> : null}
        </span>
        {sub ? <span className="pl-item-sub">{sub}</span> : null}
      </span>
      <span className="pl-item-price">
        {earned ? null : priceText(it)}
        {it.kind === "recurring" && it.priceCp !== null && !rumor ? <small>a month</small> : null}
        {it.kind === "training" && (it.installments ?? 1) > 1 && !rumor ? <small>{it.installments} lessons</small> : null}
        {it.kind === "project" && !rumor ? <small>{it.funded ? "funded" : "goal"}</small> : null}
        {it.stock === 0 && !rumor ? <small>sold out</small> : null}
      </span>
    </button>
  );
}

function priceText(it: PublicItem): string {
  if (it.tier === "rumored" || it.priceCp === null) return it.priceLabel && it.tier !== "rumored" ? it.priceLabel : "??? gp";
  return it.priceLabel ?? formatCp(it.priceCp);
}

const icon = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);

/** A small line drawing per category. */
const CATEGORY_GLYPH: Partial<Record<ItemCategory, ReactNode>> = {
  // A pack.
  gear: icon(<><path d="M6 9a6 6 0 0 1 12 0v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z" /><path d="M9 13h6M9 5V4a3 3 0 0 1 6 0v1" /></>),
  // A potion.
  healing: icon(<><path d="M9 3h6M10 3v5l-4 6a5 5 0 0 0 4 7h4a5 5 0 0 0 4-7l-4-6V3" /><path d="M8 15h8" /></>),
  // A star.
  magic: icon(<path d="M12 3l2 6 6 .5-4.6 4 1.4 6.5L12 16.6 7.2 20l1.4-6.5L4 9.5 10 9z" />),
  // A boot on a road.
  travel: icon(<><path d="M3 20h18" /><path d="M8 4h4v8l6 3v3H6z" /></>),
  // A quill.
  services: icon(<><path d="M20 4C12 4 7 9 5 19" /><path d="M20 4c0 6-4 10-11 11" /></>),
  // A house.
  building: icon(<><path d="M4 11l8-7 8 7" /><path d="M6 10v10h12V10M10 20v-6h4v6" /></>),
  // A cup.
  trophies: icon(<><path d="M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 20h8" /></>),
};
