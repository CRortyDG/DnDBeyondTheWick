"use client";

import type { ReactNode } from "react";
import type { PublicItem } from "@/shared/projection";
import type { Shop } from "@/shared/types";
import { ItemCard, type CardItem } from "./ItemCard";

/**
 * The market: shop tabs and parchment cards. On the TV it's read-only and
 * follows whichever shop the DM opened; on phones and the DM view the tabs work.
 */
export function ShopBoard<T extends CardItem & { shopId: string }>({
  shops,
  items,
  shopId,
  onShop,
  size,
  actions,
  footer,
  dmPrices,
}: {
  shops: Shop[];
  items: T[] | PublicItem[];
  shopId: string;
  onShop?: (id: string) => void;
  size: "tv" | "page";
  actions?: (item: T) => ReactNode;
  footer?: ReactNode;
  dmPrices?: boolean;
}) {
  const shop = shops.find((s) => s.id === shopId) ?? shops[0];
  const list = (items as T[]).filter((i) => i.shopId === shop?.id);
  return (
    <div className={`market market-${size}`}>
      <header className="market-head">
        <h1 className="market-title">Candlefair Market</h1>
        {shop?.subtitle ? <p className="market-sub">{shop.subtitle}</p> : null}
      </header>
      <div className="tabs" role={onShop ? "tablist" : undefined} aria-label="Shops">
        {shops.map((s) =>
          onShop ? (
            <button key={s.id} type="button" role="tab" aria-selected={s.id === shop?.id} className={`btn tab${s.id === shop?.id ? " on" : ""}`} onClick={() => onShop(s.id)}>
              {s.name}
            </button>
          ) : (
            <span key={s.id} className={`tab tab-static${s.id === shop?.id ? " on" : ""}`}>
              {s.name}
            </span>
          ),
        )}
      </div>
      <div className="grid">
        {list.map((it) => (
          <ItemCard key={it.id} item={it} dmPrice={dmPrices && "hidePrice" in it && !!(it as { hidePrice?: boolean }).hidePrice && !!it.lockReason}>
            {actions?.(it)}
          </ItemCard>
        ))}
        {list.length === 0 ? <p className="note">Nothing on the shelves yet.</p> : null}
      </div>
      {footer}
    </div>
  );
}
