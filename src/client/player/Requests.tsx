"use client";

// Buying from your phone: ask the DM, see what they decided.

import { useEffect, useRef, useState } from "react";
import { formatCp, parseAmount } from "@/shared/money";
import type { MyRequest, PlayerView, PublicItem } from "@/shared/projection";
import { ItemCard } from "../ui/ItemCard";

type Send = (c: object) => Promise<string | null>;

/** Units nobody is waiting on. null = no limit. */
export function freeStock(it: PublicItem): number | null {
  return it.stock === null ? null : Math.max(0, it.stock - (it.held ?? 0));
}

/** What asking for one holds now: the price, or a training's first lesson. */
export function dueNow(it: PublicItem): number {
  return it.dueNowCp ?? it.priceCp ?? 0;
}

/** Why this can't be requested right now, or null if it can. */
export function whyNot(it: PublicItem, availableCp: number, qty = 1): string | null {
  if (it.needs) return `Opens when the party is ${it.needs}`;
  if (it.tier !== "sale" || it.priceCp === null) return it.tier === "locked" ? it.reason || "Not for sale yet" : "Not for sale";
  if (it.kind === "earned") return "Can’t be bought";
  if (it.kind === "project") return it.funded ? "Funded" : availableCp <= 0 ? "You have 0 gp available" : null;
  const left = freeStock(it);
  if (it.stock === 0) return "Sold out";
  if (left === 0) return "On hold for someone else";
  if (left !== null && left < qty) return `Only ${left} left`;
  if (dueNow(it) * qty > availableCp) return `You have ${formatCp(Math.max(0, availableCp))} available`;
  return null;
}

/** The button on a card. */
export function askLabel(it: PublicItem): string {
  if (it.tier !== "sale") return "Details";
  switch (it.kind) {
    case "recurring":
      return "Ask to rent";
    case "service":
      return it.flyer ? "Write a flyer" : "Ask";
    case "training":
      return "Ask to enroll";
    case "project":
      return it.funded ? "Details" : "Put gold toward it";
    case "earned":
      return "Details";
    case "order":
      return "Ask to order";
    default:
      return "Ask to buy";
  }
}

