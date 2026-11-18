"use client";

// The DM's side of "Last time on…": review and edit the players' recap card, then
// send it when the session ends (or any time after, from the Chronicle).

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { lastTimeDraft, lastTimeNoteChoices, LAST_TIME_NOTES_MAX, LAST_TIME_TEXT_MAX } from "@/shared/lastTime";
import type { Session } from "@/shared/types";
import { LastTimeBody } from "../ui/LastTimeCard";
import { useDm } from "./context";

const sameIds = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);
const clock = (ms: number) => new Date(ms).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });

export function useLastTime(session: Session): { body: ReactNode; flush: () => Promise<void> } {
  const { view, run, call, toast } = useDm();
  const s = view.state;
  const saved = session.playerRecap;
  const ended = session.endedAt !== null;
  const draft = useMemo(() => lastTimeDraft(s, session.id), [s, session.id]);
  const choices = useMemo(() => lastTimeNoteChoices(s, session.id), [s, session.id]);
  const authors = useMemo(() => new Map(view.chronicle.notes.map((n) => [n.id, n.author])), [view.chronicle.notes]);

  // Until the DM touches it, the card follows the server (or the app's draft, if nothing's saved yet).
  const touched = useRef(false);
  const [text, setText] = useState(saved?.text ?? draft.text);
  const [noteIds, setNoteIds] = useState<string[]>(saved?.noteIds ?? draft.noteIds);
  const [onEnd, setOnEnd] = useState(saved ? !!saved.onEnd : true);
  const [state, setState] = useState<"saved" | "typing" | "saving">("saved");
  useEffect(() => {
    if (touched.current) return;
    setText(saved?.text ?? draft.text);
    setNoteIds(saved?.noteIds ?? draft.noteIds);
    setOnEnd(saved ? !!saved.onEnd : true);
  }, [saved, draft]);

  const latest = useRef({ text, noteIds, onEnd });
  latest.current = { text, noteIds, onEnd };
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const save = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setState("saving");
    const v = latest.current;
    await call({ type: "lastTime.save", sessionId: session.id, text: v.text, noteIds: v.noteIds, onEnd: v.onEnd });
    touched.current = false;
    setState("saved");
  }, [call, session.id]);
  const edit = (patch: Partial<{ text: string; noteIds: string[]; onEnd: boolean }>) => {
    touched.current = true;
    if (patch.text !== undefined) setText(patch.text);
    if (patch.noteIds !== undefined) setNoteIds(patch.noteIds);
    if (patch.onEnd !== undefined) setOnEnd(patch.onEnd);
    latest.current = { ...latest.current, ...patch };
    setState("typing");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void save(), 800);
  };
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  /** Before "End session": keeps what the DM sees (the app's draft too) so it goes out as shown. */
  const flush = useCallback(async () => {
    const v = latest.current;
    if (touched.current || (!ended && v.onEnd && v.text.trim() && !saved)) await save();
  }, [ended, save, saved]);

  const sent = saved?.sent;
  const changed = !!sent && (sent.text !== text || !sameIds(sent.noteIds, noteIds));
  const send = async () => {
    if (timer.current) clearTimeout(timer.current);
    touched.current = false;
    await run({ type: "lastTime.send", sessionId: session.id, text, noteIds }, sent ? "Players have the new version." : "Sent to players.");
    setState("saved");
  };
  const preview = { chapter: session.number, text, notes: noteIds.filter((id) => authors.has(id)).map((id) => ({ text: choices.find((n) => n.id === id)?.text ?? "", author: authors.get(id)! })) };

  const body = (
    <div className="lt-edit">
      <p className="note">
        Players get this on their phone or computer as &ldquo;Last time on&hellip;&rdquo;. It starts from your recap, what they discovered and the starred notes, but only what you see here goes out, and only {ended ? "when you press Send" : "once the session has ended"}.
        {state === "saving" ? " Saving…" : state === "typing" ? " …" : ""}
      </p>
      <textarea
        className="fld lt-edit-text"
        rows={6}
        maxLength={LAST_TIME_TEXT_MAX}
        value={text}
        placeholder="Last time, the party… (a few lines in their words)"
        onChange={(e) => edit({ text: e.target.value })}
        onBlur={() => (touched.current ? void save() : undefined)}
      />
      {draft.text && draft.text !== text ? (
        <button type="button" className="linkish" onClick={() => edit({ text: draft.text })}>
          Start again from the recap and discoveries
        </button>
      ) : null}
      {choices.length ? (
        <fieldset className="lt-edit-notes">
          <legend>Notes from the table to put under it</legend>
          {choices.map((n) => {
            const on = noteIds.includes(n.id);
            return (
              <label key={n.id} className="check">
                <input
                  type="checkbox"
                  checked={on}
                  disabled={!on && noteIds.length >= LAST_TIME_NOTES_MAX}
                  onChange={(e) => edit({ noteIds: e.target.checked ? [...noteIds, n.id] : noteIds.filter((x) => x !== n.id) })}
                />
                <span>
                  {n.starred ? "★ " : ""}
                  {n.text.length > 140 ? `${n.text.slice(0, 140)}…` : n.text} <span className="note">· {authors.get(n.id) ?? n.authorName}</span>
                </span>
              </label>
            );
          })}
        </fieldset>
      ) : null}
      {text.trim() ? (
        <details className="lt-edit-preview">
          <summary>What players will see</summary>
          <LastTimeBody card={preview} gameName={s.name} />
        </details>
      ) : null}
      {!ended ? (
        <label className="check lt-edit-onend">
          <input type="checkbox" checked={onEnd} onChange={(e) => edit({ onEnd: e.target.checked })} />
          <span>Send it to players when I end the session</span>
        </label>
      ) : (
        <div className="lt-edit-acts">
          <span className="note" role="status">
            {sent ? (changed ? `Players have the version from ${clock(sent.at)}. You've changed it since.` : `Sent to players ${clock(sent.at)}.`) : "Not sent yet."}
          </span>
          {!sent || changed ? (
            <button type="button" className="btn primary small" disabled={!text.trim()} onClick={() => void send()}>
              {sent ? "Send the update" : "Send to players"}
            </button>
          ) : null}
          {sent ? (
            <button
              type="button"
              className="btn small"
              onClick={async () => {
                const r = await call({ type: "lastTime.unsend", sessionId: session.id });
                toast(r.error ?? "Taken back off players' devices.");
              }}
            >
              Take it back
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
  return { body, flush };
}

/** Under an ended chapter in the DM's Chronicle. */
export function LastTimeChapter({ session }: { session: Session }) {
  const { body } = useLastTime(session);
  const sent = session.playerRecap?.sent;
  const [open, setOpen] = useState(!sent);
  return (
    <details className="chron-lt-dm" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>
        Players&rsquo; recap card <span className="note">· {sent ? "sent" : "not sent"}</span>
      </summary>
      {body}
    </details>
  );
}
