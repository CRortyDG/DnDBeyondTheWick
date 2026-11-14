"use client";

// Dice on a phone: pick dice, roll on the TV for the table or just for the DM.
// The DM sees every roll either way.
import { useState } from "react";
import type { PlayerView } from "@/shared/projection";
import { DicePicker, RollLine, useDicePicks } from "../ui/DicePicker";

type Send = (c: object) => Promise<string | null>;

export function Dice({ view, send }: { view: PlayerView; send: Send }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const picks = useDicePicks(setMsg);

  const roll = async (tv: boolean) => {
    if (!picks.total || busy) return;
    setBusy(true);
    setMsg(null);
    const err = await send({ type: "me.diceRoll", dice: picks.ask, plus: picks.plus, tv });
    setBusy(false);
    if (err) setMsg(err);
  };

  return (
    <section className="box pd-dice" aria-label="Dice">
      <div className="dt-head">
        <h2>Dice</h2>
        <span className="spacer" />
        <button type="button" className="btn small" onClick={picks.reset} disabled={!picks.total && !picks.plus}>
          Clear dice
        </button>
      </div>
      <DicePicker picks={picks} />
      <div className="dt-actions">
        <button type="button" className="btn primary" onClick={() => roll(true)} disabled={!picks.total || busy}>
          Roll on the TV
        </button>
        <button type="button" className="btn" onClick={() => roll(false)} disabled={!picks.total || busy}>
          Roll for the DM only
        </button>
      </div>
      <p className="note">The DM sees every roll. &ldquo;For the DM only&rdquo; keeps it off the TV, for things like a Stealth check.</p>
      {msg ? (
        <p className="player-msg" role="status">
          {msg}
        </p>
      ) : null}
      {view.myRolls.length ? (
        <ul className="dt-log" aria-label="Your last rolls" aria-live="polite">
          {view.myRolls.map((r) => (
            <RollLine key={r.n} r={r} tag={r.to === "tv" ? "on TV" : "DM only"} secret={r.to !== "tv"} />
          ))}
        </ul>
      ) : null}
    </section>
  );
}
