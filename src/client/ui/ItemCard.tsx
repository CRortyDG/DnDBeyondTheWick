import type { ReactNode } from "react";
import { formatCp } from "@/shared/money";
import { installmentCp } from "@/shared/progress";
import type { ItemCategory, ItemKind } from "@/shared/types";
import { LockIcon } from "./icons";
import { rankName } from "@/shared/renown";

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
  /** Locked until the party has this Renown (what players and the TV get). */
  needs?: string;
  /** The DM's item: the Renown it needs, as a rank number. */
  renown?: number;
  hint?: string;
  hidePrice?: boolean;
  stock: number | null;
  restockNote?: string;
  finePrint?: string;
  arrivesInSessions?: number;
  /** Units waiting on a pending phone request. */
  held?: number;
  category?: ItemCategory;
  kind?: ItemKind;
  listCp?: number;
  discountPct?: number;
  installments?: number;
  raisedCp?: number;
  funded?: boolean;
  earnedBy?: string[];
}

const TIER_LABEL = { sale: "For sale", locked: "Locked", rumored: "Rumored", hidden: "Hidden" } as const;

/** A shop item pinned to the board. Locked and rumored goods look like they're behind glass. */
export function ItemCard({ item, children, dm, where }: { item: CardItem; children?: ReactNode; dm?: boolean; where?: string }) {
  const { tier } = item;
  const soldOut = item.stock === 0;
  // The DM always sees the real thing; players see what the server sent them.
  const showPriceAsUnknown = !dm && (item.priceCp === null || tier === "rumored");
  const kind = item.kind ?? "purchase";
  const known = tier !== "rumored" || dm;
  const base = item.priceLabel && tier !== "rumored" ? item.priceLabel : showPriceAsUnknown ? "??? gp" : formatCp(item.priceCp ?? 0);
  const priceText = !known || showPriceAsUnknown
    ? base
    : kind === "recurring"
      ? `${base} a month`
      : kind === "training" && (item.installments ?? 1) > 1
        ? `${base} · ${item.installments} lessons of ${formatCp(installmentCp(item.priceCp ?? 0, item.installments ?? 1, 0))}`
        : kind === "project"
          ? `Goal: ${base}`
          : base;
  const playersSee = dm && (tier === "rumored" ? "players see ??? and the hint" : tier === "locked" && item.hidePrice ? "players see ??? gp" : tier === "hidden" ? "players don't see this" : null);

  return (
    <article className={`card tier-${tier}${tier !== "sale" ? " locked" : ""}${soldOut ? " sold-out" : ""}`} aria-label={tier === "rumored" && !dm ? "A rumor" : item.name}>
      <div className="card-pin" aria-hidden="true" />
      {dm ? <span className={`tier-badge tier-badge-${tier}`}>{TIER_LABEL[tier]}</span> : null}
      {known && kind === "earned" ? <span className="earned-badge">Earned</span> : null}
      {where ? <p className="card-shop">{where}</p> : null}
      <h3 className="card-name">{tier === "rumored" && !dm ? "???" : item.name}</h3>
      {kind === "earned" && known ? null : (
        <div className="card-price">
          {item.listCp !== undefined && item.listCp !== item.priceCp ? (
            <>
              <s className="card-was">{formatCp(item.listCp)}</s>{" "}
            </>
          ) : null}
          {priceText}
          {item.discountPct ? <span className="card-off"> {item.discountPct}% off</span> : null}
          {playersSee ? <span className="card-dmprice"> ({playersSee})</span> : null}
        </div>
      )}
      {item.description && (tier !== "rumored" || dm) ? <p className="card-desc">{item.description}</p> : null}
      {tier === "rumored" && item.hint ? <p className="card-hint">&ldquo;{item.hint}&rdquo;</p> : null}
      {item.needs ? (
        <p className="card-lock card-renown">
          <LockIcon size={18} />{" "}
          <span>
            Needs <b>{item.needs}</b>
            {item.reason ? <span className="card-lock-why">{item.reason}</span> : null}
          </span>
        </p>
      ) : tier === "locked" ? (
        <p className="card-lock">
          <LockIcon size={18} /> <span>{item.reason || "Not for sale yet"}</span>
        </p>
      ) : null}
      {dm && item.renown ? (
        <p className="card-lock card-renown">
          <LockIcon size={18} />{" "}
          <span>
            Needs Renown: <b>{rankName(item.renown)}</b>
            {item.reason ? <span className="card-lock-why">{item.reason}</span> : null}
          </span>
        </p>
      ) : null}
      {item.arrivesInSessions && tier !== "rumored" ? (
        <p className="card-order">Special order: arrives {item.arrivesInSessions === 1 ? "next session" : `${item.arrivesInSessions} sessions after you buy`}</p>
      ) : null}
      {kind === "project" && known && item.priceCp ? <ProjectBar raised={item.raisedCp ?? 0} goal={item.priceCp} funded={!!item.funded} /> : null}
      {kind === "earned" && known ? <p className="card-order">{item.earnedBy?.length ? `Earned by ${item.earnedBy.join(", ")}` : "Can’t be bought. Not earned yet."}</p> : null}
      {item.stock !== null && tier !== "rumored" ? (
        <p className="card-stock">{soldOut ? `Sold out${item.restockNote ? `. ${item.restockNote}` : ""}` : stockText(item.stock, item.held ?? 0)}</p>
      ) : null}
      {item.finePrint && tier !== "rumored" ? <p className="card-fine">{item.finePrint}</p> : null}
      {children ? <div className="card-acts">{children}</div> : null}
    </article>
  );
}

function ProjectBar({ raised, goal, funded }: { raised: number; goal: number; funded: boolean }) {
  const pct = Math.max(0, Math.min(100, Math.round((raised / goal) * 100)));
  return (
    <div className="project-bar-wrap">
      <div className="project-bar" role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.min(raised, goal)} aria-label="Raised so far">
        <div className="project-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="card-order">{funded ? "Funded!" : `${formatCp(raised)} of ${formatCp(goal)} raised`}</p>
    </div>
  );
}

function stockText(stock: number, held: number): string {
  if (!held) return `${stock} in stock`;
  if (held >= stock) return "On hold";
  return `${stock - held} in stock, ${held} on hold`;
}
