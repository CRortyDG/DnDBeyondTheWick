"use client";

// Secret whispers: the DM's quick note to one player (or a few), on their device
// only. It floats like the dice tray and the soundboard, so it's one tap (or W)
// away on the console, in run-game mode and on the fight screen.

import { useEffect, useRef, useState } from "react";
import { penName } from "@/shared/chronicle";
import { featureOn } from "@/shared/features";
import { unreadReplies, whispersOf, WHISPER_MAX, type Whisper } from "@/shared/whispers";
import type { GameState } from "@/shared/types";
import { useDm } from "./context";
import { typing } from "./QuickBar";
import { useTablet } from "./tablet";
import "./whispers.css";

/** The header button. A dot shows when a player has answered and the DM hasn't looked yet. */
export function WhisperButton({ small, iconOnly }: { small?: boolean; iconOnly?: boolean }) {
  const { view, whisperOpen, toggleWhisper } = useDm();
  const s = view.state as unknown as GameState;
  const unread = whisperOpen ? 0 : unreadReplies(s).length;
  if (!featureOn(s, "whispers")) return null;
  return (
    <button
      type="button"
      className={`btn${small ? " small" : ""}${iconOnly ? " icon-only" : ""}${whisperOpen ? " on" : ""}`}
      aria-expanded={whisperOpen}
      onClick={() => toggleWhisper()}
      title="Whisper: a secret note to one player's device (W)"
      aria-label={unread ? `Whisper: ${unread} ${unread === 1 ? "answer" : "answers"} waiting` : "Whisper"}
    >
      <WhisperIcon />
      {iconOnly ? null : " Whisper"}
      {unread ? <span className="wh-dot" aria-hidden="true" /> : null}
    </button>
  );
}

export function WhisperIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M4 5.5h16v10H10l-4.5 3.5v-3.5H4z" />
      <path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01" strokeWidth={2.6} />
    </svg>
  );
}

