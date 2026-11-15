"use client";
import { bothNames } from "@/shared/arrival";

import { useMemo, useState } from "react";
import { formatCp, formatDelta, parseAmount } from "@/shared/money";
import type { LedgerEntry } from "@/shared/types";
import { api } from "../api";
import { useDm } from "./context";
import { InspireToggle } from "./InspireToggle";
import { PageHead } from "./PageHead";

/** Quick amounts in gold. One tap fills the amount box. */
const PRESETS = [1, 5, 10, 25, 50, 100];

const KIND_LABEL: Record<string, string> = {
  grant: "Given",
  charge: "Taken",
  purchase: "Bought",
  payAll: "Paid everyone",
  transfer: "Transfer",
  rent: "Rent",
  contribution: "Pooled",
  income: "Income",
  bounty: "Bounty",
  loot: "Loot",
};

export function BankPanel() {
  const { view, run, toast, ident } = useDm();
  const [removing, setRemoving] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const s = view.state;
  const [amount, setAmount] = useState("25");
  const [note, setNote] = useState("");
  const [allowDebt, setAllowDebt] = useState(false);
  const [sessionFilter, setSessionFilter] = useState<string>("all");
  const [playerFilter, setPlayerFilter] = useState<string>("all");
  const active = s.players.filter((p) => !p.archived);
  const present = active.filter((p) => !p.away);
  const [unticked, setUnticked] = useState<Set<string>>(new Set());

  const cp = parseAmount(amount);
  const amountOk = cp !== null && cp > 0;
  const amt = amountOk ? formatCp(cp!) : "";
  const payees = present.filter((p) => !unticked.has(p.id));
  const total = active.reduce((sum, p) => sum + p.balanceCp, 0);

  const give = (playerId: string, sign: 1 | -1) => {
    if (!amountOk) return toast("Enter an amount, like 25 or 12 gp 5 sp.");
    void run({ type: "money.adjust", playerId, amountCp: sign * cp!, note, allowDebt });
  };
  const toggle = (id: string, on: boolean) =>
    setUnticked((u) => {
      const n = new Set(u);
      if (on) n.delete(id);
      else n.add(id);
      return n;
    });

  const newestFirst = useMemo(() => [...view.ledger].sort((a, b) => b.at - a.at), [view.ledger]);
  const lastAny = newestFirst[0];
  const lastFor = useMemo(() => {
    const m = new Map<string, LedgerEntry>();
    for (const l of newestFirst) if (!m.has(l.playerId)) m.set(l.playerId, l);
    return m;
  }, [newestFirst]);

  const ledger = useMemo(() => {
    let out = newestFirst;
    if (sessionFilter === "none") out = out.filter((l) => !l.sessionId || !s.sessions.some((x) => x.id === l.sessionId));
    else if (sessionFilter !== "all") out = out.filter((l) => l.sessionId === sessionFilter);
    if (playerFilter !== "all") out = out.filter((l) => l.playerId === playerFilter);
    return out;
  }, [newestFirst, sessionFilter, playerFilter, s.sessions]);

  /** Rows for the list: a Pay-everyone batch folds into one line unless one player is picked. */
  const rows = useMemo(() => {
    const out: { key: string; who: string; entry: LedgerEntry; count: number; ids: string[] }[] = [];
    for (const l of ledger.slice(0, 300)) {
      const prev = out[out.length - 1];
      if (playerFilter === "all" && l.batchId && prev && prev.entry.batchId === l.batchId) {
        prev.count++;
        prev.ids.push(l.id);
        prev.who = `${prev.count} players`;
        continue;
      }
      out.push({ key: l.id, who: l.playerName, entry: l, count: 1, ids: [l.id] });
    }
    return out;
  }, [ledger, playerFilter]);

  const sessionName = (id: string | null) => (id && s.sessions.find((x) => x.id === id)?.title) || "Between sessions";
  const when = (at: number) => {
    const d = new Date(at);
    const today = new Date().toDateString() === d.toDateString();
    return today ? d.toLocaleTimeString(undefined, { timeStyle: "short" }) : d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  const removeLines = async (ids: string[], undo: boolean) => {
    setBusy(true);
    try {
      await api("/api/ledger/remove", ident, { method: "POST", body: JSON.stringify({ ids, undo }) });
      toast(undo ? "Removed, and the gold change is undone." : "Removed from the ledger. Purses are unchanged.");
      setRemoving(null);
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const allPicked = payees.length === present.length;

  return (
    <div className="bank">
      <PageHead
        title="Bank"
        sub="Give, take and pay the party. Every change lands in the ledger."
        help={
          <p>
            Pick an amount once, then tap + or − on a player. A plain number is gold; 12 gp 5 sp or 3 sp work too. Pay everyone gives the amount to each ticked card; away players are left out. Take stops at zero unless Allow debt is on. The Purse on the TV shows the same balances.
          </p>
        }
        stats={[
          { label: "Party total", value: formatCp(total), tone: "gold" },
          { label: "At the table", value: present.length },
          ...(active.length > present.length ? [{ label: "Away", value: active.length - present.length, tone: "muted" as const }] : []),
          ...(lastAny ? [{ label: "Last change", value: <>{formatDelta(lastAny.amountCp)} <span className="pg-stat-note">{lastAny.playerName}</span></>, tone: "muted" as const }] : []),
        ]}
      />
      <div className="bank-work">
      <section className="bank-amount" aria-label="Amount">
        <div className="bank-amount-row">
          <label className="bank-amt">
            <span className="bank-k">Amount</span>
            <input className="fld amt" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} onFocus={(e) => e.target.select()} aria-describedby="amt-hint" />
          </label>
          <div className="bank-presets" role="group" aria-label="Quick amounts">
            {PRESETS.map((g) => (
              <button key={g} type="button" className={`btn small${amount.trim() === String(g) ? " on" : ""}`} aria-pressed={amount.trim() === String(g)} onClick={() => setAmount(String(g))}>
                {g} gp
              </button>
            ))}
          </div>
          <label className="bank-note grow">
            <span className="bank-k">Note</span>
            <input className="fld" value={note} placeholder="What it's for, e.g. Artum's pay" onChange={(e) => setNote(e.target.value)} />
          </label>
        </div>
        <div className="bank-amount-foot">
          <span id="amt-hint" className={`note${amount.trim() !== "" && !amountOk ? " bad" : ""}`}>
            {amount.trim() === "" ? "A plain number is gold. You can also type 12 gp 5 sp, or 3 sp." : amountOk ? `${formatCp(cp!)} per tap. Untick a card to leave that player out of Pay.` : "That isn't an amount I can read."}
          </span>
          <label className="check">
            <input type="checkbox" checked={allowDebt} onChange={(e) => setAllowDebt(e.target.checked)} /> Allow debt
          </label>
          {present.length ? (
            <button
              className="btn primary"
              type="button"
              disabled={!payees.length || !amountOk}
              title={amountOk && payees.length ? `${formatCp(cp! * payees.length)} in all. Untick a card to leave that player out.` : "Untick a card to leave that player out."}
              onClick={() => void run({ type: "money.payAll", amountCp: cp!, note, playerIds: payees.map((p) => p.id) }, `Paid ${payees.length} ${payees.length === 1 ? "player" : "players"} ${formatCp(cp!)} each.`)}
            >
              Pay {allPicked ? "everyone" : `${payees.length} ${payees.length === 1 ? "player" : "players"}`} {amt}
              {amt && payees.length > 1 ? " each" : ""}
            </button>
          ) : null}
        </div>
      </section>

      <div className="bank-cards">
        {active.map((p) => {
          const last = lastFor.get(p.id);
          const picked = !p.away && !unticked.has(p.id);
          const short = !allowDebt && amountOk && p.balanceCp < cp!;
          return (
            <article className={`bank-card${p.away ? " away" : ""}${picked ? " picked" : ""}`} key={p.id}>
              <header>
                {p.away ? (
                  <span className="tag">away</span>
                ) : (
                  <label className="bank-pick" title="Include in Pay">
                    <input type="checkbox" checked={picked} onChange={(e) => toggle(p.id, e.target.checked)} aria-label={`Include ${p.name} in Pay`} />
                  </label>
                )}
                <span className="bank-name" title={bothNames(p)}>
                  {bothNames(p)}
                </span>
                <InspireToggle playerId={p.id} name={p.name} on={!!p.inspired} compact />
              </header>
              <div className="bank-bal">{formatCp(p.balanceCp)}</div>
              <div className="bank-last">
                {last ? (
                  <>
                    <span className={last.amountCp >= 0 ? "up" : "down"}>{formatDelta(last.amountCp)}</span> {last.note || KIND_LABEL[last.kind] || ""}
                  </>
                ) : (
                  "No money moved yet"
                )}
              </div>
              <div className="bank-btns">
                <button className="btn small" type="button" onClick={() => give(p.id, -1)} disabled={!amountOk || short} title={short ? `${p.name} only has ${formatCp(p.balanceCp)}. Tick Allow debt to go below zero.` : undefined} aria-label={`Take ${amt} from ${p.name}`}>
                  &minus; {amt || "Take"}
                </button>
                <button className="btn small give" type="button" onClick={() => give(p.id, 1)} disabled={!amountOk} aria-label={`Give ${p.name} ${amt}`}>
                  + {amt || "Give"}
                </button>
              </div>
            </article>
          );
        })}
        {active.length === 0 ? <p className="note">No players yet. Anyone who opens ?player=their-name joins automatically.</p> : null}
      </div>

      {!allPicked && present.length ? (
        <p className="note bank-picknote">
          Pay leaves out {present.length - payees.length} unticked {present.length - payees.length === 1 ? "player" : "players"}.{" "}
          <button className="linkish" type="button" onClick={() => setUnticked(new Set())}>
            Pick everyone
          </button>
        </p>
      ) : null}
      </div>

      <section className="box bank-ledger">
        <div className="box-head">
          <h3>Ledger</h3>
          <div className="inline">
            <label className="inline-label">
              <span className="sr-only">Show ledger for player</span>
              <select className="fld" value={playerFilter} onChange={(e) => setPlayerFilter(e.target.value)}>
                <option value="all">All players</option>
                {s.players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {bothNames(p)}
                  </option>
                ))}
              </select>
            </label>
            <label className="inline-label">
              <span className="sr-only">Show ledger for session</span>
              <select className="fld" value={sessionFilter} onChange={(e) => setSessionFilter(e.target.value)}>
                <option value="all">All sessions</option>
                {[...s.sessions].reverse().map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.title}
                  </option>
                ))}
                <option value="none">Between sessions</option>
              </select>
            </label>
          </div>
        </div>
        {ledger.length === 0 ? <p className="note">Nothing yet. Every payment and purchase shows up here.</p> : null}
        <ul className="bank-ledger-list">
          {rows.map(({ key, who, entry: l, count, ids }) => (
            <li key={key} className={removing === key ? "removing" : undefined}>
              <span className="bl-who">{who}</span>
              <span className="bl-what">
                {l.note || KIND_LABEL[l.kind] || ""}
                <span className="bl-meta">
                  {when(l.at)} &middot; {sessionName(l.sessionId)}
                </span>
              </span>
              <span className={`bl-amt ${l.amountCp >= 0 ? "up" : "down"}`}>
                {formatDelta(l.amountCp)}
                {count > 1 ? <span className="bl-each"> each</span> : null}
              </span>
              <button className="bl-remove" type="button" aria-label={`Remove this ledger line (${who})`} title="Remove this line" onClick={() => setRemoving(removing === key ? null : key)}>
                &times;
              </button>
              {removing === key ? (
                <div className="bl-confirm">
                  <span className="note">
                    Remove {count > 1 ? `these ${count} lines` : "this line"}? Undoing the gold {l.amountCp >= 0 ? "takes" : "gives"} {formatCp(Math.abs(l.amountCp))} {l.amountCp >= 0 ? "back from" : "back to"} {count > 1 ? "each player" : who}{l.kind === "purchase" ? "; the item stays theirs" : ""}.
                  </span>
                  <button className="btn small danger" type="button" disabled={busy} onClick={() => void removeLines(ids, true)}>
                    Remove and undo gold
                  </button>
                  <button className="btn small" type="button" disabled={busy} onClick={() => void removeLines(ids, false)}>
                    Remove line only
                  </button>
                  <button className="btn small ghost" type="button" onClick={() => setRemoving(null)}>
                    Cancel
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