/** The item up close, with quantity and a note to the DM. */
export function RequestSheet({ item, availableCp, send, onClose, onDone }: { item: PublicItem; availableCp: number; send: Send; onClose: () => void; onDone: (msg: string) => void }) {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [question, setQuestion] = useState("");
  const [flyer, setFlyer] = useState({ title: "", body: "", signedBy: "" });
  const [amount, setAmount] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const left = freeStock(item);
  const maxQty = item.oneAtATime ? 1 : Math.max(1, Math.min(99, left ?? 99, item.priceCp ? Math.floor(Math.max(0, availableCp) / item.priceCp) || 1 : 99));
  const project = item.kind === "project";
  const pledgeCp = parseAmount(amount);
  const needCp = Math.max(0, (item.priceCp ?? 0) - (item.raisedCp ?? 0));
  const reason =
    whyNot(item, availableCp, qty) ??
    (project && !amount.trim() ? "How much will you put in?" : null) ??
    (project && (pledgeCp === null || pledgeCp <= 0) ? "Enter an amount, like 5 or 2 gp 5 sp" : null) ??
    (project && pledgeCp! > availableCp ? `You have ${formatCp(Math.max(0, availableCp))} available` : null) ??
    (project && pledgeCp! > needCp ? `It only needs ${formatCp(needCp)} more` : null) ??
    (item.prompt && !question.trim() ? item.prompt : null) ??
    (item.flyer && !flyer.title.trim() ? "Give your flyer a title" : null);
  const total = project ? (pledgeCp ?? 0) : dueNow(item) * qty;
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialog.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  const submit = async () => {
    setBusy(true);
    const e = project
      ? await send({ type: "me.contribute", itemId: item.id, amountCp: pledgeCp, note: note.trim() })
      : await send({
          type: "me.requestBuy",
          itemId: item.id,
          qty,
          note: note.trim(),
          expectedUnitCp: item.priceCp === null ? undefined : dueNow(item),
          ...(question.trim() ? { question: question.trim() } : {}),
          ...(item.flyer ? { flyer } : {}),
        });
    setBusy(false);
    if (e) return setErr(e);
    onDone(project ? `Pledged ${formatCp(total)} toward ${item.name}. It's held until the DM approves.` : `Asked the DM for ${qty > 1 ? `${qty} × ` : ""}${item.name}. Your gold is held until they decide.`);
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={item.name} tabIndex={-1} ref={dialog} onClick={(e) => e.stopPropagation()}>
        <ItemCard item={item} />
        {item.held && left !== 0 ? <p className="note">{item.held} on hold for other requests.</p> : null}
        {item.tier === "sale" && item.kind !== "earned" && !item.funded ? (
          <div className="form">
            {project ? (
              <label>
                How much will you put in? ({formatCp(needCp)} still needed)
                <input className="fld amt" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="5 or 2 gp 5 sp" />
              </label>
            ) : null}
            {item.kind === "training" ? <p className="note">You pay the first lesson now, then one lesson at the end of each session.</p> : null}
            {item.kind === "recurring" ? <p className="note">You pay the first month now, then rent is due at the end of each session. Cancel any time from your page.</p> : null}
            {item.prompt ? (
              <label>
                {item.prompt}
                <input className="fld" value={question} maxLength={300} onChange={(e) => setQuestion(e.target.value)} />
              </label>
            ) : null}
            {item.flyer ? (
              <>
                <label>
                  Title
                  <input className="fld" value={flyer.title} maxLength={60} onChange={(e) => setFlyer({ ...flyer, title: e.target.value })} placeholder="LOST: one ham" />
                </label>
                <label>
                  A few lines
                  <textarea className="fld" rows={3} value={flyer.body} maxLength={400} onChange={(e) => setFlyer({ ...flyer, body: e.target.value })} />
                </label>
                <label>
                  Signed
                  <input className="fld" value={flyer.signedBy} maxLength={60} onChange={(e) => setFlyer({ ...flyer, signedBy: e.target.value })} placeholder="Your character's name" />
                </label>
                <p className="note">Mags (the DM) reads it first, and may tidy it up.</p>
              </>
            ) : null}
            {!item.oneAtATime ? (
              <div className="qty" role="group" aria-label="Quantity">
                <button type="button" className="btn" aria-label="One fewer" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))}>
                  &minus;
                </button>
                <span className="qty-n" aria-live="polite">
                  {qty}
                </span>
                <button type="button" className="btn" aria-label="One more" disabled={qty >= maxQty} onClick={() => setQty((q) => Math.min(maxQty, q + 1))}>
                  +
                </button>
                <span className="qty-total">{formatCp(total)}</span>
              </div>
            ) : null}
            <label>
              Note to the DM (optional)
              <input className="fld" value={note} maxLength={120} onChange={(e) => setNote(e.target.value)} placeholder="for the bard · I'll haggle" />
            </label>
            {reason ? <p className="sheet-why">{reason}</p> : null}
            {err ? (
              <p className="error-text" role="alert">
                {err}
              </p>
            ) : null}
            <button type="button" className="btn primary big" disabled={!!reason || busy} onClick={submit}>
              {project ? "Pledge" : askLabel(item)}
              {qty > 1 ? ` ${qty}` : ""} · {item.priceLabel && total === 0 ? item.priceLabel : formatCp(total)}
            </button>
          </div>
        ) : null}
        <button type="button" className="btn big" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

const STATUS = { pending: "Waiting for the DM", approved: "Approved", declined: "Declined", cancelled: "Cancelled" } as const;

function title(r: MyRequest) {
  if (r.kind === "give") return `Send ${formatCp(r.totalCp)} to ${r.toPlayerName}`;
  if (r.kind === "contribute") return `${formatCp(r.totalCp)} toward ${r.itemName}`;
  if (r.kind === "job") return `Take the job: ${r.jobTitle ?? "a job"}`;
  if (r.flyerTitle) return `Flyer: ${r.flyerTitle}`;
  return `${r.qty > 1 ? `${r.qty} × ` : ""}${r.itemName}`;
}

