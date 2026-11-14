"use client";

// The Discovery tab on a phone: everything the party knows of, by kind. Rumors
// show as silhouettes with a hint; found entries open into what you know about
// them and the table's notes. Nothing hidden is ever here.

import { useEffect, useState } from "react";
import type { PlayerView } from "@/shared/projection";
import { kindInfo, KINDS, relationLabel, stageLabel, type PublicEntry } from "@/shared/discovery";
import { PersonNotes, notesAbout } from "../ui/PersonNotes";
import { Portrait } from "../ui/Portrait";
import { Leads } from "./Leads";

type Send = (c: object) => Promise<string | null>;

const SEEN_KEY = "candlefair-discovery-seen";

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

/** Entries with something new since this phone last looked at them. */
export function useDiscoverySeen(view: PlayerView) {
  const [seen, setSeen] = useState<Record<string, number> | null>(null);
  useEffect(() => setSeen(loadSeen(view.game.id) ?? {}), [view.game.id]);
  const isNew = (e: PublicEntry) => seen !== null && (seen[e.id] ?? -1) < e.updatedAt;
  const markSeen = (list: PublicEntry[]) => {
    const fresh = list.filter(isNew);
    if (!fresh.length) return;
    const next = { ...(seen ?? {}) };
    for (const e of fresh) next[e.id] = e.updatedAt;
    setSeen(next);
    saveSeen(view.game.id, next);
  };
  return { isNew, markSeen, newCount: view.entries.filter(isNew).length };
}

