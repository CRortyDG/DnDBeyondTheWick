import type { ReactNode } from "react";
import { formatCp } from "@/shared/money";
import { LockIcon } from "./icons";

/**
 * What a card needs. A player's or the TV's item (rumored ones arrive as
 * "???"), or the DM's full item, which also has hidePrice.
 */
export interface CardItem {
  id: string;
  shopId: string;
  name: string;
  priceCp: number | null;
  priceLabel?: string;
  description: string;
  tier: "sale" | "locked" | "rumored" | "hidden";
  reason?: string;
  hint?: string;
  hidePrice?: boolean;
  stock: number | null;
  restockNote?: string;
  finePrint?: string;
  arrivesInSessions?: number;
}

const TIER_LABEL = { sale: "For sale", locked: "Locked", rumored: "Rumored", hidden: "Hidden" } as const;

/** A shop item pinned to the board. Locked and rumored goods look like they're behind glass. */
export function ItemCard({ item, children, dm }: { item: CardItem; children?: ReactNode; dm?: boolean }) {
  const { tier } = item;
  const soldOut = item.stock === 0;
  // The DM always sees the real thing; players see what the server sent them.
  const showPriceAsUnknown = !dm && (item.priceCp === null || tier === "rumored");
  const priceText = item.priceLabel && tier !== "rumored" ? item.priceLabel : showPriceAsUnknown ? "??? gp" : formatCp(item.priceCp ?? 0);
  const playersSee = dm && (tier === "rumored" ? "players see ??? and the hint" : tier === "locked" && item.hidePrice ? "players see ??? gp" : tier === "hidden" ? "players don't see this" : null);

  return (
    <article className={`card tier-${tier}${tier !== "sale" ? " locked" : ""}${soldOut ? " sold-out" : ""}`} aria-label={tier === "rumored" && !dm ? "A rumor" : item.name}>
      <div className="card-pin" aria-hidden="true" />
      {dm ? <span className={`tier-badge tier-badge-${tier}`}>{TIER_LABEL[tier]}</span> : null}
      <h3 className="card-name">{tier === "rumored" && !dm ? "???" : item.name}</h3>
      <div className="card-price">
        {priceText}
        {playersSee ? <span className="card-dmprice"> ({playersSee})</span> : null}
      </div>
      {item.description && (tier !== "rumored" || dm) ? <p className="card-desc">{item.description}</p> : null}
      {tier === "rumored" && item.hint ? <p className="card-hint">&ldquo;{item.hint}&rdquo;</p> : null}
      {tier === "locked" ? (
        <p className="card-lock">
          <LockIcon size={18} /> <span>{item.reason || "Not for sale yet"}</span>
        </p>
      ) : null}
      {item.arrivesInSessions && tier !== "rumored" ? (
        <p className="card-order">Special order: arrives {item.arrivesInSessions === 1 ? "next session" : `${item.arrivesInSessions} sessions after you buy`}</p>
      ) : null}
      {item.stock !== null && tier !== "rumored" ? (
        <p className="card-stock">{soldOut ? `Sold out${item.restockNote ? `. ${item.restockNote}` : ""}` : `${item.stock} in stock`}</p>
      ) : null}
      {item.finePrint && tier !== "rumored" ? <p className="card-fine">{item.finePrint}</p> : null}
      {children ? <div className="card-acts">{children}</div> : null}
    </article>
  );
}