export function MyRequests({ requests, send, onMsg }: { requests: MyRequest[]; send: Send; onMsg: (m: string) => void }) {
  const [all, setAll] = useState(false);
  if (!requests.length) return null;
  const shown = all ? requests : requests.filter((r) => r.status === "pending" || requests.indexOf(r) < 5);
  return (
    <section className="box" aria-label="My requests">
      <h2>My requests</h2>
      <ul className="requests">
        {shown.map((r) => (
          <li key={r.id} className={`req req-${r.status}`}>
            <div className="req-main">
              <div className="req-title">{title(r)}</div>
              <div className="req-meta">
                <span className={`req-status st-${r.status}`}>{STATUS[r.status]}</span>
                {r.kind !== "give" && r.kind !== "job" ? <span className="purse-amt">{formatCp(r.chargedCp ?? r.totalCp)}</span> : null}
                {r.chargedCp !== undefined && r.chargedCp !== r.totalCp ? <span className="note">(asked {formatCp(r.totalCp)})</span> : null}
              </div>
              {r.question ? <div className="note">You asked: &ldquo;{r.question}&rdquo;</div> : null}
              {r.note ? <div className="note">&ldquo;{r.note}&rdquo;</div> : null}
              {r.answer ? <div className="req-answer">{r.answer}</div> : null}
              {r.status === "declined" && r.reason ? <div className="req-reason">DM: {r.reason}</div> : null}
            </div>
            {r.status === "pending" ? (
              <button
                type="button"
                className="btn"
                onClick={async () => {
                  const e = await send({ type: "me.cancelRequest", requestId: r.id });
                  onMsg(e ?? "Cancelled. Your gold is free again.");
                }}
              >
                Cancel
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      {shown.length < requests.length ? (
        <button type="button" className="btn" onClick={() => setAll(true)}>
          Show all {requests.length}
        </button>
      ) : null}
    </section>
  );
}

function seenSlot(view: PlayerView) {
  return `cf-seen:${view.game.id}:${view.me.id}`;
}
function readSeen(k: string): number | null {
  try {
    const v = localStorage.getItem(k);
    return v === null ? null : Number(v);
  } catch {
    return null;
  }
}
function writeSeen(k: string, v: number) {
  try {
    localStorage.setItem(k, String(v));
  } catch {}
}

/**
 * "Approved: Shield" / "Declined: Bag of Holding". Stays until tapped, so it
 * still shows if your phone was asleep. A first visit never replays old news.
 */
export function DecisionBanners({ view }: { view: PlayerView }) {
  const slot = seenSlot(view);
  const latest = view.myRequests.reduce((m, r) => (r.status === "approved" || r.status === "declined" ? Math.max(m, r.decidedAt ?? 0) : m), 0);
  const [seen, setSeen] = useState<number | null>(null);
  useEffect(() => {
    const stored = readSeen(slot);
    if (stored === null) {
      writeSeen(slot, latest);
      setSeen(latest);
    } else setSeen(stored);
    // only on first load for this player
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot]);
  if (seen === null) return null;
  const fresh = view.myRequests.filter((r) => (r.status === "approved" || r.status === "declined") && (r.decidedAt ?? 0) > seen);
  if (!fresh.length) return null;
  const dismiss = () => {
    writeSeen(slot, latest);
    setSeen(latest);
  };
  return (
    <div className="decisions" role="status" aria-live="polite">
      {fresh.map((r) => (
        <div key={r.id} className={`decision decision-${r.status}`}>
          <strong>{r.status === "approved" ? "Approved" : "Declined"}:</strong> {title(r)}
          {r.status === "approved" && r.kind === "buy" ? <> for {formatCp(r.chargedCp ?? r.totalCp)}</> : null}
          {r.status === "declined" && r.reason ? <div className="decision-reason">{r.reason}</div> : null}
          {r.answer ? <div className="decision-reason">{r.answer}</div> : null}
        </div>
      ))}
      <button type="button" className="btn big" onClick={dismiss}>
        Got it
      </button>
    </div>
  );
}

/** Pay someone back. Goes to the DM like a purchase. */
export function SendGold({ view, availableCp, send, onMsg }: { view: PlayerView; availableCp: number; send: Send; onMsg: (m: string) => void }) {
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState("");
  const [amt, setAmt] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);
  if (!view.table.length) return null;
  if (!open)
    return (
      <button type="button" className="btn big" onClick={() => setOpen(true)}>
        Send gold to someone
      </button>
    );
  const cp = parseAmount(amt);
  const why = !to ? "Pick who to send it to" : !cp || cp <= 0 ? "Enter an amount" : cp > availableCp ? `You have ${formatCp(Math.max(0, availableCp))} available` : null;
  return (
    <form
      className="form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (why || !cp) return;
        const r = await send({ type: "me.requestGive", toPlayerId: to, amountCp: cp, note: note.trim() });
        if (r) return setErr(r);
        onMsg(`Asked the DM to send ${formatCp(cp)} to ${view.table.find((p) => p.id === to)?.name}.`);
        setOpen(false);
        setAmt("");
        setNote("");
        setErr(null);
      }}
    >
      <label>
        To
        <select className="fld" value={to} onChange={(e) => setTo(e.target.value)} style={{ width: "100%" }}>
          <option value="">Choose&hellip;</option>
          {view.table.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Amount (gp)
        <input className="fld amt" inputMode="decimal" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="5 or 2 gp 5 sp" />
      </label>
      <label>
        What for (optional)
        <input className="fld" value={note} maxLength={120} onChange={(e) => setNote(e.target.value)} placeholder="paying back the potion" />
      </label>
      {why && (to || amt) ? <p className="sheet-why">{why}</p> : null}
      {err ? (
        <p className="error-text" role="alert">
          {err}
        </p>
      ) : null}
      <button type="submit" className="btn primary big" disabled={!!why}>
        Ask the DM to send it
      </button>
      <button type="button" className="btn big" onClick={() => setOpen(false)}>
        Never mind
      </button>
    </form>
  );
}
