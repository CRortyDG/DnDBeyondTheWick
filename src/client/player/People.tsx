"use client";

// The People tab on a phone: everyone the party has met, what they know about
// each of them, and the table's notes about them. Nobody unmet is ever here.

import { useEffect, useState } from "react";
import type { PlayerView } from "@/shared/projection";
import { moodLabel, type PublicNpc } from "@/shared/people";
import { PersonNotes, notesAbout } from "../ui/PersonNotes";
import { Portrait } from "../ui/Portrait";

type Send = (c: object) => Promise<string | null>;

const SEEN_KEY = "candlefair-people-seen";

function loadSeen(game: string): Record<string, number> | null {
  try {
    const all = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "{}") as Record<string, Record<string, number>>;
    return all[game] ?? null;
  } catch {
    return null;
  }
}
function saveSeen(game: string, seen: Record<string, number>) {
  try {
    const all = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "{}") as Record<string, Record<string, number>>;
    all[game] = seen;
    localStorage.setItem(SEEN_KEY, JSON.stringify(all));
  } catch {}
}

/** People with something new since this phone last opened them. */
export function usePeopleSeen(view: PlayerView) {
  const [seen, setSeen] = useState<Record<string, number> | null>(null);
  useEffect(() => setSeen(loadSeen(view.game.id) ?? {}), [view.game.id]);
  const isNew = (p: PublicNpc) => seen !== null && (seen[p.id] ?? 0) < p.updatedAt;
  const markSeen = (p: PublicNpc) => {
    const next = { ...(seen ?? {}), [p.id]: p.updatedAt };
    setSeen(next);
    saveSeen(view.game.id, next);
  };
  return { isNew, markSeen, newCount: view.people.filter(isNew).length };
}

export function People({ view, send, seen }: { view: PlayerView; send: Send; seen: ReturnType<typeof usePeopleSeen> }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = view.people.find((p) => p.id === openId);
  // Opening someone marks what's new about them as read, including anything revealed while it's open.
  useEffect(() => {
    if (open && seen.isNew(open)) seen.markSeen(open);
  }, [open, seen]);

  if (open) return <Person person={open} view={view} send={send} onBack={() => setOpenId(null)} />;

  return (
    <section className="box people" aria-label="People you've met">
      <div className="box-head">
        <h2>People you&rsquo;ve met</h2>
        <span className="note">{view.people.length} met</span>
      </div>
      {view.people.length ? (
        <ul className="people-grid">
          {view.people.map((p) => {
            const notes = notesAbout(view.chronicle, p.tags).length;
            return (
              <li key={p.id}>
                <button type="button" className="person-card" onClick={() => setOpenId(p.id)} aria-label={`${p.name}${seen.isNew(p) ? ", something new" : ""}`}>
                  <Portrait art={p.art} name={p.name} className="person-face" />
                  <span className="person-card-text">
                    <span className="person-name">
                      {p.name}
                      {seen.isNew(p) ? <span className="badge person-new">new</span> : null}
                    </span>
                    {p.title ? <span className="person-title">{p.title}</span> : null}
                    <span className="person-meta note">
                      {p.mood ? <span className={`mood mood-${p.mood}`}>{moodLabel(p.mood)}</span> : null}
                      {p.facts.length ? <span>{p.facts.length === 1 ? "1 thing known" : `${p.facts.length} things known`}</span> : null}
                      {notes ? <span>{notes === 1 ? "1 note" : `${notes} notes`}</span> : null}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="note">Nobody yet. Everyone the party meets in Candlefair turns up here, with what you learn about them.</p>
      )}
    </section>
  );
}

function Person({ person: p, view, send, onBack }: { person: PublicNpc; view: PlayerView; send: Send; onBack: () => void }) {
  useEffect(() => {
    window.scrollTo?.({ top: 0 });
  }, [p.id]);
  return (
    <section className="box person-page" aria-label={p.name}>
      <button type="button" className="btn small" onClick={onBack}>
        &larr; Everyone
      </button>
      <div className="person-head">
        <Portrait art={p.art} name={p.name} className="person-face big" />
        <div>
          <h2 className="person-page-name">{p.name}</h2>
          {p.title ? <div className="person-title">{p.title}</div> : null}
          <div className="person-meta note">
            {p.mood ? <span className={`mood mood-${p.mood}`}>{moodLabel(p.mood)}</span> : null}
            <span>{p.met.chapter ? `Met in Chapter ${p.met.chapter}` : "Met"}</span>
          </div>
        </div>
      </div>
      {p.blurb ? <p className="person-blurb">{p.blurb}</p> : null}
      <h3>What you know</h3>
      {p.facts.length ? (
        <ul className="person-facts">
          {p.facts.map((f) => (
            <li key={f.id}>{f.text}</li>
          ))}
        </ul>
      ) : (
        <p className="note">Nothing yet. The DM adds things here as you find them out.</p>
      )}
      <h3>The table&rsquo;s notes</h3>
      <PersonNotes view={view.chronicle} tags={p.tags} name={p.name} send={send} />
    </section>
  );
}
