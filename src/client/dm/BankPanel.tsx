"use client";

import { useMemo, useState } from "react";
import { formatCp, formatDelta, parseAmount } from "@/shared/money";
import { useDm } from "./context";

export function BankPanel() {
  const { view, run, toast } = useDm();
  const s = view.state;
  const [amount, setAmount] = useState("25");
  const [note, setNote] = useState("");
  const [allowDebt, setAllowDebt] = useState(false);
  const [sessionFilter, setSessionFilter] = useState<string>("all");
  const active = s.players.filter((p) => !p.archived);
  const [unticked, setUnticked] = useState<Set<string>>(new Set());

  const cp = parseAmount(amount);
  const amountOk = cp !== null && cp > 0;
  const payees = active.filter((p) => !p.away && !unticked.has(p.id));

  const give = (playerId: string, sign: 1 | -1) => {
    if (!amountOk) return toast("Enter an amount, like 25 or 12 gp 5 sp.");
    void run({ type: "money.adjust", playerId, amountCp: sign * cp!, note, allowDebt });
  };

  const ledger = useMemo(() => {
    if (sessionFilter === "all") return view.ledger;
    if (sessionFilter === "none") return view.ledger.filter((l) => !l.sessionId || !s.sessions.some((x) => x.id === l.sessionId));
    return view.ledger.filter((l) => l.sessionId === sessionFilter);
  }, [view.ledger, sessionFilter, s.sessions]);

  const sessionName = (id: string | null) => (id && s.sessions.find((x) => x.id === id)?.title) || "Between sessions";

  return (
    <div className="panel-grid">
      <section className="box">
        <h3>Players</h3>
        <div className="inline">
          <label>
            Amount
            <input className="fld amt" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} aria-describedby="amt-hint" />
          </label>
          <label className="grow">
            Note
            <input className="fld" value={note} placeholder="e.g. Artum's pay" onChange={(e) => setNote(e.target.value)} />
          </label>
        </div>
        <p id="amt-hint" className="note">
          {amount.trim() === "" ? "A plain number is gold. You can also type 12 gp 5 sp, or 3 sp." : amountOk ? `= ${formatCp(cp!)}` : "That isn't an amount I can read."}
        </p>

        <div className="prow-list">
          {active.map((p) => (
            <div className={`prow${p.away ? " away" : ""}`} key={p.id}>
              <span className="prow-name">
                {p.name}
                {p.away ? <span className="tag">away</span> : null}
              </span>
              <span className="bal">{formatCp(p.balanceCp)}</span>
              <button className="btn small primary" type="button" onClick={() => give(p.id, 1)} aria-label={`Give ${p.name} ${amountOk ? formatCp(cp!) : ""}`}>
                Give
              </button>
              <button className="btn small" type="button" onClick={() => give(p.id, -1)} aria-label={`Take ${amountOk ? formatCp(cp!) : ""} from ${p.name}`}>
                Take
              </button>
            </div>
          ))}
          {active.length === 0 ? <p className="note">No players yet. Anyone who opens ?player=their-name joins automatically.</p> : null}
        </div>
        <label className="check">
          <input type="checkbox" checked={allowDebt} onChange={(e) => setAllowDebt(e.target.checked)} /> Allow debt (Take can go below zero)
        </label>

        <fieldset className="payall">
          <legend>Pay everyone</legend>
          <div className="checks">
            {active
              .filter((p) => !p.away)
              .map((p) => (
                <label className="check" key={p.id}>
                  <input
                    type="checkbox"
                    checked={!unticked.has(p.id)}
                    onChange={(e) =>
                      setUnticked((u) => {
                        const n = new Set(u);
                        if (e.target.checked) n.delete(p.id);
                        else n.add(p.id);
                        return n;
                      })
                    }
                  />
                  {p.name}
                </label>
              ))}
          </div>
          <button
            className="btn primary"
            type="button"
            disabled={!payees.length}
            onClick={() => {
              if (!amountOk) return toast("Enter an amount first.");
              void run({ type: "money.payAll", amountCp: cp!, note, playerIds: payees.map((p) => p.id) }, `Paid ${payees.length} ${payees.length === 1 ? "player" : "players"} ${formatCp(cp!)} each.`);
            }}
          >
            Pay {payees.length === active.filter((p) => !p.away).length ? "everyone" : `${payees.length} players`} {amountOk ? formatCp(cp!) : ""}
          </button>
        </fieldset>
      </section>

      <section className="box">
        <div className="box-head">
          <h3>Ledger</h3>
          <label className="inline-label">
            <span className="sr-only">Show ledger for</span>
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
        <ul className="ledger">
          {ledger.length === 0 ? (
            <li>
              <span className="note">Nothing yet. Every payment and purchase shows up here.</span>
            </li>
          ) : null}
          {ledger.slice(0, 300).map((l) => (
            <li key={l.id}>
              <span>
                <div>{l.note}</div>
                <div className="who">
                  {l.playerName} &middot; {new Date(l.at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} &middot; {sessionName(l.sessionId)}
                </div>
              </span>
              <span className={l.amountCp >= 0 ? "up" : "down"}>{formatDelta(l.amountCp)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
