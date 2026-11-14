"use client";

// Combat mode on a player's phone: type your initiative, see the turn order,
// get a buzz when you're up next and a bigger one (and a coloured screen) on
// your turn, keep your HP for the table, and tap death saves at 0 HP.
// D&D Beyond stays the real character sheet.

import { useEffect, useRef, useState } from "react";
import type { PlayerView } from "@/shared/projection";
import { HEALTH_LABEL } from "@/shared/combat";
import "../ui/fight.css";

type Send = (c: object) => Promise<string | null>;

export function FightCard({ view, send }: { view: PlayerView; send: Send }) {
  const f = view.fight;
  const mine = view.myFight;
  const [msg, setMsg] = useState<string | null>(null);
  const go = async (c: object) => {
    const err = await send(c);
    setMsg(err);
    return !err;
  };
  const meId = mine?.combatantId;
  const myTurn = !!f && f.status === "running" && !!meId && f.currentId === meId;
  const upNext = !!f && f.status === "running" && !!meId && f.nextId === meId && !myTurn;
  useBuzz(myTurn ? "turn" : upNext ? "next" : null, `${f?.round}:${f?.currentId}`);
  // The whole screen changes colour on your turn.
  useEffect(() => {
    document.documentElement.classList.toggle("fc-myturn", myTurn);
    return () => document.documentElement.classList.remove("fc-myturn");
  }, [myTurn]);

  if (!f) return null;
  const me = f.order.find((c) => c.id === meId);
  const hp = view.me.hp;
  const down = hp.max > 0 && hp.cur <= 0;

  return (
    <section className={`fc-card${myTurn ? " turn" : upNext ? " next" : ""}${down ? " down" : ""}`} aria-label="The fight" aria-live="polite">
      {f.status === "setup" ? (
        mine ? (
          <InitiativePad value={mine.init} onSubmit={(n) => go({ type: "me.initiative", init: n })} />
        ) : (
          <p className="fc-big">Roll initiative! The DM is setting up the fight.</p>
        )
      ) : f.status === "over" ? (
        <p className="fc-big">The fight is over.</p>
      ) : (
        <>
          <div className="fc-head">
            {myTurn ? <div className="fc-big">Your turn!</div> : upNext ? <div className="fc-big">You&rsquo;re up next</div> : <div className="fc-who">Now: {f.order.find((c) => c.id === f.currentId)?.name ?? "…"}</div>}
            <div className="fc-round">Round {f.round}{f.status === "paused" ? " · paused" : ""}</div>
          </div>
          {myTurn ? (
            <button className="btn primary big" type="button" onClick={() => go({ type: "me.endTurn" })}>
              End my turn
            </button>
          ) : null}
          {mine?.concDc ? <p className="fc-conc">You took damage while concentrating: Constitution save, DC {mine.concDc}.</p> : null}
          {me?.conditions.length ? (
            <div className="fc-conds" aria-label="Your conditions">
              {me.conditions.map((k, i) => (
                <span key={i} className="beat-action-chip">
                  {k.name}
                  {k.level ? ` ${k.level}` : ""}
                  {k.rounds !== undefined ? ` · ${k.rounds} rd${k.rounds === 1 ? "" : "s"}` : ""}
                </span>
              ))}
            </div>
          ) : null}
          <ol className="fc-order" aria-label="Turn order">
            {f.order.map((c) => (
              <li key={c.id} className={`${c.id === f.currentId ? "cur" : ""}${c.id === meId ? " me" : ""}${c.down ? " down" : ""}`}>
                <span className="fc-o-name">{c.id === meId ? `${c.name} (you)` : c.name}</span>
                <span className="fc-o-state">{c.kind === "monster" && c.health ? HEALTH_LABEL[c.health] : c.down ? "Down" : c.id === f.nextId ? "next" : ""}</span>
              </li>
            ))}
          </ol>
        </>
      )}
      {mine && f.status !== "over" ? down && mine.deathSaves ? <DeathSaves saves={mine.deathSaves} go={go} /> : <MyHp hp={hp} go={go} /> : null}
      {msg ? (
        <p className="error-text" role="alert">
          {msg}
        </p>
      ) : null}
    </section>
  );
}

/** Vibrate where the browser supports it: a short buzz for "up next", a longer one for "your turn". */
function useBuzz(kind: "turn" | "next" | null, key: string) {
  const last = useRef<string | null>(null);
  useEffect(() => {
    if (!kind) return;
    const k = `${kind}:${key}`;
    if (last.current === k) return;
    last.current = k;
    try {
      navigator.vibrate?.(kind === "turn" ? [300, 120, 300, 120, 500] : [120]);
    } catch {}
  }, [kind, key]);
}

