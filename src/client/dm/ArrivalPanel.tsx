"use client";

import { useEffect, useRef, useState } from "react";
import { arrivalLook, arrivalPath, introKind, arrivalStatus, arrivalText, DEFAULT_TEMPLATE, genericArrivalPath, seatedPlayers, tableSeats, type ArrivalStatus } from "@/shared/arrival";
import type { DmPlayer } from "@/shared/projection";
import { starterById } from "@/shared/starters";
import { useDm } from "./context";
import { IntroEditor } from "./IntroEditor";
import { Field } from "./Field";
import { PageHead } from "./PageHead";
import { MenuItem, RowMenu } from "./RowMenu";

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
  const everyone = seatedPlayers(s) as DmPlayer[];
  // In a shared world: tonight's table only (the seated party and its guests).
  const seated = tableSeats(s) as DmPlayer[];
  const party = s.world ? (s.parties ?? []).find((x) => x.id === s.partyId) : undefined;
  const [name, setName] = useState("");
  const asked = useRef(false);

  // Everyone at the table needs a private link. Make any that are missing.
  const missing = everyone.some((p) => !p.arrival?.token);
  useEffect(() => {
    if (missing && !asked.current) {
      asked.current = true;
      void call({ type: "arrival.issueLinks" }).then(() => (asked.current = false));
    }
  }, [missing, call]);

  const claimed = seated.filter((p) => p.arrival?.claimedAt).length;
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  const opened = seated.filter((p) => p.arrival?.openedAt || p.arrival?.finishedAt || p.arrival?.claimedAt).length;
  const sent = seated.filter((p) => p.arrival?.copiedAt || p.arrival?.openedAt).length;

  return (
    <div className="arrival-panel pg">
      <PageHead
        title="Arrival"
        sub="Each player's private intro link, and how far they've got."
        help={
          <p>
            Text each player their own link. It plays the intro once (if this campaign has one), then opens on their seat. Set the intro up in the Intro card: none, your own video or GIF and slides, or Candlefair&rsquo;s boat. The generic link <code>{origin + genericArrivalPath(s.id)}</code> plays the intro but can&rsquo;t claim a seat. Lock seats once everyone has claimed, so names and lines can&rsquo;t change. When the last seat is claimed (or you lock seats), the door closes by itself, so a new name knocks instead of walking in; open it again under Players.
          </p>
        }
        actions={
          <>
            <button
              className={`btn${s.arrival?.seatsLocked ? " on" : ""}`}
              type="button"
              aria-pressed={!!s.arrival?.seatsLocked}
              onClick={() => run({ type: "arrival.settings", seatsLocked: !s.arrival?.seatsLocked }, !s.arrival?.seatsLocked ? "Seats locked. Names and lines can't change now." : "Seats unlocked.")}
            >
              {s.arrival?.seatsLocked ? "Seats locked" : "Lock seats"}
            </button>
            {arrivalLook(s).intro ? (
              <button className="btn" type="button" onClick={() => run({ type: "arrival.showIntro" }, "The intro is playing on the TV.")} title="Plays the intro on the TV, laid out for a wide screen. Step it along under the TV preview.">
                Play intro on TV
              </button>
            ) : null}
            <button className="btn primary" type="button" onClick={() => run({ type: "arrival.showTable" }, "The Table is on the TV.")}>
              Show The Table <span className="key">T</span>
            </button>
          </>
        }
        stats={[
          { label: "Seats claimed", value: `${claimed} of ${seated.length}`, tone: seated.length && claimed === seated.length ? "ok" : "gold" },
          { label: "Opened the intro", value: opened },
          { label: "Links sent", value: sent, tone: "muted" },
        ]}
      />

      {party ? (
        <p className="note">
          Showing tonight&rsquo;s table: {party.name}
          {seated.length < everyone.length ? ` (${everyone.length - seated.length} from other parties hidden)` : ""}. Seat another party from the top bar and The Table on the TV follows.
        </p>
      ) : null}

      <IntroEditor />

      <section className="box pg-card">
        <Field
          label="Message to copy ({link} is their link, {name} their name)"
          value={s.arrival?.template ?? DEFAULT_TEMPLATE}
          onCommit={(v) => run({ type: "arrival.settings", template: v }, "Message saved.")}
        />
        <details className="arrival-look">
          <summary>How the page reads for this campaign</summary>
          <Field label="Place name on the seat page and the TV Table" value={s.arrival?.title ?? ""} placeholder={arrivalLook({ ...s, arrival: {} }).title} onCommit={(v) => run({ type: "arrival.settings", title: v }, "Saved.")} />
          {introKind(s) === "builtin" ? (
            <Field label="Ship’s captain in the boat intro" value={s.arrival?.captain ?? ""} placeholder="Orsa Dell" onCommit={(v) => run({ type: "arrival.settings", captain: v }, "Saved.")} />
          ) : null}
        </details>
      </section>

      <ol className="scene-list pg-list">
        {seated.map((p) => (
          <ArrivalRow key={p.id} p={p} />
        ))}
        {seated.length === 0 ? <li className="pg-empty">Nobody at the table yet. Add a player below and their link is ready.</li> : null}
      </ol>

      <form
        className="pg-inline-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await run({ type: "player.add", name }, `Added ${name || "a player"}. Their link is ready.`)) setName("");
        }}
      >
        <input className="fld" value={name} onChange={(e) => setName(e.target.value)} placeholder="Someone not here yet? Their name" aria-label="New player's name" />
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
  const starter = starterById(a?.pick);
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

  const sub = [p.character || (a?.claimedAt ? "No character name yet" : ""), starter ? `${starter.title} (${starter.dnd.cls})` : ""].filter(Boolean).join(" · ");

  return (
    <li className={`scene-item list-row arrival-row status-${status}`}>
      <div className="scene-row">
        <span className="pg-avatar" aria-hidden="true">
          {p.name.trim().charAt(0).toUpperCase() || "?"}
        </span>
        <div className="row-main as-text">
          <span className="row-title">{p.name}</span>
          <span className="row-sub" title={a?.why ? `“${a.why}”` : undefined}>
            {sub || "Not started"}
            {a?.why ? <span className="arrival-why-inline"> &middot; &ldquo;{a.why}&rdquo;</span> : null}
          </span>
        </div>
        <ol className="pg-steps" aria-label={`${p.name}'s progress`}>
          {STEPS.map(([k, label]) => {
            // A later step implies the earlier ones, except copying (they may have got the link another way).
            const done = !!times[k] || (k !== "copied" && ORDER.indexOf(k) <= reached);
            return (
              <li key={k} className={done ? "done" : ""} title={times[k] ? `${label}: ${when(times[k])}` : label}>
                <span className="dot" aria-hidden="true" />
                <span className="lbl">{label}</span>
                <span className="sr-only">{done ? " (done)" : " (not yet)"}</span>
              </li>
            );
          })}
        </ol>
        {confirming ? (
          <>
            <button className="btn small" type="button" onClick={() => setConfirming(false)}>
              Keep
            </button>
            <button
              className="btn small danger"
              type="button"
              onClick={() => {
                setConfirming(false);
                void run({ type: "arrival.reset", playerId: p.id }, `${p.name} is back to new. Same link.`);
              }}
            >
              Reset {p.name}
            </button>
          </>
        ) : (
          <>
            <button className="btn small" type="button" disabled={!link} onClick={() => link && copy(link, `Copied ${p.name}'s link.`, true)}>
              Copy link
            </button>
            <button className={`btn small${status === "new" ? " primary" : ""}`} type="button" disabled={!link} onClick={() => link && copy(arrivalText(view.state.arrival?.template, link, p.name), `Copied the text for ${p.name}.`, true)}>
              Copy text
            </button>
            <RowMenu label={p.name}>
              <MenuItem disabled={status === "new" && !p.character} title="Back to new. The link stays the same." onClick={() => setConfirming(true)}>
                Reset progress
              </MenuItem>
            </RowMenu>
          </>
        )}
      </div>
    </li>
  );
}
