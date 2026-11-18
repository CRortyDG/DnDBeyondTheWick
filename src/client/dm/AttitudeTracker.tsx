"use client";

// A person's attitude toward the party, in their Discover drawer: the dial
// (Hostile to Ally), quick +/- moves with a reason, each character's own
// standing, and the history. The campaign's tracker settings sit at the
// bottom, folded away.

import { useState } from "react";
import { ATTITUDE_REASON_MAX, attitudeSettings, BANDS, bandInfo, offsetOf, partyScore, relationOf, scoreFor, signed } from "@/shared/attitude";
import { featureOn } from "@/shared/features";
import { penName } from "@/shared/chronicle";
import { presentIds } from "@/shared/world";
import type { AttitudeSettings, Entry, Player, Relation } from "@/shared/types";
import { useDm } from "./context";
import { AttitudeDial } from "../ui/AttitudeDial";

/** Reasons a DM reaches for, as one tap. */
const QUICK_REASONS = ["Helped them", "Paid well", "Kept a promise", "Flattered them", "Lied to them", "Threatened them", "Broke a promise", "Hurt someone they love"];

const SHOW: { id: AttitudeSettings["show"]; label: string }[] = [
  { id: "none", label: "Nothing" },
  { id: "band", label: "The band only (Friendly)" },
  { id: "dial", label: "The band and the dial" },
  { id: "reasons", label: "The dial and the reasons" },
];

export function AttitudeTracker({ entry: e, players }: { entry: Entry; players: Player[] }) {
  const { view, run } = useDm();
  const s = view.state;
  const set = attitudeSettings(s);
  const on = featureOn(s, "attitudes");
  const here = s.world ? presentIds(s).filter((id) => players.some((p) => p.id === id)) : [];
  // Who a move is for: the party, the characters at the table (shared world), or one character.
  const [target, setTarget] = useState<string>(s.world && here.length ? "here" : "party");
  const [reason, setReason] = useState("");
  const [secret, setSecret] = useState(false);
  const [tv, setTv] = useState(set.tv);
  const [showAll, setShowAll] = useState(false);
  const party = partyScore(e);
  const band = relationOf(e);
  const name = (id: string) => {
    const p = s.players.find((x) => x.id === id);
    return p ? penName(p) : "someone who left";
  };
  const apart = players.filter((p) => offsetOf(e, p.id) !== 0).map((p) => ({ id: p.id, name: penName(p), score: scoreFor(e, p.id) }));
  const ids = target === "party" ? undefined : target === "here" ? here : [target];
  const move = async (delta: number) => {
    const ok = await run({ type: "entry.attitude", entryId: e.id, delta, reason: reason.trim(), ...(ids?.length ? { playerIds: ids } : {}), ...(secret ? { secret: true } : {}), ...(tv ? { tv: true } : {}) });
    if (ok) setReason("");
  };
  const log = [...(e.attitudeLog ?? [])].reverse();
  const shown = showAll ? log : log.slice(0, 6);
  const chapter = (sid: string | null | undefined) => (sid ? s.sessions.find((x) => x.id === sid)?.number : undefined);

  return (
    <section className="att" aria-label="Attitude">
      <h4>How they feel about the party</h4>
      {!on ? <p className="note">NPC attitudes are off in Features, so players don&rsquo;t see any of this. Locks that need someone&rsquo;s goodwill still work.</p> : null}
      <div className="att-head">
        <span className={`relation relation-${band}`}>{bandInfo(band).label}</span>
        <span className="att-score">{signed(party)}</span>
        <span className="note">{bandInfo(band).blurb}</span>
      </div>
      <AttitudeDial score={party} others={apart} />

      <div className="att-move">
        <div className="inline att-move-row">
          <label>
            <span className="sr-only">Who for</span>
            <select className="fld" value={target} onChange={(ev) => setTarget(ev.target.value)} aria-label="Who for">
              <option value="party">The whole party</option>
              {here.length ? <option value="here">Everyone at the table ({here.length})</option> : null}
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  Only {penName(p)}
                </option>
              ))}
            </select>
          </label>
          <input className="fld att-reason" value={reason} maxLength={ATTITUDE_REASON_MAX} onChange={(ev) => setReason(ev.target.value)} placeholder="Why? e.g. Paid off her debt" aria-label="Why" />
        </div>
        <div className="att-chips" aria-label="Quick reasons">
          {QUICK_REASONS.map((r) => (
            <button key={r} type="button" className={`att-chip${reason === r ? " on" : ""}`} onClick={() => setReason(reason === r ? "" : r)}>
              {r}
            </button>
          ))}
        </div>
        <div className="inline att-buttons">
          {[-3, -1].map((d) => (
            <button key={d} type="button" className="btn small att-down" onClick={() => void move(d)}>
              {signed(d)}
            </button>
          ))}
          {[1, 3].map((d) => (
            <button key={d} type="button" className="btn small att-up" onClick={() => void move(d)}>
              {signed(d)}
            </button>
          ))}
          <span className="spacer" />
          <label className="check" title="Players never see the reason">
            <input type="checkbox" checked={secret} onChange={(ev) => setSecret(ev.target.checked)} /> Keep the reason secret
          </label>
          <label className="check" title="Only when their band changes, and only once the party has met them">
            <input type="checkbox" checked={tv} onChange={(ev) => setTv(ev.target.checked)} /> Banner on the TV
          </label>
        </div>
      </div>

      {players.length ? (
        <details className="att-chars" open={apart.length > 0}>
          <summary>Each character {apart.length ? <span className="note">· {apart.length === 1 ? "1 stands apart" : `${apart.length} stand apart`}</span> : null}</summary>
          <ul className="att-char-list">
            {players.map((p) => {
              const sc = scoreFor(e, p.id);
              const off = offsetOf(e, p.id);
              const r = relationOf(e, p.id);
              return (
                <li key={p.id}>
                  <span className="att-char-name">{penName(p)}</span>
                  <span className={`relation relation-${r}`}>{bandInfo(r).label}</span>
                  <span className="note">
                    {signed(sc)}
                    {off ? ` (party ${signed(off)})` : ""}
                  </span>
                  <span className="spacer" />
                  <select className="fld" value={off ? r : ""} aria-label={`Set ${penName(p)} directly`} onChange={(ev) => void run({ type: "entry.relationFor", entryId: e.id, playerId: p.id, relation: (ev.target.value || null) as Relation | null })}>
                    <option value="">Same as the party</option>
                    {BANDS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </li>
              );
            })}
          </ul>
        </details>
      ) : null}

      <div className="inline att-set">
        <label>
          Set the party directly
          <select className="fld" value={band} onChange={(ev) => void run({ type: "entry.update", entryId: e.id, patch: { relation: ev.target.value as Relation } })}>
            {BANDS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {log.length ? (
        <>
          <h5 className="att-h5">What moved them</h5>
          <ol className="att-log">
            {shown.map((x) => {
              const ch = chapter(x.sessionId);
              const who = x.playerIds?.length ? x.playerIds.map(name).join(", ") : "";
              return (
                <li key={x.id} className={x.delta > 0 ? "up" : x.delta < 0 ? "down" : ""}>
                  <span className="att-delta">{signed(x.delta)}</span>
                  <span className="att-why">
                    {x.reason || <span className="note">No reason given</span>}
                    <span className="note">
                      {" "}
                      · {x.from === x.to ? bandInfo(x.to).label : `${bandInfo(x.from).label} → ${bandInfo(x.to).label}`}
                      {who ? ` · ${who}` : ""}
                      {ch ? ` · Chapter ${ch}` : ""}
                      {x.source === "job" ? " · from a job" : x.source === "beat" ? " · from the run sheet" : ""}
                      {x.secret ? " · secret" : ""}
                    </span>
                  </span>
                  <span className="att-log-actions">
                    {set.show === "reasons" && x.source !== "set" && x.reason ? (
                      <button type="button" className="linkish" onClick={() => void run({ type: "entry.attitudeSecret", entryId: e.id, shiftId: x.id, secret: !x.secret })}>
                        {x.secret ? "Show players" : "Hide from players"}
                      </button>
                    ) : null}
                    <button type="button" className="linkish" onClick={() => void run({ type: "entry.attitudeUndo", entryId: e.id, shiftId: x.id }, "Taken back.")}>
                      Undo
                    </button>
                  </span>
                </li>
              );
            })}
          </ol>
          {log.length > shown.length ? (
            <button type="button" className="linkish" onClick={() => setShowAll(true)}>
              Show all {log.length}
            </button>
          ) : null}
        </>
      ) : null}

      <AttitudeSettingsBox />
    </section>
  );
}

