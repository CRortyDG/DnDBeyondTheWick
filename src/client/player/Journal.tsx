"use client";

import { useState, type FormEvent } from "react";
import type { PlayerView } from "@/shared/projection";
import { JOURNAL_BACKSTORY_MAX, JOURNAL_GOAL_MAX, JOURNAL_GOALS_MAX, JOURNAL_NOTE_MAX, noteWhen, type JournalAct, type JournalGoal, type JournalNote } from "@/shared/journal";
import { useConfirm } from "./Sheet";

type Send = (c: object) => Promise<string | null>;

/**
 * The player's own journal: what their character wants, private notes, and
 * where they came from. Only they and the DM read it, and it says so up top.
 * It starts as three small invitations, and a part only takes room once
 * there's something in it.
 */
export function Journal({ view, send }: { view: PlayerView; send: Send }) {
  const me = view.me;
  const j = me.journal;
  const who = me.character ?? "your character";
  const [err, setErr] = useState<string | null>(null);
  const [adding, setAdding] = useState<null | "goal" | "note" | "backstory">(null);
  const [confirm, ask] = useConfirm();
  const act = async (a: JournalAct): Promise<boolean> => {
    const e = await send({ type: "me.journal", act: a });
    setErr(e);
    return !e;
  };
  const goals = j?.goals ?? [];
  const notes = j?.notes ?? [];
  const showGoals = goals.length > 0 || adding === "goal";
  const showNotes = notes.length > 0 || adding === "note";
  const showBack = !!j?.backstory || adding === "backstory";
  const empty = !showGoals && !showNotes && !showBack;

  return (
    <section className="jr" aria-labelledby="jr-h">
      {confirm}
      <header className="jr-head">
        <h2 id="jr-h">{me.character ? `${me.character}'s journal` : "Your journal"}</h2>
        <p className="jr-private">
          <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          <span>
            Just you and your DM. Other players never see it, and it never goes on the TV. Your DM may read it to weave your story in.
          </span>
        </p>
      </header>

      {empty ? (
        <div className="jr-start">
          <button type="button" className="jr-start-card" onClick={() => setAdding("goal")}>
            <b>What does {who} want?</b>
            <span>A goal or two: a person to find, a debt to pay, a name to clear.</span>
          </button>
          <button type="button" className="jr-start-card" onClick={() => setAdding("note")}>
            <b>Jot something down</b>
            <span>A suspicion, a name you heard, something to ask about later. Only for you.</span>
          </button>
          <button type="button" className="jr-start-card" onClick={() => setAdding("backstory")}>
            <b>Where do they come from?</b>
            <span>A line is plenty. You can add more whenever you like.</span>
          </button>
        </div>
      ) : null}

      {showGoals ? (
        <section className="jr-part" aria-labelledby="jr-goals-h">
          <h3 id="jr-goals-h">What {who} wants</h3>
          {goals.length ? (
            <ul className="jr-goals">
              {goals.map((g) => (
                <Goal key={g.id} g={g} act={act} onRemove={async () => (await ask({ title: "Remove this goal?", body: <p>&ldquo;{g.text}&rdquo;</p>, yes: "Remove", danger: true })) && void act({ op: "goalRemove", id: g.id })} />
              ))}
            </ul>
          ) : null}
          {goals.length < JOURNAL_GOALS_MAX ? <AddGoal startOpen={adding === "goal"} onDone={() => setAdding(null)} act={act} /> : null}
        </section>
      ) : null}

      {showNotes ? (
        <section className="jr-part" aria-labelledby="jr-notes-h">
          <h3 id="jr-notes-h">Notes</h3>
          <AddNote autoFocus={adding === "note"} act={act} onDone={() => setAdding(null)} />
          {notes.length ? (
            <ol className="jr-notes">
              {[...notes].reverse().map((n) => (
                <Note key={n.id} n={n} act={act} onRemove={async () => (await ask({ title: "Remove this note?", body: <p className="jr-quote">{n.text}</p>, yes: "Remove", danger: true })) && void act({ op: "noteRemove", id: n.id })} />
              ))}
            </ol>
          ) : null}
        </section>
      ) : null}

      {showBack ? (
        <section className="jr-part" aria-labelledby="jr-back-h">
          <h3 id="jr-back-h">Backstory</h3>
          <Backstory text={j?.backstory ?? ""} why={me.why} startOpen={adding === "backstory"} act={act} onDone={() => setAdding(null)} />
        </section>
      ) : null}

      {!empty ? (
        <div className="jr-more">
          {!showGoals ? (
            <button type="button" className="jr-chip" onClick={() => setAdding("goal")}>
              + A goal
            </button>
          ) : null}
          {!showNotes ? (
            <button type="button" className="jr-chip" onClick={() => setAdding("note")}>
              + A note
            </button>
          ) : null}
          {!showBack ? (
            <button type="button" className="jr-chip" onClick={() => setAdding("backstory")}>
              + Backstory
            </button>
          ) : null}
        </div>
      ) : null}

      {err ? (
        <p className="player-msg" role="alert">
          {err}
        </p>
      ) : null}
    </section>
  );
}

