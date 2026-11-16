"use client";

// The Chronicle notes about one person: every note tagged with their name, and
// a box to add one already tagged. The DM sees the box open; phones pass
// `compact`, which keeps the box behind a small "Add a note" button and folds
// an empty list into one line.

import { useId, useState } from "react";
import { NOTE_MAX, tagKey, type ChronicleView } from "@/shared/chronicle";
import { NoteLine } from "./Chronicle";

type Send = (cmd: object) => Promise<string | null>;

export function notesAbout(view: ChronicleView, tags: string[]) {
  const keys = new Set(tags.map(tagKey));
  return view.notes
    .filter((n) => n.tags.some((t) => keys.has(tagKey(t))))
    .sort((a, b) => b.at - a.at);
}

export function PersonNotes({
  view,
  tags,
  name,
  send,
  compact = false,
  placeholder,
  empty,
}: {
  view: ChronicleView;
  tags: string[];
  name: string;
  send: Send;
  /** Phones: the box opens from a button, and no notes is one line. */
  compact?: boolean;
  placeholder?: string;
  /** Compact only: the one line shown when there are no notes. */
  empty?: string;
}) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(!compact);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fid = useId();
  const notes = notesAbout(view, tags);
  const chapters = new Map(view.chapters.map((c) => [c.id, c]));

  const post = async () => {
    const t = text;
    if (!t.trim() || busy) return;
    setText("");
    setBusy(true);
    const e = await send({
      type: view.dm ? "note.add" : "me.noteAdd",
      text: t,
      tags: tags.slice(0, 1),
    });
    setBusy(false);
    setErr(e);
    if (e) setText((cur) => cur || t);
    else if (compact) setOpen(false);
  };

  const addButton = (
    <button
      type="button"
      className="btn small pn-add"
      onClick={() => setOpen(true)}
    >
      + Add a note
    </button>
  );

  return (
    <div className={`person-notes${compact ? " compact" : ""}`}>
      {compact ? (
        notes.length ? (
          <div className="pn-head">
            <h3>
              Notes <span className="pn-count">{notes.length}</span>
            </h3>
            {open ? null : addButton}
          </div>
        ) : open ? null : (
          <div className="pn-empty">
            <span className="note">{empty ?? "No notes yet."}</span>
            {addButton}
          </div>
        )
      ) : null}
      {open ? (
        <form
          className="chron-add"
          onSubmit={(e) => {
            e.preventDefault();
            void post();
          }}
        >
          <label className="chron-add-label" htmlFor={fid}>
            A note about {name}
          </label>
          <textarea
            id={fid}
            className="fld chron-add-text"
            rows={2}
            maxLength={NOTE_MAX}
            value={text}
            placeholder={placeholder ?? `What did ${name} say or do?`}
            autoFocus={compact}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void post();
              }
            }}
          />
          <div className="chron-add-row">
            <button
              type="submit"
              className="btn primary chron-post"
              disabled={!text.trim() || busy}
            >
              Add note
            </button>
            {compact ? (
              <button
                type="button"
                className="btn small"
                onClick={() => {
                  setOpen(false);
                  setErr(null);
                }}
              >
                Cancel
              </button>
            ) : null}
            <span className="note">
              Goes in the Chronicle, tagged {tags[0]}.
            </span>
          </div>
          {err ? (
            <p className="note error-text" role="alert">
              {err}
            </p>
          ) : null}
        </form>
      ) : null}
      {compact && !notes.length ? null : (
        <div className="chron-page person-note-page">
          {notes.length ? (
            <ol className="chron-notes">
              {notes.map((n) => {
                const ch = chapters.get(n.chapterId);
                return ch ? (
                  <NoteLine
                    key={n.id}
                    note={n}
                    chapter={ch}
                    view={view}
                    send={send}
                    onTag={() => {}}
                  />
                ) : null;
              })}
            </ol>
          ) : (
            <p className="note">No notes about {name} yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
