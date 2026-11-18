"use client";

// Secret whispers from the DM. A new one arrives sealed, so a neighbour glancing
// at the phone sees only that something came, not what it says. Tapping opens it
// (and tells the DM it was read). A player can answer quietly with one line.

import { useEffect, useRef, useState } from "react";
import type { PlayerView } from "@/shared/projection";
import { WHISPER_REPLY_MAX, type MyWhisper } from "@/shared/whispers";
import { Sheet } from "./Sheet";

type Send = (c: object) => Promise<string | null>;

function when(t: number): string {
  const m = Math.round((Date.now() - t) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  return new Date(t).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

/** The strip above the page: sealed while something's unread, quiet once read (tonight only). */
export function Whispers({ view, send }: { view: PlayerView; send: Send }) {
  const list = view.whispers ?? [];
  const unread = list.filter((w) => !w.seen);
  const tonight = list.filter((w) => w.tonight);
  const [open, setOpen] = useState(false);

  // A little buzz when a new one lands (phones that allow it). Not for ones already here on load.
  const known = useRef<Set<string> | null>(null);
  useEffect(() => {
    const ids = new Set(list.map((w) => w.id));
    const before = known.current;
    known.current = ids;
    if (!before) return;
    if (unread.some((w) => !before.has(w.id))) {
      try {
        navigator.vibrate?.([40, 60, 40]);
      } catch {}
    }
  }, [list, unread]);

  if (!unread.length && !tonight.length && !open) return null;
  return (
    <>
      {unread.length ? (
        <button type="button" className="pl-whisper sealed" onClick={() => setOpen(true)} aria-haspopup="dialog">
          <span className="pl-whisper-seal" aria-hidden="true" />
          <span className="pl-whisper-k">{unread.length > 1 ? `${unread.length} whispers from the DM` : "A whisper from the DM"}</span>
          <span className="pl-whisper-go">Tap to read</span>
        </button>
      ) : tonight.length ? (
        <button type="button" className="pl-whisper" onClick={() => setOpen(true)} aria-haspopup="dialog">
          <span className="pl-whisper-k">Whispers</span>
          <span className="pl-whisper-v">{tonight.length === 1 ? "1 from the DM tonight" : `${tonight.length} from the DM tonight`}</span>
          <span className="pl-whisper-go">Open</span>
        </button>
      ) : null}
      {open ? <WhisperSheet list={list} send={send} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

/** For "Your character": every whisper this phone still has, any time. */
export function WhisperHistoryButton({ view, send }: { view: PlayerView; send: Send }) {
  const list = view.whispers ?? [];
  const [open, setOpen] = useState(false);
  if (!list.length) return null;
  return (
    <>
      <button type="button" className="btn big" onClick={() => setOpen(true)}>
        Whispers from the DM ({list.length})
      </button>
      {open ? <WhisperSheet list={list} send={send} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function WhisperSheet({ list, send, onClose }: { list: MyWhisper[]; send: Send; onClose: () => void }) {
  // Opening marks everything here as read, once.
  const marked = useRef(new Set<string>());
  useEffect(() => {
    for (const w of list) {
      if (w.seen || marked.current.has(w.id)) continue;
      marked.current.add(w.id);
      void send({ type: "me.whisperSeen", whisperId: w.id });
    }
  }, [list, send]);
  return (
    <Sheet title="Whispers" onClose={onClose} className="pl-whisper-sheet">
      <p className="note pl-whisper-lede">Only you can see these. Keep them to yourself, or don&rsquo;t.</p>
      <ul className="pl-whisper-list">
        {list.map((w) => (
          <WhisperNote key={w.id} w={w} send={send} />
        ))}
      </ul>
    </Sheet>
  );
}

function WhisperNote({ w, send }: { w: MyWhisper; send: Send }) {
  const [writing, setWriting] = useState(false);
  const [text, setText] = useState(w.reply ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const answer = async (words: string) => {
    setBusy(true);
    const e = await send({ type: "me.whisperReply", whisperId: w.id, text: words });
    setBusy(false);
    setErr(e);
    if (!e) setWriting(false);
  };
  return (
    <li className={`pl-whisper-note${w.seen ? "" : " fresh"}`}>
      <div className="pl-whisper-when">{when(w.at)}</div>
      <p className="pl-whisper-text">{w.text}</p>
      {writing ? (
        <form
          className="pl-whisper-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) void answer(text);
          }}
        >
          <textarea className="fld" rows={2} maxLength={WHISPER_REPLY_MAX} value={text} autoFocus placeholder="Only the DM sees this" aria-label="Your quiet answer" onChange={(e) => setText(e.target.value)} />
          <div className="pl-whisper-acts">
            <button type="button" className="btn" onClick={() => (setWriting(false), setText(w.reply ?? ""))}>
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={busy || !text.trim()}>
              Send to the DM
            </button>
          </div>
        </form>
      ) : w.reply ? (
        <div className="pl-whisper-reply">
          <span className="pl-whisper-reply-k">You answered:</span> {w.reply}
          <span className="pl-whisper-acts">
            <button type="button" className="linkish" onClick={() => setWriting(true)}>
              Change
            </button>
            <button type="button" className="linkish" disabled={busy} onClick={() => void answer("")}>
              Take back
            </button>
          </span>
        </div>
      ) : (
        <button type="button" className="linkish pl-whisper-answer" onClick={() => setWriting(true)}>
          Answer quietly
        </button>
      )}
      {err ? (
        <p className="player-msg" role="alert">
          {err}
        </p>
      ) : null}
    </li>
  );
}
