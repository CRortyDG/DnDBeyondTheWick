"use client";

import type { PlayerView } from "@/shared/projection";
import { MoralityChart } from "../ui/MoralityChart";

const MARK = { upheld: "Upheld", broke: "Broke", atoned: "Atoned", broken: "Oath broken", restored: "Oath restored" } as const;
const STATE = { kept: "Kept", strained: "Strained", broken: "Broken" } as const;
const STATE_NOTE = {
  kept: "Your oath holds.",
  strained: "You have strayed from your oath. Atoning (a vigil, a fast, or the rite of your order) would set it right.",
  broken: "Your oath is broken.",
} as const;

/** My alignment and oath: as much as the DM lets me see. */
export function MoralityCard({ view }: { view: PlayerView }) {
  const m = view.me.morality;
  if (!m) return null;
  return (
    <section className="box mor-card" aria-label="Morality">
      {m.label ? (
        <>
          <div className="box-head">
            <h2>{m.label}</h2>
            {m.drift ? <span className="note">{m.drift}</span> : null}
          </div>
          {m.law !== undefined && m.good !== undefined ? <MoralityChart law={m.law} good={m.good} compact /> : null}
          <p className="note">Where your deeds have taken you, as the DM sees it. It shifts with what you do.</p>
        </>
      ) : null}
      {m.oath ? (
        <div className="mor-oath">
          <div className="mor-head">
            <strong>{m.oath.name}</strong>
            <span className={`mor-state mor-state-${m.oath.state}`}>{STATE[m.oath.state]}</span>
          </div>
          <p className="note">{STATE_NOTE[m.oath.state]}</p>
          {m.oath.tenets.length ? (
            <ol className="mor-tenets">
              {m.oath.tenets.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}
      {m.reasons?.length ? (
        <>
          <h3 className="mor-h">Lately</h3>
          <ul className="mor-reasons">
            {m.reasons.map((r, i) => (
              <li key={`${r.at}-${i}`}>
                {r.text}
                {r.oath ? <span className={`mor-mark mor-mark-${r.oath === "broke" || r.oath === "broken" ? "down" : "up"}`}>{MARK[r.oath]}{r.tenet ? `: ${r.tenet.split(":")[0]}` : ""}</span> : null}
                {r.moves ? <span className="note"> · {r.moves}</span> : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