function InitiativePad({ value, onSubmit }: { value: number | null; onSubmit: (n: number | null) => Promise<boolean> }) {
  const [t, setT] = useState(value === null ? "" : String(value));
  const [sent, setSent] = useState(value !== null);
  const press = (d: string) => {
    setSent(false);
    setT((x) => (d === "-" ? (x.startsWith("-") ? x.slice(1) : "-" + x) : (x + d).replace(/^(-?)0+(?=\d)/, "$1").slice(0, 3)));
  };
  const submit = async () => {
    if (!t || t === "-") return;
    if (await onSubmit(Number(t))) setSent(true);
  };
  return (
    <div className="fc-pad">
      <div className="fc-big">Your initiative?</div>
      <p className="note">Roll a d20 (or in D&amp;D Beyond), add your initiative, and type the total.</p>
      <output className={`fc-pad-num${sent ? " sent" : ""}`} aria-live="polite">
        {t || "–"}
      </output>
      <div className="fc-keys">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "-", "0"].map((d) => (
          <button key={d} type="button" className="btn" onClick={() => press(d)} aria-label={d === "-" ? "Minus" : d}>
            {d === "-" ? "±" : d}
          </button>
        ))}
        <button type="button" className="btn" onClick={() => (setSent(false), setT((x) => x.slice(0, -1)))} aria-label="Delete">
          ⌫
        </button>
      </div>
      <button className="btn primary big" type="button" disabled={!t || t === "-"} onClick={submit}>
        {sent ? `Sent: ${t}. Change it any time` : "Send"}
      </button>
    </div>
  );
}

function MyHp({ hp, go }: { hp: PlayerView["me"]["hp"]; go: (c: object) => Promise<boolean> }) {
  const [amt, setAmt] = useState("");
  const [setting, setSetting] = useState(hp.max <= 0);
  const [cur, setCur] = useState(String(hp.cur || ""));
  const [max, setMax] = useState(String(hp.max || ""));
  const n = Number(amt);
  const apply = async (mode: "damage" | "heal" | "temp") => {
    if (!(n > 0)) return;
    if (await go({ type: "me.hp", mode, amount: Math.floor(n) })) setAmt("");
  };
  if (setting) {
    return (
      <div className="fc-hp" aria-label="Your HP">
        <div className="fc-hp-title">Your HP (for the table)</div>
        <div className="fc-hp-set">
          <label>
            Current
            <input className="fld" inputMode="numeric" value={cur} onChange={(e) => setCur(e.target.value.replace(/\D/g, "").slice(0, 4))} />
          </label>
          <label>
            Max
            <input className="fld" inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, "").slice(0, 4))} />
          </label>
          <button
            className="btn primary"
            type="button"
            disabled={!max}
            onClick={async () => {
              const m = Number(max);
              if (await go({ type: "me.hp", max: m, cur: Math.min(m, Number(cur || max)) })) setSetting(false);
            }}
          >
            Save
          </button>
        </div>
        {hp.max > 0 ? (
          <button className="btn small" type="button" onClick={() => setSetting(false)}>
            Cancel
          </button>
        ) : null}
        <p className="note">Optional. D&amp;D Beyond stays your real sheet.</p>
      </div>
    );
  }
  const pct = Math.max(0, Math.min(100, (hp.cur / Math.max(1, hp.max)) * 100));
  return (
    <div className="fc-hp" aria-label="Your HP">
      <div className="fc-hp-row">
        <span className="fc-hp-num">
          {hp.cur} / {hp.max}
          {hp.temp ? <span className="fx-temp"> +{hp.temp} temp</span> : null}
        </span>
        <button className="btn small" type="button" onClick={() => (setCur(String(hp.cur)), setMax(String(hp.max)), setSetting(true))}>
          Set HP
        </button>
      </div>
      <span className="fx-bar">
        <span style={{ width: `${pct}%` }} />
      </span>
      <div className="fc-hp-change">
        <input className="fld" inputMode="numeric" aria-label="Amount" placeholder="0" value={amt} onChange={(e) => setAmt(e.target.value.replace(/\D/g, "").slice(0, 4))} />
        <button className="btn" type="button" disabled={!(n > 0)} onClick={() => apply("damage")}>
          Took damage
        </button>
        <button className="btn" type="button" disabled={!(n > 0)} onClick={() => apply("heal")}>
          Healed
        </button>
        <button className="btn" type="button" disabled={!(n > 0)} onClick={() => apply("temp")}>
          Temp HP
        </button>
      </div>
      <label className="check">
        <input type="checkbox" checked={hp.tv} onChange={(e) => go({ type: "me.hp", tv: e.target.checked })} /> Show my HP on the TV
      </label>
    </div>
  );
}

function DeathSaves({ saves, go }: { saves: { ok: number; fail: number }; go: (c: object) => Promise<boolean> }) {
  const mark = (m: string) => go({ type: "me.deathSave", mark: m });
  const dead = saves.fail >= 3;
  const stable = saves.ok >= 3;
  return (
    <div className="fc-saves" aria-label="Death saves">
      <div className="fc-big">{dead ? "Your character has died" : stable ? "You're stable" : "You're at 0 HP"}</div>
      <p className="note">Roll a d20 on your turn: 10 or higher is a success. Tap to mark it.</p>
      <div className="fc-saves-row">
        <span>Successes</span>
        {[0, 1, 2].map((i) => (
          <button key={i} type="button" className={`fc-dot ok${i < saves.ok ? " on" : ""}`} aria-label={`Success ${i + 1}${i < saves.ok ? ", marked" : ""}`} onClick={() => mark(i < saves.ok ? "unok" : "ok")} />
        ))}
      </div>
      <div className="fc-saves-row">
        <span>Failures</span>
        {[0, 1, 2].map((i) => (
          <button key={i} type="button" className={`fc-dot fail${i < saves.fail ? " on" : ""}`} aria-label={`Failure ${i + 1}${i < saves.fail ? ", marked" : ""}`} onClick={() => mark(i < saves.fail ? "unfail" : "fail")} />
        ))}
      </div>
      <button className="btn primary" type="button" onClick={() => mark("nat20")}>
        Natural 20: back up with 1 HP
      </button>
    </div>
  );
}
