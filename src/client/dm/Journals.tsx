"use client";

import { useState } from "react";
import type { DmPlayer } from "@/shared/projection";
import { JOURNAL_HOOK_MAX, journalEmpty, noteWhen, type JournalGoal } from "@/shared/journal";
import { featureOn } from "@/shared/features";
import { useDm } from "./context";

function ago(t?: number): string {
  if (!t) return "";
  const mins = Math.round((Date.now() - t) / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  if (d < 14) return `${d} day${d === 1 ? "" : "s"} ago`;
  return new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** One goal, with your private hook idea under it. The player never sees the hook. */
function GoalRow({ p, g }: { p: DmPlayer; g: JournalGoal }) {
  const { run } = useDm();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(g.hook ?? "");
  const save = async () => {
    if (text.trim() === (g.hook ?? "")) return setOpen(false);
    if (await run({ type: "journal.hook", playerId: p.id, goalId: g.id, text }, text.trim() ? "Hook idea saved. Only you see it." : "Hook idea cleared.")) setOpen(false);
  };
  return (
    <li className={`jr-dm-goal${g.doneAt ? " done" : ""}`}>
      <div className="jr-dm-goal-top">
        <span className="jr-dm-goal-text">
          {g.doneAt ? <span className="tag">done</span> : null} {g.text}
        </span>
        {!open && !(g.doneAt && !g.hook) ? (
          <button type="button" className="btn small" onClick={() => (setText(g.hook ?? ""), setOpen(true))}>
            {g.hook ? "Edit hook" : "Add a hook"}
          </button>
        ) : null}
      </div>
      {open ? (
        <div className="jr-dm-hook-edit">
          <textarea className="fld" rows={2} maxLength={JOURNAL_HOOK_MAX} value={text} onChange={(e) => setText(e.target.value)} placeholder="How you might tie this in: an NPC, a rumor, a scene." aria-label={`Your hook idea for "${g.text}"`} autoFocus />
          <div className="inline">
            <button type="button" className="btn small" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn small primary" onClick={() => void save()}>
              Save
            </button>
          </div>
        </div>
      ) : g.hook ? (
        <p className="jr-dm-hook">
          <b>Your hook:</b> {g.hook}
        </p>
      ) : null}
    </li>
  );
}

/** The player's journal in their drawer: read-only for you, except your own hook ideas on their goals. */
export function PlayerJournal({ p }: { p: DmPlayer }) {
  const { view } = useDm();
  const [allNotes, setAllNotes] = useState(false);
  if (!featureOn(view.state, "journal") && journalEmpty(p.journal)) return null;
  const j = p.journal;
  const who = p.character || p.name;
  const notes = [...(j?.notes ?? [])].reverse();
  const shown = allNotes ? notes : notes.slice(0, 5);
  return (
    <section className="jr-dm" aria-label={`${who}'s journal`}>
      <h3>
        Journal{" "}
        {j?.updatedAt ? <span className="note">· written in {ago(j.updatedAt)}</span> : null}
      </h3>
      {!featureOn(view.state, "journal") ? <p className="note">Journals are off in Features, so their phone doesn&rsquo;t show it. Nothing was deleted.</p> : null}
      {journalEmpty(j) ? (
        <p className="note">Nothing yet. {who} can write goals, a backstory and private notes on their phone. Only they and you can read it.</p>
      ) : (
        <>
          <p className="note">Private to {who} and you. Hook ideas you add stay with you.</p>
          {j?.goals?.length ? (
            <>
              <h4>What {who} wants</h4>
              <ul className="jr-dm-goals">
                {j.goals.map((g) => (
                  <GoalRow key={g.id} p={p} g={g} />
                ))}
              </ul>
            </>
          ) : null}
          {j?.backstory ? (
            <>
              <h4>Backstory</h4>
              <div className="jr-dm-back">{j.backstory}</div>
            </>
          ) : null}
          {notes.length ? (
            <>
              <h4>Notes</h4>
              <ol className="jr-dm-notes">
                {shown.map((n) => (
                  <li key={n.id}>
                    <div className="jr-dm-note-text">{n.text}</div>
                    <div className="note">{[noteWhen(n), new Date(n.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })].filter(Boolean).join(" · ")}</div>
                  </li>
                ))}
              </ol>
              {notes.length > shown.length ? (
                <button type="button" className="linkish" onClick={() => setAllNotes(true)}>
                  Show all {notes.length} notes
                </button>
              ) : null}
            </>
          ) : null}
        </>
      )}
    </section>
  );
}

/** On the Players page: every open goal at the table, so prep can tie hooks in at a glance. */
export function GoalsBox({ onOpen }: { onOpen: (playerId: string) => void }) {
  const { view } = useDm();
  const s = view.state;
  if (!featureOn(s, "journal")) return null;
  const rows = s.players
    .filter((p) => !p.archived)
    .map((p) => ({ p, goals: (p.journal?.goals ?? []).filter((g) => !g.doneAt) }))
    .filter((r) => r.goals.length);
  if (!rows.length) return null;
  return (
    <section className="box jr-goals-box" aria-labelledby="jr-goals-box-h">
      <h3 id="jr-goals-box-h">What the characters want</h3>
      <p className="note">From each player&rsquo;s journal. Open a player to read the rest or jot a hook idea.</p>
      <ul>
        {rows.map(({ p, goals }) => (
          <li key={p.id}>
            <button type="button" className="row-main" onClick={() => onOpen(p.id)}>
              <span className="row-title">{p.character || p.name}</span>
              <span className="row-sub">
                {goals.map((g) => (
                  <span key={g.id} className="jr-goals-box-goal">
                    {g.text}
                    {g.hook ? <span className="tag">hook</span> : null}
                  </span>
                ))}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
