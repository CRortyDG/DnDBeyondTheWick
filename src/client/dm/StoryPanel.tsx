"use client";

// The DM's Story tab: a summary of the storyboard and what needs attention.
// The board itself opens full-screen.

import { beatWarnings, STATUSES, storyOf, threadLabel, todayOf } from "@/shared/story";
import type { GameState } from "@/shared/types";
import { useDm } from "./context";

export function StoryPanel({ onOpen }: { onOpen: (beatId?: string) => void }) {
  const { view } = useDm();
  const g = view.state as unknown as GameState;
  const st = storyOf(g);
  const today = todayOf(Date.now());
  const warned = st.beats.map((b) => ({ b, w: beatWarnings(st, b, today) })).filter((x) => x.w.length);
  const next = st.dates.filter((d) => !d.cancelled && d.date >= today)[0];
  return (
    <div className="story-panel">
      <p className="note">Plan the year as story beats on threads, then place them into episodes. Only you ever see this.</p>
      <button type="button" className="btn big primary" onClick={() => onOpen()}>
        Open the storyboard
      </button>
      <ul className="story-counts">
        {STATUSES.map((x) => (
          <li key={x.id}>
            <b>{st.beats.filter((b) => b.status === x.id).length}</b> {x.label.toLowerCase()}
          </li>
        ))}
        <li>
          <b>{st.beats.filter((b) => !b.window).length}</b> floating
        </li>
      </ul>
      {next ? <p className="note">Next session date: {new Date(`${next.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}.</p> : <p className="note">No session dates yet. Add them from the storyboard.</p>}
      {warned.length ? (
        <section className="box">
          <h3>Needs a look</h3>
          <ul className="story-warn-list">
            {warned.map(({ b, w }) => (
              <li key={b.id}>
                <button type="button" className="chip-link" onClick={() => onOpen(b.id)}>
                  {b.title}
                </button>
                <span className="note"> · {w.map((x) => x.text).join(" ")}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <section className="box">
        <h3>Threads</h3>
        <ul className="story-thread-list">
          {st.threads.map((t) => (
            <li key={t.id} style={{ ["--thread" as string]: t.color }}>
              <b>{threadLabel(t, g.players)}</b> <span className="note">{st.beats.filter((b) => b.threadId === t.id).length} beats</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
