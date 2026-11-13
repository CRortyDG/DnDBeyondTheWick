"use client";

// "Rent and lessons due": the session-end step that charges every active
// renter and the next lesson for anyone in training. You confirm it.

import { useState } from "react";
import { formatCp } from "@/shared/money";
import { creditCp, duesFor, type Due } from "@/shared/progress";
import type { Session } from "@/shared/types";
import { useDm } from "./context";

export function useDues(session: Session | undefined): Due[] {
  const { view } = useDm();
  return session ? duesFor(view.state, session.number) : [];
}

export function Dues({ session, onCharged }: { session: Session; onCharged?: () => void }) {
  const { view, call, toast } = useDm();
  const s = view.state;
  const due = useDues(session);
  const name = (id: string) => s.players.find((p) => p.id === id)?.name ?? "someone who left";
  /** Can they pay without going past zero (or past their tab, where the item is)? */
  const canPay = (d: Due) => {
    const p = s.players.find((x) => x.id === d.playerId);
    if (!p || p.archived) return false;
    const itemId = d.kind === "rent" ? s.rentals.find((r) => r.id === d.id)?.itemId : s.trainings.find((t) => t.id === d.id)?.itemId;
    const shopId = s.items.find((i) => i.id === itemId)?.shopId;
    return p.balanceCp - d.cp >= -creditCp(s, p.id, shopId);
  };
  // Players who can't pay start unticked; tick one to charge it into debt.
  const [picked, setPicked] = useState<Set<string>>(() => new Set(due.filter(canPay).map((d) => d.id)));
  const ticked = due.filter((d) => picked.has(d.id));
  const total = ticked.reduce((a, d) => a + d.cp, 0);

  if (!due.length) {
    return <p className="note">{session.duesCharged ? "Rent and lessons are paid for this session." : "No rent or lessons due this session."}</p>;
  }
  return (
    <div className="dues">
      <ul className="dues-list">
        {due.map((d) => {
          const ok = canPay(d);
          return (
            <li key={d.id}>
              <label className="check">
                <input
                  type="checkbox"
                  checked={picked.has(d.id)}
                  onChange={(e) => {
                    const next = new Set(picked);
                    if (e.target.checked) next.add(d.id);
                    else next.delete(d.id);
                    setPicked(next);
                  }}
                />
                <b>{name(d.playerId)}</b>: {d.kind === "rent" ? `${d.itemName}, this month` : `${d.itemName}, lesson ${d.step}`} <span className="purse-amt">{formatCp(d.cp)}</span>
              </label>
              {!ok ? <span className="short">can&rsquo;t pay: ticking it puts them in debt</span> : null}
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        className="btn primary"
        disabled={!ticked.length}
        onClick={async () => {
          const r = await call({ type: "dues.charge", ids: ticked.map((d) => d.id) });
          toast(r.error ?? r.info ?? "Charged.");
          if (!r.error) onCharged?.();
        }}
      >
        Charge {ticked.length} &middot; {formatCp(total)}
      </button>
      {ticked.length < due.length ? <p className="note">Anything unticked stays due. You can charge it later this session.</p> : null}
    </div>
  );
}

/** Before "End session" in the DM view: charge what's due first, or end anyway. */
export function EndSessionDialog({ session, onClose }: { session: Session; onClose: () => void }) {
  const { run } = useDm();
  const due = useDues(session);
  const end = async () => {
    if (await run({ type: "session.end" }, `${session.title} ended.`)) onClose();
  };
  return (
    <div className="inbox-backdrop" onClick={onClose}>
      <aside className="inbox-drawer" role="dialog" aria-label="Rent and lessons due" onClick={(e) => e.stopPropagation()}>
        <div className="box-head">
          <h2>Rent and lessons due</h2>
          <button type="button" className="btn small" onClick={onClose}>
            Not yet
          </button>
        </div>
        <Dues session={session} />
        <button type="button" className={`btn${due.length ? "" : " primary"}`} onClick={end}>
          {due.length ? `End ${session.title} without charging the rest` : `End ${session.title}`}
        </button>
      </aside>
    </div>
  );
}
