"use client";

import type { ReactNode } from "react";
import { CATEGORIES } from "@/shared/progress";
import type { ItemCategory } from "@/shared/types";
import { ItemCard, type CardItem } from "./ItemCard";

export interface ShopLike {
  id: string;
  name: string;
  subtitle: string;
  closed?: boolean;
}

/** Browse by what things do (the default), or by storefront. */
export type ShopMode = "category" | "shop";

/** Cheapest first, so players see what they can buy now, then what to save for. Rumors and honours last. */
export function cheapestFirst<T extends CardItem>(list: T[]): T[] {
  const key = (i: T) => (i.tier === "rumored" ? 3 : i.kind === "earned" ? 2 : i.priceCp === null ? 1 : 0);
  return [...list].sort((a, b) => key(a) - key(b) || (a.priceCp ?? 0) - (b.priceCp ?? 0));
}

/** Categories that have something in them, in their usual order. */
export function categoriesWith(items: CardItem[]) {
  return CATEGORIES.filter((c) => items.some((i) => i.category === c.id));
}

/**
 * The market: tabs and parchment cards. On the TV it's read-only and follows
 * whatever the DM opened; on phones and the DM view the tabs work.
 */
export function ShopBoard<T extends CardItem>({
  shops,
  items,
  shopId,
  onShop,
  size,
  actions,
  footer,
  dm,
  tabNote,
  mode = "shop",
  onMode,
  category,
  onCategory,
}: {
  shops: ShopLike[];
  items: T[];
  shopId: string;
  onShop?: (id: string) => void;
  size: "tv" | "page";
  actions?: (item: T) => ReactNode;
  footer?: ReactNode;
  /** DM view: real names and prices, with what players see noted. */
  dm?: boolean;
  /** Small marker after a tab's name (the DM's "hidden"). */
  tabNote?: (shop: ShopLike) => string | null;
  mode?: ShopMode;
  onMode?: (m: ShopMode) => void;
  category?: ItemCategory;
  onCategory?: (c: ItemCategory) => void;
}) {
  const shop = shops.find((s) => s.id === shopId) ?? shops[0];
  if (!shop) {
    return (
      <div className={`market market-${size}`}>
        <header className="market-head">
          <h1 className="market-title">Candlefair Market</h1>
        </header>
        <p className="note">No shops are open yet.</p>
      </div>
    );
  }
  const shopName = new Map(shops.map((s) => [s.id, s.name]));
  const cats = categoriesWith(items.filter((i) => shopName.has(i.shopId)));
  const byCategory = mode === "category" && cats.length > 0;
  const cat = cats.find((c) => c.id === category) ?? cats[0];
  const list = byCategory ? cheapestFirst(items.filter((i) => i.category === cat.id && shopName.has(i.shopId))) : items.filter((i) => i.shopId === shop.id);
  const tabs = byCategory ? cats.map((c) => ({ id: c.id, name: c.label, note: null as string | null })) : shops.map((s) => ({ id: s.id, name: s.name, note: tabNote?.(s) ?? null }));
  const current = byCategory ? cat.id : shop.id;
  const pick = byCategory ? (onCategory as ((id: string) => void) | undefined) : onShop;
  return (
    <div className={`market market-${size}`}>
      <header className="market-head">
        <h1 className="market-title">{byCategory && size === "tv" ? cat.label : "Candlefair Market"}</h1>
        {!byCategory && shop.subtitle ? <p className="market-sub">{shop.subtitle}</p> : null}
      </header>
      {onMode ? (
        <div className="shop-modes" role="group" aria-label="Browse">
          <span className="note">Browse</span>
          <button type="button" className={`btn small${mode === "category" ? " on" : ""}`} aria-pressed={mode === "category"} onClick={() => onMode("category")}>
            By what it does
          </button>
          <button type="button" className={`btn small${mode === "shop" ? " on" : ""}`} aria-pressed={mode === "shop"} onClick={() => onMode("shop")}>
            By storefront
          </button>
        </div>
      ) : null}
      <div className="tabs" role={pick ? "tablist" : undefined} aria-label={byCategory ? "Categories" : "Shops"}>
        {tabs.map((t) =>
          pick ? (
            <button key={t.id} type="button" role="tab" aria-selected={t.id === current} className={`btn tab${t.id === current ? " on" : ""}`} onClick={() => pick(t.id)}>
              {t.name}
              {t.note ? <span className="tab-note">{t.note}</span> : null}
            </button>
          ) : (
            <span key={t.id} className={`tab tab-static${t.id === current ? " on" : ""}`}>
              {t.name}
            </span>
          ),
        )}
      </div>
      {!byCategory && shop.closed && !dm ? (
        <div className="shop-closed">
          <p className="shop-closed-name">{shop.name}</p>
          <p className="shop-closed-tag">{shop.subtitle}</p>
          <p className="note">Not selling yet.</p>
        </div>
      ) : (
        <div className="grid">
          {list.map((it) => (
            <ItemCard key={it.id} item={it} dm={dm} where={byCategory ? shopName.get(it.shopId) : undefined}>
              {actions?.(it)}
            </ItemCard>
          ))}
          {list.length === 0 ? <p className="note">Nothing on the shelves yet.</p> : null}
        </div>
      )}
      {footer}
    </div>
  );
}