function Goal({ g, act, onRemove }: { g: JournalGoal; act: (a: JournalAct) => Promise<boolean>; onRemove: () => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(g.text);
  const done = !!g.doneAt;
  if (editing) {
    const save = async (e: FormEvent) => {
      e.preventDefault();
      if (text.trim() === g.text || (await act({ op: "goal", id: g.id, text }))) setEditing(false);
    };
    return (
      <li className="jr-goal editing">
        <form onSubmit={save} className="jr-inline">
          <input className="fld" value={text} maxLength={JOURNAL_GOAL_MAX} onChange={(e) => setText(e.target.value)} aria-label="Goal" autoFocus />
          <div className="jr-row">
            <button type="button" className="linkish danger" onClick={onRemove}>
              Remove
            </button>
            <span className="jr-grow" />
            <button type="button" className="btn small" onClick={() => (setText(g.text), setEditing(false))}>
              Cancel
            </button>
            <button type="submit" className="btn small primary" disabled={!text.trim()}>
              Save
            </button>
          </div>
        </form>
      </li>
    );
  }
  return (
    <li className={`jr-goal${done ? " done" : ""}`}>
      <button type="button" role="checkbox" aria-checked={done} className="jr-tick" aria-label={done ? `Done: ${g.text}. Mark not done.` : `Mark done: ${g.text}`} onClick={() => void act({ op: "goal", id: g.id, done: !done })}>
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
      </button>
      <button type="button" className="jr-goal-text" onClick={() => (setText(g.text), setEditing(true))} aria-label={`Edit goal: ${g.text}`}>
        {g.text}
      </button>
    </li>
  );
}

function AddGoal({ startOpen, onDone, act }: { startOpen: boolean; onDone: () => void; act: (a: JournalAct) => Promise<boolean> }) {
  const [open, setOpen] = useState(startOpen);
  const [text, setText] = useState("");
  if (!open)
    return (
      <button type="button" className="jr-add" onClick={() => setOpen(true)}>
        + Add a goal
      </button>
    );
  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (await act({ op: "goalAdd", text })) {
      setText("");
      setOpen(false);
      onDone();
    }
  };
  return (
    <form className="jr-inline" onSubmit={save}>
      <input className="fld" value={text} maxLength={JOURNAL_GOAL_MAX} onChange={(e) => setText(e.target.value)} placeholder="Find my brother. Win back the family ship." aria-label="New goal" autoFocus />
      <div className="jr-row">
        <span className="jr-grow" />
        <button type="button" className="btn small" onClick={() => (setText(""), setOpen(false), onDone())}>
          Cancel
        </button>
        <button type="submit" className="btn small primary" disabled={!text.trim()}>
          Add goal
        </button>
      </div>
    </form>
  );
}

function AddNote({ autoFocus, act, onDone }: { autoFocus: boolean; act: (a: JournalAct) => Promise<boolean>; onDone: () => void }) {
  const [text, setText] = useState("");
  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (await act({ op: "noteAdd", text })) {
      setText("");
      onDone();
    }
  };
  return (
    <form className="jr-add-note" onSubmit={save}>
      <textarea className="fld" rows={text.length > 80 ? 4 : 2} value={text} maxLength={JOURNAL_NOTE_MAX} onChange={(e) => setText(e.target.value)} placeholder="Something only you should remember…" aria-label="New note" autoFocus={autoFocus} />
      {text.trim() ? (
        <div className="jr-row">
          <span className="note">{JOURNAL_NOTE_MAX - text.length < 120 ? `${JOURNAL_NOTE_MAX - text.length} left` : ""}</span>
          <span className="jr-grow" />
          <button type="submit" className="btn small primary">
            Save note
          </button>
        </div>
      ) : null}
    </form>
  );
}

