"use client";

import { useRef } from "react";
import { useTvMoment } from "./useTvMoment";
import type { LeadsView } from "@/shared/leads";
import { groupByPlace } from "../player/Leads";
import { chime, useTvSound } from "./tvSound";

/** The TV's leads board: open leads by place, and the vote with its live count. */
export function LeadsBoard({ leads: view }: { leads: LeadsView }) {
  const open = view.leads.filter((l) => l.status !== "closed");
  const v = view.vote;
  return (
    <div className="tv-leads" role="region" aria-label="Leads">
      <div className="tv-leads-sheet">
        <div className="tv-recap-kicker">Leads</div>
        {v ? (
          <div className="tv-vote">
            <h2 className="tv-recap-title">{v.closed ? (v.winnerId ? "The table has chosen" : "A tie! The DM decides") : "Vote on your phones"}</h2>
            <ul className="tv-vote-options">
              {v.leadIds.map((id) => {
                const l = view.leads.find((x) => x.id === id);
                return (
                  <li key={id} className={v.winnerId === id ? "won" : ""}>
                    <span className="tv-vote-count">{v.counts[id] ?? 0}</span>
                    <span className="tv-vote-text">
                      {l?.text}
                      {l?.place ? <span className="tv-vote-place"> · {l.place.name}</span> : null}
                      {v.voters[id]?.length ? <span className="tv-vote-who">{v.voters[id].join(", ")}</span> : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
        {!open.length && !v ? <p>No leads yet.</p> : null}
        <div className="tv-leads-groups">
          {groupByPlace(open).map((g) => (
            <section key={g.place} className="tv-leads-group">
              <h3>{g.place}</h3>
              <ul>
                {g.leads.map((l) => (
                  <li key={l.id} className={`lead-${l.status}`}>
                    {l.text}
                    {l.status === "followed" ? <span className="tv-lead-status"> · following</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

/** "You chose: …" at the start of a session, over the lead's place. Never on first load. */
export function ChosenMoment({ chosen }: { chosen: LeadsView["chosen"] }) {
  const [sound] = useTvSound();
  const soundRef = useRef(sound);
  soundRef.current = sound;
  const [shown] = useTvMoment(chosen, chosen?.n ?? null, () => 9000, {
    clearOnNull: true,
    onShow: () => soundRef.current && chime("fact"),
  });
  if (!shown) return null;
  return (
    <div className="disc-moment chosen" role="status" key={shown.n} aria-label={`You chose: ${shown.lead.text}`}>
      <div className="disc-card">
        <div className="disc-text">
          <div className="disc-kicker">You chose{shown.lead.place ? ` · ${shown.lead.place.name}` : ""}</div>
          <div className="disc-name">{shown.lead.text}</div>
        </div>
      </div>
    </div>
  );
}
