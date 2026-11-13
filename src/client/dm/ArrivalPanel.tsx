"use client";

import { useEffect, useRef, useState } from "react";
import { arrivalPath, arrivalStatus, arrivalText, DEFAULT_TEMPLATE, genericArrivalPath, seatedPlayers, type ArrivalStatus } from "@/shared/arrival";
import type { DmPlayer } from "@/shared/projection";
import { Check } from "./Check";
import { useDm } from "./context";
import { Field } from "./Field";

const STEPS: [ArrivalStatus, string][] = [
  ["copied", "Link copied"],
  ["opened", "Opened"],
  ["finished", "Finished"],
  ["claimed", "Seat claimed"],
];
const ORDER: ArrivalStatus[] = ["new", "copied", "opened", "finished", "claimed"];

function when(t?: number) {
  return t ? new Date(t).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" }) : "";
}

/** The Arrival intro: who has their link, who has watched it, who has claimed a seat. */
export function ArrivalPanel() {
  const { view, run, call } = useDm();
  const s = view.state;
  const seated = seatedPlayers(s) as DmPlayer[];
  const [name, setName] = useState("");
  const asked = useRef(false);

  // Everyone at the table needs a private link. Make any that are missing.
  const missing = seated.some((p) => !p.arrival?.token);
  useEffect(() => {
    if (missing && !asked.current) {
      asked.current = true;
      void call({ type: "arrival.issueLinks" }).then(() => (asked.current = false));
    }
  }, [missing, call]);

  const claimed = seated.filter((p) => p.arrival?.claimedAt).length;
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  return (
    <div className="arrival-panel">
      <section className="box">
        <div className="box-head">
          <h3>Arrival</h3>
          <span className="note">
            {claimed} of {seated.length} seats claimed
          </span>
        </div>
        <p className="note">
          Text each player their own link. It plays the intro once, then opens on their seat. The generic link <code>{origin + genericArrivalPath(s.id)}</code> plays the intro but can&rsquo;t claim a seat.
        </p>
        <div className="inline">
          <button className="btn primary" type="button" onClick={() => run({ type: "arrival.showTable" }, "The Table is on the TV.")}>
            Show The Table on the TV <span className="key">T</span>
          </button>
          <Check checked={!!s.arrival?.seatsLocked} onChange={(v) => run({ type: "arrival.settings", seatsLocked: v }, v ? "Seats locked. Names and lines can't change now." : "Seats unlocked.")}>
            Lock seats
          </Check>
        </div>
        <Field
          label="Message to copy ({link} is their link, {name} their name)"
          value={s.arrival?.template ?? DEFAULT_TEMPLATE}
          onCommit={(v) => run({ type: "arrival.settings", template: v }, "Message saved.")}
        />
      </section>

      <div className="arrival-list">
        {seated.map((p) => (
          <ArrivalRow key={p.id} p={p} />
        ))}
      </div>

      <form
        className="inline"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await run({ type: "player.add", name }, `Added ${name || "a player"}. Their link is ready.`)) setName("");
        }}
      >
        <label>
          Someone not here yet?
          <input className="fld" value={name} onChange={(e) => setName(e.target.value)} placeholder="Player name" />
        </label>
        <button className="btn" type="submit">
          Add player
        </button>
      </form>
    </div>
  );
}

function ArrivalRow({ p }: { p: DmPlayer }) {
  const { view, run, toast } = useDm();
  const [confirming, setConfirming] = useState(false);
  const a = p.arrival;
  const status = arrivalStatus(p);
  const reached = ORDER.indexOf(status);
  const link = a?.token ? window.location.origin + arrivalPath(view.state.id, a.token) : null;
  const times: Record<string, number | undefined> = { copied: a?.copiedAt, opened: a?.openedAt, finished: a?.finishedAt, claimed: a?.claimedAt };

  const copy = (text: string, msg: string, mark: boolean) =>
    void navigator.clipboard?.writeText(text).then(
      () => {
        toast(msg);
        if (mark) void run({ type: "arrival.copied", playerId: p.id });
      },
      () => toast(text),
    );

  return (
    <section className="box arrival-row">
      <div className="box-head">
        <h3>{p.name}</h3>
        <span className={`arrival-character${p.character ? "" : " none"}`}>{p.character || (a?.claimedAt ? "No name yet" : "")}</span>
      </div>
      {a?.why ? <p className="arrival-why">&ldquo;{a.why}&rdquo;</p> : null}
      <ol className="arrival-steps" aria-label={`${p.name}'s progress`}>
        {STEPS.map(([k, label]) => {
          // A later step implies the earlier ones, except copying (they may have got the link another way).
          const done = !!times[k] || (k !== "copied" && ORDER.indexOf(k) <= reached);
          return (
            <li key={k} className={done ? "done" : ""} title={when(times[k])}>
              <span aria-hidden="true">{done ? "✓" : "·"}</span> {label}
              {times[k] ? <small> {when(times[k])}</small> : null}
            </li>
          );
        })}
      </ol>
      <div className="inline">
        <button className="btn small primary" type="button" disabled={!link} onClick={() => link && copy(arrivalText(view.state.arrival?.template, link, p.name), `Copied the text for ${p.name}.`, true)}>
          Copy text
        </button>
        <button className="btn small" type="button" disabled={!link} onClick={() => link && copy(link, `Copied ${p.name}'s link.`, true)}>
          Copy link
        </button>
        {confirming ? (
          <>
            <button
              className="btn small danger"
              type="button"
              onClick={() => {
                setConfirming(false);
                void run({ type: "arrival.reset", playerId: p.id }, `${p.name} is back to new. Same link.`);
              }}
            >
              Yes, reset {p.name}
            </button>
            <button className="btn small" type="button" onClick={() => setConfirming(false)}>
              Cancel
            </button>
          </>
        ) : (
          <button className="btn small" type="button" disabled={status === "new" && !p.character} onClick={() => setConfirming(true)}>
            Reset
          </button>
        )}
      </div>
    </section>
  );
}