function Note({ n, act, onRemove }: { n: JournalNote; act: (a: JournalAct) => Promise<boolean>; onRemove: () => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(n.text);
  const when = [noteWhen(n), new Date(n.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })].filter(Boolean).join(" · ");
  if (editing) {
    const save = async (e: FormEvent) => {
      e.preventDefault();
      if (await act({ op: "note", id: n.id, text })) setEditing(false);
    };
    return (
      <li className="jr-note editing">
        <form onSubmit={save} className="jr-inline">
          <textarea className="fld" rows={4} value={text} maxLength={JOURNAL_NOTE_MAX} onChange={(e) => setText(e.target.value)} aria-label="Note" autoFocus />
          <div className="jr-row">
            <button type="button" className="linkish danger" onClick={onRemove}>
              Remove
            </button>
            <span className="jr-grow" />
            <button type="button" className="btn small" onClick={() => (setText(n.text), setEditing(false))}>
              Cancel
            </button>
            <button type="submit" className="btn small primary" disabled={!text.trim()}>
              Save
            </button>
          </div>
        </form>
      </li>
    );
  }
  return (
    <li className="jr-note">
      <button type="button" className="jr-note-body" onClick={() => (setText(n.text), setEditing(true))} aria-label={`Edit note from ${when}`}>
        <span className="jr-note-text">{n.text}</span>
        <span className="jr-note-when">
          {when}
          {n.editedAt ? " · edited" : ""}
        </span>
      </button>
    </li>
  );
}

function Backstory({ text, why, startOpen, act, onDone }: { text: string; why?: string; startOpen: boolean; act: (a: JournalAct) => Promise<boolean>; onDone: () => void }) {
  const [editing, setEditing] = useState(startOpen || !text);
  const [draft, setDraft] = useState(text);
  const [more, setMore] = useState(false);
  if (editing) {
    const save = async (e: FormEvent) => {
      e.preventDefault();
      if (draft.trim() === text || (await act({ op: "backstory", text: draft }))) {
        setEditing(false);
        onDone();
      }
    };
    return (
      <form className="jr-inline" onSubmit={save}>
        {!draft && why ? (
          <button type="button" className="jr-why" onClick={() => setDraft(why)}>
            <span>On the boat you said: &ldquo;{why}&rdquo;</span>
            <b>Start from that</b>
          </button>
        ) : null}
        <textarea
          className="fld jr-back-fld"
          rows={7}
          value={draft}
          maxLength={JOURNAL_BACKSTORY_MAX}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Where they grew up, who they left behind, what they're running from or toward."
          aria-label="Backstory"
          autoFocus={startOpen}
        />
        <div className="jr-row">
          <span className="note">{JOURNAL_BACKSTORY_MAX - draft.length < 400 ? `${JOURNAL_BACKSTORY_MAX - draft.length} left` : ""}</span>
          <span className="jr-grow" />
          <button type="button" className="btn small" onClick={() => (setDraft(text), setEditing(false), onDone())}>
            Cancel
          </button>
          <button type="submit" className="btn small primary">
            Save
          </button>
        </div>
      </form>
    );
  }
  const long = text.length > 320 || text.split("\n").length > 4;
  return (
    <div className="jr-back">
      <div className={`jr-back-text${long && !more ? " clipped" : ""}`}>{text}</div>
      <div className="jr-row">
        {long ? (
          <button type="button" className="linkish" onClick={() => setMore(!more)} aria-expanded={more}>
            {more ? "Show less" : "Read it all"}
          </button>
        ) : null}
        <span className="jr-grow" />
        <button type="button" className="btn small" onClick={() => (setDraft(text), setEditing(true))}>
          Edit
        </button>
      </div>
    </div>
  );
}
