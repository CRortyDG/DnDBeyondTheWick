"use client";

// The bounty board on a phone: what's pinned up, and the party's Renown.
import { useState } from "react";
import type { PlayerView } from "@/shared/projection";
import { RENOWN } from "@/shared/renown";
import { JobCard, jobStatusLine } from "../scenes/Board";

type Send = (c: object) => Promise<string | null>;

export function Jobs({ view, send }: { view: PlayerView; send: Send }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const rank = view.renown.rank;
  const take = async (jobId: string, title: string) => {
    if (!confirm(`Ask the DM if the party can take “${title}”?`)) return;
    setBusy(jobId);
    const err = await send({ type: "me.takeJob", jobId, note: "" });
    setBusy(null);
    setMsg(err ?? "Asked for the party. The DM will say yes or no.");
  };
  return (
    <>
      <section className="box" aria-label="Renown">
        <h2>Renown</h2>
        <p>
          Candlefair knows the party as <b>{view.renown.name}</b>. <span className="note">{view.renown.meaning}.</span>
        </p>
        <ol className="renown-ladder">
          {RENOWN.map((r, i) => (
            <li key={r.name} className={i === rank ? "on" : i < rank ? "past" : undefined}>
              <span>{r.name}</span>
              <span className="note">jobs pay {r.pay}</span>
            </li>
          ))}
        </ol>
      </section>
      <section className="box" aria-label="The bounty board">
        <h2>The notice board</h2>
        {msg ? (
          <p className="player-msg" role="status">
            {msg}
          </p>
        ) : null}
        {!view.jobs.length ? <p className="note">Nothing pinned up yet. Keep an eye on the board at the Candle.</p> : null}
        <div className="job-list">
          {view.jobs.map((j) => {
            const title = j.style === "sealed" ? "A sealed envelope" : j.title;
            return (
              <div key={j.id} className="job-item">
                <JobCard job={j} page />
                <div className="job-actions">
                  {j.canTake && !j.asked ? (
                    <button type="button" className="btn primary" disabled={busy === j.id} onClick={() => void take(j.id, title)}>
                      Take this job for the party
                    </button>
                  ) : null}
                  {j.asked ? <span className="tag">The party asked the DM</span> : null}
                  {j.status === "open" && j.needs ? <span className="note">For experienced parties: opens when you&rsquo;re {j.needs}.</span> : null}
                  {jobStatusLine(j) ? <span className="note">{jobStatusLine(j)}</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
