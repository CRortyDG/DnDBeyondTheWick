"use client";

// The DM's Story tab: a summary of the storyboard and what needs attention.
// The board itself opens full-screen.

import { beatWarnings, STATUSES, storyOf, threadLabel, todayOf } from "@/shared/story";
import type { GameState } from "@/shared/types";
import { useDm } from "./context";
import { PageHead } from "./PageHead";
import { BookIcon } from "./navIcons";

export function StoryPanel({ onOpen }: { onOpen: (beatId?: string) => void }) {
  const { view } = useDm();
  const g = view.state as unknown as GameState;
  const st = storyOf(g);
  const today = todayOf(Date.now());
  const warned = st.beats.map((b) => ({ b, w: beatWarnings(st, b, today) })).filter((x) => x.w.length);
  const next = st.dates.filter((d) => !d.cancelled && d.date >= today)[0];
  const nextText = next ? new Date(`${next.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : "Not set";
  return (
    <div className="story-panel pg">
      <PageHead
        title="Storyboard"
        sub="Plan the year as story beats on threads, then place them into episodes."
        help={<p>Only you ever see the storyboard. It opens full-screen. Beats move from planned to placed (in an episode) to played; floating beats have no time window yet. Session dates are added on the storyboard.</p>}
        actions={
          <button type="button" className="btn primary" onClick={() => onOpen()}>
            <BookIcon size={16} /> Open the storyboard
          </button>
        }
        stats={[
          ...STATUSES.map((x) => ({ label: x.label, value: st.beats.filter((b) => b.status === x.id).length, tone: (x.id === "played" ? "ok" : x.id === "dropped" ? "muted" : undefined) as "ok" | "muted" | undefined })),
          { label: "Floating", value: st.beats.filter((b) => !b.window).length, tone: "muted" as const },
          { label: "Next session", value: nextText, tone: next ? ("gold" as const) : ("muted" as const) },
        ]}
      />
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
        <h3>
          Threads <span className="pg-count">{st.threads.length}</span>
        </h3>
        <ul className="story-thread-list">
          {st.threads.map((t) => (
            <li key={t.id} style={{ ["--thread" as string]: t.color }}>
              <button type="button" className="chip-link" onClick={() => onOpen()}>
                {threadLabel(t, g.players)}
              </button>{" "}
              <span className="note">{st.beats.filter((b) => b.threadId === t.id).length} beats</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
