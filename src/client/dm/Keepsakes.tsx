"use client";

// The DM's side of keepsakes: give one (from a suggestion, a Chronicle note, the
// fight's end card or a player's drawer), and "Tonight's keepsakes" at the end of
// a session. The app suggests a few moments; the DM writes the words, or skips.

import { useMemo, useState } from "react";
import { penName } from "@/shared/chronicle";
import { featureOn } from "@/shared/features";
import { KEEPSAKE_LINE_MAX, KEEPSAKE_NAME_MAX, keepsakesOf, keepsakeSuggestions, namesList, type KeepsakeSuggestion } from "@/shared/keepsakes";
import type { Keepsake, Session } from "@/shared/types";
import { useDm } from "./context";

export function useKeepsakesOn(): boolean {
  const { view } = useDm();
  return featureOn(view.state, "keepsakes");
}

interface Draft {
  playerIds: string[];
  name: string;
  line: string;
  source?: string;
}

/** Name, line, who, and Heroic Inspiration. Used for new keepsakes and for edits. */
export function KeepsakeForm({ initial, sessionId, editing, onDone, why }: { initial: Draft; sessionId?: string; editing?: Keepsake; onDone: () => void; why?: string }) {
  const { view, run } = useDm();
  const players = view.state.players.filter((p) => !p.archived);
  const [d, setD] = useState<Draft>(initial);
  const [inspire, setInspire] = useState(false);
  const [busy, setBusy] = useState(false);
  const who = d.playerIds.map((id) => players.find((p) => p.id === id)).filter((p) => !!p).map((p) => penName(p!));
  const submit = async () => {
    setBusy(true);
    const ok = editing
      ? await run({ type: "keepsake.edit", keepsakeId: editing.id, name: d.name, line: d.line, playerIds: d.playerIds }, "Keepsake updated.")
      : await run({ type: "keepsake.give", playerIds: d.playerIds, name: d.name, line: d.line, ...(sessionId ? { sessionId } : {}), ...(d.source ? { source: d.source } : {}), ...(inspire ? { inspire } : {}) });
    setBusy(false);
    if (ok) onDone();
  };
  return (
    <div className="ks-form">
      {why ? <p className="note ks-why">{why}</p> : null}
      <label className="ks-field">
        <span>What it is</span>
        <input className="fld" maxLength={KEEPSAKE_NAME_MAX} value={d.name} placeholder="Ogre's tooth, cracked" onChange={(e) => setD({ ...d, name: e.target.value })} />
      </label>
      <label className="ks-field">
        <span>What happened</span>
        <textarea className="fld" rows={2} maxLength={KEEPSAKE_LINE_MAX} value={d.line} placeholder="Felled the marsh ogre with one swing." onChange={(e) => setD({ ...d, line: e.target.value })} />
      </label>
      <fieldset className="ks-who">
        <legend>Who keeps it</legend>
        {players.map((p) => (
          <label key={p.id} className="check">
            <input
              type="checkbox"
              checked={d.playerIds.includes(p.id)}
              onChange={(e) => setD({ ...d, playerIds: e.target.checked ? [...d.playerIds, p.id] : d.playerIds.filter((x) => x !== p.id) })}
            />
            <span>{penName(p)}</span>
          </label>
        ))}
      </fieldset>
      {!editing ? (
        <label className="check ks-inspire">
          <input type="checkbox" checked={inspire} onChange={(e) => setInspire(e.target.checked)} />
          <span>Heroic Inspiration too{who.length ? ` (${namesList(who)})` : ""}</span>
        </label>
      ) : null}
      <div className="inline">
        <button type="button" className="btn primary small" disabled={busy || !d.name.trim() || !d.playerIds.length} onClick={() => void submit()}>
          {editing ? "Save" : who.length > 1 ? "Give it to them" : "Give it"}
        </button>
        <button type="button" className="btn small" onClick={onDone}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/** A button that opens the form in place. */
export function GiveKeepsake({ playerIds = [], line = "", sessionId, label = "Give a keepsake" }: { playerIds?: string[]; line?: string; sessionId?: string; label?: string }) {
  const on = useKeepsakesOn();
  const [open, setOpen] = useState(false);
  if (!on) return null;
  if (!open)
    return (
      <button type="button" className="btn small ks-give" onClick={() => setOpen(true)}>
        {label}
      </button>
    );
  return <KeepsakeForm initial={{ playerIds, name: "", line }} sessionId={sessionId} onDone={() => setOpen(false)} />;
}

/** One keepsake in a DM list, with edit and remove. */
function KeepsakeRow({ k }: { k: Keepsake }) {
  const { view, run } = useDm();
  const [editing, setEditing] = useState(false);
  const [sure, setSure] = useState(false);
  const who = k.playerIds.map((id) => view.state.players.find((p) => p.id === id)).filter((p) => !!p).map((p) => penName(p!));
  const ch = k.sessionId ? view.state.sessions.find((x) => x.id === k.sessionId)?.number : undefined;
  if (editing) return <KeepsakeForm initial={{ playerIds: k.playerIds, name: k.name, line: k.line }} editing={k} onDone={() => setEditing(false)} />;
  return (
    <li className="ks-row">
      <div className="ks-row-text">
        <b>{k.name}</b>
        {k.line ? <span>{k.line}</span> : null}
        <span className="note">
          {namesList(who)}
          {ch !== undefined ? ` · Chapter ${ch}` : ""}
        </span>
      </div>
      <div className="ks-row-acts">
        <button type="button" className="btn small" onClick={() => setEditing(true)}>
          Edit
        </button>
        {sure ? (
          <button type="button" className="btn small danger" onClick={() => void run({ type: "keepsake.remove", keepsakeId: k.id }, "Keepsake removed.")}>
            Remove it
          </button>
        ) : (
          <button type="button" className="btn small" onClick={() => setSure(true)}>
            Remove
          </button>
        )}
      </div>
    </li>
  );
}

/** On a player's drawer: their keepsakes and a Give button. */
export function PlayerKeepsakes({ playerId }: { playerId: string }) {
  const { view } = useDm();
  const on = useKeepsakesOn();
  if (!on) return null;
  const mine = keepsakesOf(view.state).filter((k) => k.playerIds.includes(playerId));
  return (
    <section className="ks-drawer" aria-label="Keepsakes">
      <h3>Keepsakes</h3>
      {mine.length ? (
        <ul className="ks-list">
          {[...mine].reverse().map((k) => (
            <KeepsakeRow key={k.id} k={k} />
          ))}
        </ul>
      ) : (
        <p className="note">None yet. Give one for a moment worth remembering, with a line about what happened.</p>
      )}
      <GiveKeepsake playerIds={[playerId]} />
    </section>
  );
}

/** One suggestion: what the app noticed, its drafted words, Give or Not this one. */
function Suggestion({ s, session }: { s: KeepsakeSuggestion; session: Session }) {
  const { view, run } = useDm();
  const [open, setOpen] = useState(false);
  const who = s.playerIds.map((id) => view.state.players.find((p) => p.id === id)).filter((p) => !!p).map((p) => penName(p!));
  if (open) return <KeepsakeForm initial={{ playerIds: s.playerIds, name: s.name, line: s.line, source: s.key }} sessionId={session.id} why={s.why} onDone={() => setOpen(false)} />;
  return (
    <li className="ks-row ks-sugg">
      <div className="ks-row-text">
        <span className="note ks-why">{s.why}</span>
        <b>{s.name}</b>
        <span>{s.line}</span>
        <span className="note">For {namesList(who)}</span>
      </div>
      <div className="ks-row-acts">
        <button type="button" className="btn primary small" onClick={() => setOpen(true)}>
          Write it
        </button>
        <button type="button" className="btn small" onClick={() => void run({ type: "keepsake.skip", sessionId: session.id, source: s.key })}>
          Not this one
        </button>
      </div>
    </li>
  );
}

/** "Tonight's keepsakes": in the End session step (and the run-game end step). */
export function TonightsKeepsakes({ session }: { session: Session }) {
  const { view } = useDm();
  const on = useKeepsakesOn();
  const s = view.state;
  const sugg = useMemo(() => keepsakeSuggestions(s, session.id), [s, session.id]);
  if (!on) return null;
  const given = keepsakesOf(s).filter((k) => k.sessionId === session.id);
  const party = session.attendeeIds.filter((id) => s.players.some((p) => p.id === id && !p.archived));
  return (
    <div className="ks-tonight">
      <p className="note">
        A keepsake is a small thing a character carries away from a real moment, with a line about it. One to three a night is plenty, and none is fine too. These are moments the app noticed. You write the words, and nothing goes out unless you give it.
      </p>
      {given.length ? (
        <ul className="ks-list" aria-label="Given tonight">
          {given.map((k) => (
            <KeepsakeRow key={k.id} k={k} />
          ))}
        </ul>
      ) : null}
      {sugg.length ? (
        <ul className="ks-list" aria-label="Moments worth one">
          {sugg.map((x) => (
            <Suggestion key={x.key} s={x} session={session} />
          ))}
        </ul>
      ) : (
        <p className="note">{given.length ? "Nothing else stood out." : "Nothing stood out to the app tonight. If something did to you, give one of your own."}</p>
      )}
      <GiveKeepsake playerIds={party.length === 1 ? party : []} sessionId={session.id} label="Give one of your own" />
    </div>
  );
}