export function Discovery({ view, send, seen }: { view: PlayerView; send: Send; seen: ReturnType<typeof useDiscoverySeen> }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = view.entries.find((e) => e.id === openId && e.stage !== "rumored");
  // Opening a found entry marks it read. Rumors are read by being on screen.
  useEffect(() => {
    if (open) seen.markSeen([open]);
  }, [open, seen]);
  const rumors = view.entries.filter((e) => e.stage === "rumored");
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => seen.markSeen(rumors), 2500);
      return () => clearTimeout(t);
    }
  }, [open, rumors, seen]);

  if (open) return <EntryPage entry={open} view={view} send={send} onOpen={setOpenId} onBack={() => setOpenId(null)} />;

  const kinds = [...KINDS.map((k) => k.id), ...new Set(view.entries.map((e) => e.kind).filter((k) => !KINDS.some((x) => x.id === k)))];
  const sections = kinds.map((k) => ({ k, list: view.entries.filter((e) => e.kind === k) })).filter((x) => x.list.length);

  if (!sections.length) {
    return (
      <>
        <Leads leads={view.leads} send={send} />
        <section className="box">
          <h2>Discoveries</h2>
          <p className="note">Nothing yet. The people, places and secrets of Candlefair turn up here as you find them.</p>
        </section>
      </>
    );
  }
  return (
    <>
      <Leads leads={view.leads} send={send} />
      <Areas view={view} />
      {sections.map(({ k, list }) => {
        const info = kindInfo(k);
        const found = list.filter((e) => e.stage !== "rumored").length;
        return (
          <section key={k} className="box discovery" aria-label={info.plural}>
            <div className="box-head">
              <h2>{info.plural}</h2>
              <span className="note">
                {info.found} {found}
                {list.length > found ? ` · ${list.length - found} rumored` : ""}
              </span>
            </div>
            <ul className="people-grid">
              {list.map((e) => (
                <li key={e.id}>
                  <EntryCard entry={e} isNew={seen.isNew(e)} notes={e.stage === "rumored" ? 0 : notesAbout(view.chronicle, e.tags).length} onOpen={() => setOpenId(e.id)} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}

function EntryCard({ entry: e, isNew, notes, onOpen }: { entry: PublicEntry; isNew: boolean; notes: number; onOpen: () => void }) {
  const rumored = e.stage === "rumored";
  const body = (
    <>
      <Portrait art={e.art} name={e.name} kind={e.kind} silhouette={e.silhouette} rumored={rumored} className="person-face" />
      <span className="person-card-text">
        <span className="person-name">
          {e.name}
          {isNew ? <span className="badge person-new">new</span> : null}
        </span>
        {rumored ? (e.hint ? <span className="person-title">{e.hint}</span> : null) : e.title ? <span className="person-title">{e.title}</span> : null}
        <span className="person-meta note">
          <span className={`entry-stage entry-stage-${e.stage}`}>{stageLabel(e.kind, e.stage)}</span>
          {e.relation && e.relation !== "stranger" ? <span className={`relation relation-${e.relation}`}>{relationLabel(e.relation)}</span> : null}
          {e.facts.length ? <span>{e.facts.length === 1 ? "1 thing known" : `${e.facts.length} things known`}</span> : null}
          {notes ? <span>{notes === 1 ? "1 note" : `${notes} notes`}</span> : null}
        </span>
      </span>
    </>
  );
  if (rumored) return <div className={`person-card rumored`}>{body}</div>;
  return (
    <button type="button" className="person-card" onClick={onOpen} aria-label={`${e.name}${isNew ? ", something new" : ""}`}>
      {body}
    </button>
  );
}

function EntryPage({ entry: e, view, send, onOpen, onBack }: { entry: PublicEntry; view: PlayerView; send: Send; onOpen: (id: string) => void; onBack: () => void }) {
  useEffect(() => {
    window.scrollTo?.({ top: 0 });
  }, [e.id]);
  const info = kindInfo(e.kind);
  return (
    <section className="box person-page" aria-label={e.name}>
      <button type="button" className="btn small" onClick={onBack}>
        &larr; Everything
      </button>
      <div className="person-head">
        <Portrait art={e.art} name={e.name} kind={e.kind} className="person-face big" />
        <div>
          <h2 className="person-page-name">{e.name}</h2>
          {e.title ? <div className="person-title">{e.title}</div> : null}
          <div className="person-meta note">
            {e.relation ? <span className={`relation relation-${e.relation}`}>{relationLabel(e.relation)}</span> : null}
            <span>
              {info.found}
              {e.found?.chapter ? ` in Chapter ${e.found.chapter}` : ""}
            </span>
          </div>
        </div>
      </div>
      {e.summary ? <p className="person-blurb">{e.summary}</p> : null}
      {e.ties.length ? (
        <div className="entry-links" aria-label="Tied to">
          {e.ties.map((l) => {
            const target = view.entries.find((x) => x.id === l.id);
            const canOpen = target && target.stage !== "rumored";
            return canOpen ? (
              <button key={l.id} type="button" className="chron-tag" onClick={() => onOpen(l.id)}>
                {l.name}
              </button>
            ) : (
              <span key={l.id} className="chron-tag">
                {l.name}
              </span>
            );
          })}
        </div>
      ) : null}
      <h3>What you know</h3>
      {e.facts.length ? (
        <ul className="person-facts">
          {e.facts.map((f) => (
            <li key={f.id}>{f.text}</li>
          ))}
        </ul>
      ) : (
        <p className="note">Nothing yet. The DM adds things here as you find them out.</p>
      )}
      <h3>The table&rsquo;s notes</h3>
      <PersonNotes view={view.chronicle} tags={e.tags} name={e.name} send={send} />
    </section>
  );
}

/** Per area: how much the party has found. In totals mode, one slot per thing to find. */
function Areas({ view }: { view: PlayerView }) {
  if (view.areas.length < 1) return null;
  return (
    <section className="box discovery-areas" aria-label="Areas">
      <h2>Areas</h2>
      <ul className="area-list">
        {view.areas.map((a) => (
          <li key={a.name}>
            <span className="area-name">{a.name}</span>
            <span className="note">
              {a.found} found{a.rumored ? ` · ${a.rumored} rumored` : ""}
              {a.total !== undefined ? ` · ${a.total - a.found} left` : ""}
            </span>
            {a.total !== undefined ? (
              <span className="area-slots" aria-hidden="true">
                {Array.from({ length: Math.min(a.total, 30) }, (_, i) => (
                  <span key={i} className={`area-slot${i < a.found ? " found" : i < a.found + a.rumored ? " rumored" : ""}`} />
                ))}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