function ago(t: number, now: number): string {
  const m = Math.round((now - t) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function WhisperPanel() {
  const { view, run, toast, whisperOpen: open, whisperFor, toggleWhisper } = useDm();
  const s = view.state as unknown as GameState;
  const tablet = useTablet();
  const [to, setTo] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLTextAreaElement>(null);

  // W opens and closes it anywhere in the DM view (but not while typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (typing(e) || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      if (e.key !== "w" && e.key !== "W") return;
      e.preventDefault();
      toggleWhisper();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleWhisper]);

  // Opened for someone (a player's row): pick just them.
  useEffect(() => {
    if (open && whisperFor?.length) setTo(whisperFor);
  }, [open, whisperFor]);
  useEffect(() => {
    if (open) box.current?.focus();
  }, [open]);

  // Looking at the panel reads the answers.
  const unread = unreadReplies(s).length;
  useEffect(() => {
    if (open && unread) void run({ type: "whisper.read" });
  }, [open, unread, run]);

  if (!open) return null;

  const people = s.players.filter((p) => !p.archived);
  const session = s.currentSessionId;
  // At the table first; away players after, still reachable (they may be playing from home).
  const here = people.filter((p) => !(session && p.away));
  const away = people.filter((p) => session && p.away);
  const name = (pid: string) => {
    const p = s.players.find((x) => x.id === pid);
    return p ? penName(p) : "Someone who left";
  };
  const picked = to.filter((pid) => people.some((p) => p.id === pid));
  const toggle = (pid: string) => setTo((t) => (t.includes(pid) ? t.filter((x) => x !== pid) : [...t, pid]));
  const allHere = here.length > 1 && here.every((p) => picked.includes(p.id));

  const send = async () => {
    const words = text.trim();
    if (!words || !picked.length || busy) return;
    setBusy(true);
    const ok = await run({ type: "whisper.send", to: picked, text: words });
    setBusy(false);
    if (ok) {
      setText("");
      toast(`Whispered to ${picked.map(name).join(", ")}.`);
      box.current?.focus();
    }
  };

  const recent = whispersOf(s).slice(-20).reverse();
  const now = Date.now();

  return (
    <>
      {tablet ? <div className="dt-scrim" role="presentation" onClick={() => toggleWhisper()} /> : null}
      <div
        className="box dt-panel wh-panel"
        role="dialog"
        aria-label="Whisper to a player"
        onKeyDown={(e) => {
          // Keep the fight screen's and run-game's keys out of the panel.
          e.stopPropagation();
          if (e.key === "Escape") toggleWhisper();
        }}
      >
        <div className="dt-head">
          <h2>Whisper</h2>
          <span className="spacer" />
          <button type="button" className="btn small" onClick={() => toggleWhisper()} aria-label="Close whispers">
            ×
          </button>
        </div>
        <p className="note hint wh-lede">Only the players you pick see it, on their own device. Never the TV.</p>

        {people.length ? (
          <div className="wh-to" role="group" aria-label="Whisper to">
            {here.map((p) => (
              <label key={p.id} className={`chip-check${picked.includes(p.id) ? " on" : ""}`}>
                <input type="checkbox" checked={picked.includes(p.id)} onChange={() => toggle(p.id)} />
                {penName(p)}
              </label>
            ))}
            {away.map((p) => (
              <label key={p.id} className={`chip-check wh-away${picked.includes(p.id) ? " on" : ""}`} title="Marked away tonight">
                <input type="checkbox" checked={picked.includes(p.id)} onChange={() => toggle(p.id)} />
                {penName(p)} <span className="wh-away-k">away</span>
              </label>
            ))}
            {here.length > 1 ? (
              <button type="button" className="linkish wh-all" onClick={() => setTo(allHere ? [] : here.map((p) => p.id))}>
                {allHere ? "Clear" : "Everyone here"}
              </button>
            ) : null}
          </div>
        ) : (
          <p className="note">No players yet. Whispers go to players once they&rsquo;ve joined.</p>
        )}

        <textarea
          ref={box}
          className="fld wh-text"
          rows={3}
          maxLength={WHISPER_MAX}
          placeholder="You notice the baker’s hands are shaking…"
          value={text}
          aria-label="What to whisper"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends; Shift+Enter is a new line.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <div className="wh-send-row">
          <span className="note hint">{picked.length ? `To ${picked.map(name).join(", ")}` : "Pick who hears it"}</span>
          <span className="spacer" />
          <button type="button" className="btn primary" disabled={!picked.length || !text.trim() || busy} onClick={() => void send()}>
            Send
          </button>
        </div>

        {recent.length ? (
          <section className="wh-log" aria-label="Recent whispers">
            <h3>Recent</h3>
            <ul>
              {recent.map((w) => (
                <WhisperRow key={w.id} w={w} name={name} now={now} onTakeBack={() => void run({ type: "whisper.remove", whisperId: w.id }, "Taken back. It's gone from their device.")} onAgain={() => (setTo(w.to), box.current?.focus())} />
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  );
}

function WhisperRow({ w, name, now, onTakeBack, onAgain }: { w: Whisper; name: (pid: string) => string; now: number; onTakeBack: () => void; onAgain: () => void }) {
  const read = w.to.filter((pid) => w.seen?.[pid]);
  return (
    <li className="wh-row">
      <div className="wh-row-head">
        <span className="wh-row-to">To {w.to.map(name).join(", ")}</span>
        <span className="wh-row-at">{ago(w.at, now)}</span>
      </div>
      <p className="wh-row-text">{w.text}</p>
      {w.replies?.map((r) => (
        <p key={r.playerId} className="wh-reply">
          <span className="wh-reply-who">{name(r.playerId)}:</span> {r.text}
        </p>
      ))}
      <div className="wh-row-foot">
        <span className={`wh-read${read.length === w.to.length ? " all" : ""}`}>
          {read.length === w.to.length ? (w.to.length > 1 ? "Read by all" : "Read") : read.length ? `Read by ${read.map(name).join(", ")}` : "Not read yet"}
        </span>
        <span className="spacer" />
        <button type="button" className="linkish" onClick={onAgain} title="Pick the same players again">
          Again
        </button>
        <button type="button" className="linkish" onClick={onTakeBack} title="Remove it from their device">
          Take back
        </button>
      </div>
    </li>
  );
}
