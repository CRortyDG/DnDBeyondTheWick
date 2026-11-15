"use client";

// The bounty board on a phone: what's pinned up, and the party's Renown.
import { useState } from "react";
import { formatCp } from "@/shared/money";
import type { PlayerView } from "@/shared/projection";
import { JobCard, jobStatusLine } from "../scenes/Board";
import { RequestSheet } from "./Requests";
import { useConfirm } from "./Sheet";

type Send = (c: object) => Promise<string | null>;

export function Jobs({ view, send, availableAt }: { view: PlayerView; send: Send; availableAt: (shopId: string) => number }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [writing, setWriting] = useState(false);
  // Players post their own flyers through a shop service the DM marked "the player writes a flyer".
  const shopName = new Map(view.shops.map((s) => [s.id, s.name]));
  const flyerItem = view.items.find((i) => i.flyer && i.tier === "sale" && shopName.has(i.shopId));
  const [busy, setBusy] = useState<string | null>(null);
  const rank = view.renown.rank;
  const [confirmSheet, ask] = useConfirm();
  const take = async (jobId: string, title: string) => {
    if (!(await ask({ title: "Take this job?", body: `Ask the DM if the party can take “${title}”.`, yes: "Ask the DM" }))) return;
    setBusy(jobId);
    const err = await send({ type: "me.takeJob", jobId, note: "" });
    setBusy(null);
    setMsg(err ?? "Asked for the party. The DM will say yes or no.");
  };
  return (
    <>
      {confirmSheet}
      <details className="pl-renown" aria-label="Renown">
        <summary>
          <span className="pl-renown-k">Renown</span>
          <span className="pl-renown-v">{view.renown.name}</span>
          <span className="pl-renown-pay">jobs pay {view.renown.ladder[rank]?.pay ?? "—"}</span>
        </summary>
        <p>
          {view.game.town || "The town"} knows the party as <b>{view.renown.name}</b>. <span className="note">{view.renown.meaning}.</span>
        </p>
        <ol className="renown-ladder">
          {view.renown.ladder.map((r, i) => (
            <li key={r.name} className={i === rank ? "on" : i < rank ? "past" : undefined}>
              <span>{r.name}</span>
              <span className="note">jobs pay {r.pay}</span>
            </li>
          ))}
        </ol>
      </details>
      <section className="pl-board" aria-label="The bounty board">
        <div className="pl-sec-head">
          <h2>The notice board</h2>
          {view.jobs.length ? <span>{view.jobs.length === 1 ? "1 notice" : `${view.jobs.length} notices`}</span> : null}
        </div>
        {msg ? (
          <p className="player-msg" role="status">
            {msg}
          </p>
        ) : null}
        {!view.jobs.length ? (
          <div className="pl-empty">
            <p>Nothing pinned up yet. Keep an eye on the board at the Candle.</p>
          </div>
        ) : null}
        {flyerItem ? (
          <div className="pl-post-flyer">
            <div>
              <b>Post your own flyer</b>
              <span className="note">
                {flyerItem.priceCp ? `${formatCp(flyerItem.priceCp)} at ${shopName.get(flyerItem.shopId)}. ` : `At ${shopName.get(flyerItem.shopId)}. `}
                The DM pins it up if it&rsquo;s decent.
              </span>
            </div>
            <button type="button" className="btn" onClick={() => setWriting(true)}>
              Write a flyer
            </button>
          </div>
        ) : null}
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
                  {j.status === "open" && !j.needs && j.goodwill ? <span className="note">Opens with {j.goodwill}.</span> : null}
                  {jobStatusLine(j) ? <span className="note">{jobStatusLine(j)}</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      {writing && flyerItem ? (
        <RequestSheet
          item={flyerItem}
          availableCp={availableAt(flyerItem.shopId)}
          send={send}
          onClose={() => setWriting(false)}
          onDone={(m) => {
            setWriting(false);
            setMsg(m);
          }}
        />
      ) : null}
    </>
  );
}
