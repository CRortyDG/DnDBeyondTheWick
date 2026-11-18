"use client";

// "Last time on…": the recap card players get after a session. The DM's preview uses it too.

import type { LastTimeCard as Card } from "@/shared/lastTime";

export function LastTimeBody({ card, gameName }: { card: Pick<Card, "chapter" | "text" | "notes">; gameName: string }) {
  return (
    <div className="lt-card">
      <div className="lt-kicker">Last time on&hellip;</div>
      <div className="lt-title">
        {gameName ? `${gameName}, ` : ""}Chapter {card.chapter}
      </div>
      <div className="lt-text">
        {card.text
          .trim()
          .split(/\n\s*\n/)
          .map((p, i) => (
            <p key={i}>{p.trim()}</p>
          ))}
      </div>
      {card.notes.length ? (
        <ul className="lt-notes" aria-label="From the Chronicle">
          {card.notes.map((n, i) => (
            <li key={i}>
              <span className="lt-note">{n.text}</span>
              <span className="lt-by">{n.author}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
