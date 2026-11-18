"use client";

// "Rent and lessons due": the session-end step that charges every active
// renter and the next lesson for anyone in training. You confirm it.

import { useState } from "react";
import { formatCp } from "@/shared/money";
import { clockOf, creditCp, duesFor, type Due } from "@/shared/progress";
import type { Session } from "@/shared/types";
import { useDm } from "./context";
import { downloadBackup } from "./backup";
import { useAutosave } from "./useAutosave";

export function useDues(session: Session | undefined): Due[] {
  const { view } = useDm();
  return session ? duesFor(view.state, session) : [];
}

export function Dues({ session, onCharged }: { session: Session; onCharged?: () => void }) {
  return (
    <>
      <DuesList session={session} onCharged={onCharged} />
      <Hirelings session={session} />
    </>
  );
}

/** Hirelings paid up to this session: keep them on for the next one (charged now), or let them go. */
function Hirelings({ session }: { session: Session }) {
  const { view, run, call, toast } = useDm();
  const s = view.state;
  const list = (s.companions ?? []).flatMap((c) => {
    if (c.status !== "with" || !c.hire) return [];
    const r = s.rentals.find((x) => x.id === c.hire!.rentalId && x.active);
    return r && r.paidThrough <= clockOf(s, session) ? [{ c, r }] : [];
  });
  if (!list.length) return null;
  const name = (id: string) => s.players.find((p) => p.id === id)?.name ?? "someone who left";
  return (
    <div className="dues hire-dues">
      <h4>Hirelings</h4>
      <ul className="dues-list">
        {list.map(({ c, r }) => (
          <li key={c.id}>
            <span>
              <b>{c.name}</b>, hired by {name(r.playerId)}: keep them for the next session? <span className="purse-amt">{formatCp(r.monthlyCp)}</span>
            </span>
            <span className="hire-acts">
              <button type="button" className="btn small primary" onClick={async () => {
                  const r = await call({ type: "companion.keep", companionId: c.id });
                  toast(r.error ?? r.info ?? `${c.name} stays on.`);
                }}>
                Keep
              </button>
              <button type="button" className="btn small" onClick={() => run({ type: "companion.dismiss", companionId: c.id }, `${c.name} goes home.`)}>
                Let go
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DuesList({ session, onCharged }: { session: Session; onCharged?: () => void }) {
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

/**
 * "End session" in the DM view: a short wrap-up first. An open fight, asks still
 * waiting, rent and lessons due, the recap for next time's "Previously on", and a
 * backup. Nothing here is required; it's what's easy to forget at the end of a night.
 */
export function EndSessionDialog({ session, onClose }: { session: Session; onClose: () => void }) {
  const { view, run, ident, toast } = useDm();
  const s = view.state;
  const due = useDues(session);
  const recap = useAutosave(session.recap ?? "", (text) => run({ type: "run.recap", sessionId: session.id, text }));
  const waiting = s.requests.filter((r) => r.status === "pending").length;
  const fight = s.fight;
  const [saved, setSaved] = useState(false);
  const end = async () => {
    await recap.flush();
    if (await run({ type: "session.end" }, `${session.title} ended.`)) onClose();
  };
  return (
    <div className="inbox-backdrop" onClick={onClose}>
      <aside className="inbox-drawer wrapup" role="dialog" aria-label={`Wrap up ${session.title}`} onClick={(e) => e.stopPropagation()}>
        <div className="box-head">
          <h2>Wrap up {session.title}</h2>
          <button type="button" className="btn small" onClick={onClose}>
            Not yet
          </button>
        </div>
        {fight ? (
          <section className="wrapup-step warn">
            <h3>A fight is still open</h3>
            <p className="note">{fight.status === "over" ? "Its end card is up. Finish it (loot and the Chronicle) or close it here." : "Phones are still showing it. End it from the fight screen, or cancel it here."}</p>
            <button type="button" className="btn small" onClick={() => run({ type: "fight.cancel" }, "Fight closed.")}>
              {fight.status === "over" ? "Close it without loot" : "Cancel the fight"}
            </button>
          </section>
        ) : null}
        {waiting ? (
          <section className="wrapup-step warn">
            <h3>
              {waiting} {waiting === 1 ? "ask is" : "asks are"} still waiting
            </h3>
            <p className="note">Their gold stays held until you decide. Open Requests (press I) to approve or decline.</p>
          </section>
        ) : null}
        <section className="wrapup-step">
          <h3>Rent and lessons due</h3>
          <Dues session={session} />
        </section>
        <section className="wrapup-step">
          <h3>Recap</h3>
          <label>
            <span className="note">A few lines for next time&rsquo;s &ldquo;Previously on&hellip;&rdquo;. Players see it in the Chronicle once the session ends. {recap.state === "saved" ? "" : recap.state === "saving" ? "Saving…" : "…"}</span>
            <textarea className="fld" rows={5} value={recap.text} onChange={(e) => recap.onChange(e.target.value)} onBlur={() => void recap.flush()} placeholder="What happened tonight, in the party's words" />
          </label>
        </section>
        <section className="wrapup-step">
          <h3>Backup</h3>
          <p className="note">Everything saves online by itself. A copy on this computer is still worth having.</p>
          <button
            type="button"
            className={`btn small${saved ? " on" : ""}`}
            onClick={async () => {
              if (await downloadBackup(ident, toast)) setSaved(true);
            }}
          >
            {saved ? "Backup downloaded" : "Download a backup"}
          </button>
        </section>
        <button type="button" className="btn primary" onClick={end} disabled={!!fight && fight.status !== "over"}>
          {due.length ? `End ${session.title} without charging the rest` : `End ${session.title}`}
        </button>
        {fight && fight.status !== "over" ? <p className="note">End or cancel the fight first.</p> : null}
      </aside>
    </div>
  );
}
