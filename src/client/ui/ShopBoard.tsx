"use client";

import type { ReactNode } from "react";
import { ItemCard, type CardItem } from "./ItemCard";

export interface ShopLike {
  id: string;
  name: string;
  subtitle: string;
  closed?: boolean;
}

/**
 * The market: shop tabs and parchment cards. On the TV it's read-only and
 * follows whichever shop the DM opened; on phones and the DM view the tabs work.
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
}) {
  const shop = shops.find((s) => s.id === shopId) ?? shops[0];
  const list = items.filter((i) => i.shopId === shop?.id);
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
  return (
    <div className={`market market-${size}`}>
      <header className="market-head">
        <h1 className="market-title">Candlefair Market</h1>
        {shop.subtitle ? <p className="market-sub">{shop.subtitle}</p> : null}
      </header>
      <div className="tabs" role={onShop ? "tablist" : undefined} aria-label="Shops">
        {shops.map((s) => {
          const note = tabNote?.(s);
          return onShop ? (
            <button key={s.id} type="button" role="tab" aria-selected={s.id === shop.id} className={`btn tab${s.id === shop.id ? " on" : ""}`} onClick={() => onShop(s.id)}>
              {s.name}
              {note ? <span className="tab-note">{note}</span> : null}
            </button>
          ) : (
            <span key={s.id} className={`tab tab-static${s.id === shop.id ? " on" : ""}`}>
              {s.name}
            </span>
          );
        })}
      </div>
      {shop.closed && !dm ? (
        <div className="shop-closed">
          <p className="shop-closed-name">{shop.name}</p>
          <p className="shop-closed-tag">{shop.subtitle}</p>
          <p className="note">Not selling yet.</p>
        </div>
      ) : (
        <div className="grid">
          {list.map((it) => (
            <ItemCard key={it.id} item={it} dm={dm}>
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