/** The campaign's tracker settings. */
export function AttitudeSettingsBox() {
  const { view, run } = useDm();
  const set = attitudeSettings(view.state);
  const patch = (p: Partial<AttitudeSettings>) => run({ type: "attitudes.set", patch: p });
  return (
    <details className="att-settings">
      <summary>Tracker settings for this campaign</summary>
      <div className="att-settings-body">
        <label>
          Players see
          <select className="fld" value={set.show} onChange={(ev) => void patch({ show: ev.target.value as AttitudeSettings["show"] })}>
            {SHOW.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          A job done for them
          <select className="fld" value={set.jobs} onChange={(ev) => void patch({ jobs: Number(ev.target.value) })}>
            <option value={0}>Doesn&rsquo;t move the dial</option>
            {[1, 2, 3].map((n) => (
              <option key={n} value={n}>
                Moves it {signed(n)}
              </option>
            ))}
          </select>
        </label>
        <label className="check">
          <input type="checkbox" checked={set.tv} onChange={(ev) => void patch({ tv: ev.target.checked })} /> Banner band changes on the TV by default
        </label>
        <p className="note">Players only ever see their own character&rsquo;s standing. A job counts as &ldquo;for&rdquo; someone when it needs their goodwill or is signed with their name. Run sheets can add a button with a line like &ldquo;mood: person/mags +2 Saved her cat&rdquo;.</p>
      </div>
    </details>
  );
}
