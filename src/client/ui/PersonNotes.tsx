"use client";

// The Chronicle notes about one person: every note tagged with their name, and
// a box to add one already tagged. The same on phones and for the DM.

import { useId, useState } from "react";
import { NOTE_MAX, tagKey, type ChronicleView } from "@/shared/chronicle";
import { NoteLine } from "./Chronicle";

type Send = (cmd: object) => Promise<string | null>;

export function notesAbout(view: ChronicleView, tags: string[]) {
  const keys = new Set(tags.map(tagKey));
  return view.notes.filter((n) => n.tags.some((t) => keys.has(tagKey(t)))).sort((a, b) => b.at - a.at);
}

export function PersonNotes({ view, tags, name, send }: { view: ChronicleView; tags: string[]; name: string; send: Send }) {
  const [text, setText] = useState("");
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
    const e = await send({ type: view.dm ? "note.add" : "me.noteAdd", text: t, tags: tags.slice(0, 1) });
    setBusy(false);
    setErr(e);
    if (e) setText((cur) => cur || t);
  };

  return (
    <div className="person-notes">
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
          placeholder={`What did ${name} say or do?`}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void post();
            }
          }}
        />
        <div className="chron-add-row">
          <button type="submit" className="btn primary chron-post" disabled={!text.trim() || busy}>
            Add note
          </button>
          <span className="note">Goes in the Chronicle, tagged {tags[0]}.</span>
        </div>
        {err ? (
          <p className="note error-text" role="alert">
            {err}
          </p>
        ) : null}
      </form>
      <div className="chron-page person-note-page">
        {notes.length ? (
          <ol className="chron-notes">
            {notes.map((n) => {
              const ch = chapters.get(n.chapterId);
              return ch ? <NoteLine key={n.id} note={n} chapter={ch} view={view} send={send} onTag={() => {}} /> : null;
            })}
          </ol>
        ) : (
          <p className="note">No notes about {name} yet.</p>
        )}
      </div>
    </div>
  );
}
