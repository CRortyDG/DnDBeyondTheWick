import type { ReactNode } from "react";
import { formatCp } from "@/shared/money";
import { LockIcon } from "./icons";

export interface CardItem {
  id: string;
  name: string;
  priceCp: number | null;
  description: string;
  lockReason: string;
}

/** A shop item pinned to the board. Locked goods look like they're behind glass. */
export function ItemCard({ item, children, dmPrice }: { item: CardItem; children?: ReactNode; dmPrice?: boolean }) {
  const locked = !!item.lockReason;
  const priceText = item.priceCp === null ? "??? gp" : formatCp(item.priceCp);
  return (
    <article className={`card${locked ? " locked" : ""}`} aria-label={item.name}>
      <div className="card-pin" aria-hidden="true" />
      <h3 className="card-name">{item.name}</h3>
      <div className="card-price">
        {priceText}
        {dmPrice ? <span className="card-dmprice"> (players see ??? gp)</span> : null}
      </div>
      {item.description ? <p className="card-desc">{item.description}</p> : null}
      {locked ? (
        <p className="card-lock">
          <LockIcon size={18} /> <span>{item.lockReason}</span>
        </p>
      ) : null}
      {children ? <div className="card-acts">{children}</div> : null}
    </article>
  );
}
