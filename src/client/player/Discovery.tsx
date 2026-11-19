"use client";

// The Discovery tab on a phone: everything the party knows of, by kind. Rumors
// show as silhouettes with a hint; found entries open into what you know about
// them and the table's notes. Empty sections stay out of the way: no facts means
// no heading, and no notes is one line with an "Add a note" button. Nothing
// hidden is ever here.

import { useEffect, useState } from "react";
import type { PlayerView } from "@/shared/projection";
import {
  kindInfo,
  KINDS,
  relationLabel,
  stageLabel,
  type PublicEntry,
} from "@/shared/discovery";
import { PersonNotes, notesAbout } from "../ui/PersonNotes";
import { Portrait } from "../ui/Portrait";
import { Leads } from "./Leads";
import { AttitudeDial } from "../ui/AttitudeDial";
import type { PhoneHandout } from "@/shared/projection";
import { HandoutList, HandoutPage, handoutMatches } from "./Handouts";

type Send = (c: object) => Promise<string | null>;

const SEEN_KEY = "candlefair-discovery-seen";
/** Found entries before the list gets a search box. */
const SEARCH_FROM = 8;

function loadSeen(game: string): Record<string, number> | null {
  try {
    const all = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "{}") as Record<
      string,
      Record<string, number>
    >;
    return all[game] ?? null;
  } catch {
    return null;
  }
}
function saveSeen(game: string, seen: Record<string, number>) {
  try {
    const all = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "{}") as Record<
      string,
      Record<string, number>
    >;
    all[game] = seen;
    localStorage.setItem(SEEN_KEY, JSON.stringify(all));
  } catch {}
}

/** Entries with something new since this phone last looked at them. */
export function useDiscoverySeen(view: PlayerView) {
  const [seen, setSeen] = useState<Record<string, number> | null>(null);
  useEffect(() => setSeen(loadSeen(view.game.id) ?? {}), [view.game.id]);
  const isNew = (e: PublicEntry) =>
    seen !== null && (seen[e.id] ?? -1) < e.updatedAt;
  // Handouts share the same store, under their own keys.
  const hKey = (h: PhoneHandout) => `handout:${h.sceneId}`;
  const isNewHandout = (h: PhoneHandout) =>
    seen !== null && (seen[hKey(h)] ?? -1) < (h.shownAt ?? 0);
  const markHandoutSeen = (h: PhoneHandout) => {
    if (!isNewHandout(h)) return;
    const next = { ...(seen ?? {}), [hKey(h)]: h.shownAt ?? 0 };
    setSeen(next);
    saveSeen(view.game.id, next);
  };
  const markSeen = (list: PublicEntry[]) => {
    const fresh = list.filter(isNew);
    if (!fresh.length) return;
    const next = { ...(seen ?? {}) };
    for (const e of fresh) next[e.id] = e.updatedAt;
    setSeen(next);
    saveSeen(view.game.id, next);
  };
  const handouts = view.handouts ?? [];
  return {
    isNew,
    markSeen,
    isNewHandout,
    markHandoutSeen,
    newCount:
      view.entries.filter(isNew).length + handouts.filter(isNewHandout).length,
  };
}

export function Discovery({
  view,
  send,
  seen,
}: {
  view: PlayerView;
  send: Send;
  seen: ReturnType<typeof useDiscoverySeen>;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [handoutId, setHandoutId] = useState<string | null>(null);
  const handouts = view.handouts ?? [];
  const handout = handouts.find((h) => h.sceneId === handoutId);
  useEffect(() => {
    if (handout) seen.markHandoutSeen(handout);
  }, [handout, seen]);
  const [areaPick, setArea] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const area = view.areas.some((a) => a.name === areaPick) ? areaPick : null;
  const open = view.entries.find(
    (e) => e.id === openId && e.stage !== "rumored",
  );
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

  if (handout)
    return <HandoutPage h={handout} onBack={() => setHandoutId(null)} />;
  if (open)
    return (
      <EntryPage
        entry={open}
        view={view}
        send={send}
        onOpen={setOpenId}
        onBack={() => setOpenId(null)}
      />
    );

  const kinds = [
    ...KINDS.map((k) => k.id),
    ...new Set(
      view.entries
        .map((e) => e.kind)
        .filter((k) => !KINDS.some((x) => x.id === k)),
    ),
  ];
  const inArea = (e: PublicEntry) => !area || e.areas.includes(area);
  // A search box once the list is long enough to scroll past: names, titles and what's known.
  const searchable =
    view.entries.filter((e) => e.stage !== "rumored").length +
      handouts.length >=
    SEARCH_FROM;
  const needle = searchable ? q.trim().toLowerCase() : "";
  const matches = (e: PublicEntry) =>
    !needle ||
    [e.name, e.title, e.summary, ...e.facts.map((f) => f.text)].some((t) =>
      t?.toLowerCase().includes(needle),
    );
  const sections = kinds
    .map((k) => ({
      k,
      list: view.entries.filter((e) => e.kind === k && inArea(e) && matches(e)),
    }))
    .filter((x) => x.list.length);
  // Handouts belong to no area: they step aside while one is picked.
  const shownHandouts = area
    ? []
    : handouts.filter((h) => handoutMatches(h, needle));
  const handoutList = (
    <HandoutList
      list={shownHandouts}
      isNew={seen.isNewHandout}
      onOpen={setHandoutId}
    />
  );

  if (!view.entries.length) {
    return (
      <>
        <Leads leads={view.leads} send={send} />
        {handoutList}
        <section className="box">
          <h2>Discoveries</h2>
          <p className="note">
            {handouts.length ? "No people or places yet. " : "Nothing yet. "}
            The people, places and secrets{" "}
            {view.game.town ? `of ${view.game.town} ` : ""}turn up here as you
            find them.
          </p>
        </section>
      </>
    );
  }
  return (
    <>
      <Leads leads={view.leads} send={send} />
      {searchable ? (
        <div className="pl-search">
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            className="fld"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search people, places…"
            aria-label="Search discoveries"
          />
        </div>
      ) : null}
      <Areas view={view} area={area} onArea={setArea} />
      {!sections.length && !shownHandouts.length ? (
        <div className="pl-empty">
          <p>
            {needle
              ? `Nothing matches “${q.trim()}”${area ? ` in ${area}` : ""}.`
              : `Nothing found in ${area} yet.`}
          </p>
        </div>
      ) : null}
      {sections.map(({ k, list }) => {
        const info = kindInfo(k);
        const found = list.filter((e) => e.stage !== "rumored").length;
        return (
          <section
            key={k}
            className="discovery pl-discovery"
            aria-label={info.plural}
          >
            <div className="pl-sec-head">
              <h2>{info.plural}</h2>
              <span>
                {info.found} {found}
                {list.length > found ? ` · ${list.length - found} rumored` : ""}
              </span>
            </div>
            <ul className="people-grid">
              {list.map((e) => (
                <li key={e.id}>
                  <EntryCard
                    entry={e}
                    isNew={seen.isNew(e)}
                    notes={
                      e.stage === "rumored"
                        ? 0
                        : notesAbout(view.chronicle, e.tags).length
                    }
                    onOpen={() => setOpenId(e.id)}
                  />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      {handoutList}
    </>
  );
}

function EntryCard({
  entry: e,
  isNew,
  notes,
  onOpen,
}: {
  entry: PublicEntry;
  isNew: boolean;
  notes: number;
  onOpen: () => void;
}) {
  const rumored = e.stage === "rumored";
  const body = (
    <>
      <Portrait
        art={e.art}
        name={e.name}
        kind={e.kind}
        silhouette={e.silhouette}
        rumored={rumored}
        className="person-face"
      />
      <span className="person-card-text">
        <span className="person-name">
          {e.name}
          {isNew ? <span className="badge person-new">new</span> : null}
        </span>
        {rumored ? (
          e.hint ? (
            <span className="person-title">{e.hint}</span>
          ) : null
        ) : e.title ? (
          <span className="person-title">{e.title}</span>
        ) : null}
        <span className="person-meta note">
          <span className={`entry-stage entry-stage-${e.stage}`}>
            {stageLabel(e.kind, e.stage)}
          </span>
          {e.relation && e.relation !== "stranger" ? (
            <span className={`relation relation-${e.relation}`}>
              {relationLabel(e.relation)}
            </span>
          ) : null}
          {e.facts.length ? (
            <span>
              {e.facts.length === 1
                ? "1 thing known"
                : `${e.facts.length} things known`}
            </span>
          ) : null}
          {notes ? (
            <span>{notes === 1 ? "1 note" : `${notes} notes`}</span>
          ) : null}
        </span>
      </span>
    </>
  );
  if (rumored) return <div className={`person-card rumored`}>{body}</div>;
  return (
    <button
      type="button"
      className="person-card"
      onClick={onOpen}
      aria-label={`${e.name}${isNew ? ", something new" : ""}`}
    >
      {body}
    </button>
  );
}

function EntryPage({
  entry: e,
  view,
  send,
  onOpen,
  onBack,
}: {
  entry: PublicEntry;
  view: PlayerView;
  send: Send;
  onOpen: (id: string) => void;
  onBack: () => void;
}) {
  useEffect(() => {
    window.scrollTo?.({ top: 0 });
  }, [e.id]);
  return (
    <section className="box person-page" aria-label={e.name}>
      <button type="button" className="pl-back" onClick={onBack}>
        &larr; Everything
      </button>
      <div className={`person-head${e.art ? "" : " no-art"}`}>
        <Portrait
          art={e.art}
          name={e.name}
          kind={e.kind}
          className="person-face big"
        />
        <div>
          <h2 className="person-page-name">{e.name}</h2>
          {e.title ? <div className="person-title">{e.title}</div> : null}
          <div className="person-meta note">
            {e.relation && e.relation !== "stranger" ? (
              <span className={`relation relation-${e.relation}`}>
                {relationLabel(e.relation)}
              </span>
            ) : null}
            <span>
              {stageLabel(e.kind, e.stage)}
              {e.stage === "found" && e.found?.chapter
                ? ` in Chapter ${e.found.chapter}`
                : ""}
            </span>
          </div>
        </div>
      </div>
      {e.summary ? <p className="person-blurb">{e.summary}</p> : null}
      {e.attitude ? (
        <div className="person-attitude" aria-label="How they feel about you">
          <AttitudeDial score={e.attitude.score} />
          {e.attitude.reasons?.length ? (
            <ul className="att-reasons">
              {e.attitude.reasons.map((r, i) => (
                <li key={i} className={r.up ? "up" : "down"}>
                  <span aria-hidden>{r.up ? "▲" : "▼"}</span>
                  <span className="sr-only">{r.up ? "Warmer:" : "Cooler:"}</span> {r.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      {e.ties.length ? (
        <div className="entry-links" aria-label="Tied to">
          {e.ties.map((l) => {
            const target = view.entries.find((x) => x.id === l.id);
            const canOpen = target && target.stage !== "rumored";
            return canOpen ? (
              <button
                key={l.id}
                type="button"
                className="chron-tag"
                onClick={() => onOpen(l.id)}
              >
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
      {e.facts.length ? (
        <>
          <h3>What you know</h3>
          <ul className="person-facts">
            {e.facts.map((f) => (
              <li key={f.id}>{f.text}</li>
            ))}
          </ul>
        </>
      ) : null}
      <PersonNotes
        view={view.chronicle}
        tags={e.tags}
        name={e.name}
        send={send}
        compact
        placeholder={notePrompt(e)}
        empty={e.facts.length ? "No notes yet." : "Nothing written down yet."}
      />
    </section>
  );
}

/** What the note box asks, by kind: places don't "say or do" anything. */
function notePrompt(e: PublicEntry): string {
  switch (e.kind) {
    case "person":
      return `What did ${e.name} say or do?`;
    case "place":
      return `What happened at ${e.name}?`;
    case "shop":
      return `What's for sale, or who runs it?`;
    case "monster":
      return `How did the fight go? What worked?`;
    default:
      return `What do you make of ${e.name}?`;
  }
}

/** Areas as chips that narrow the list; the picked one says how much is found there. */
function Areas({
  view,
  area,
  onArea,
}: {
  view: PlayerView;
  area: string | null;
  onArea: (a: string | null) => void;
}) {
  if (view.areas.length < 2) return null;
  const a = view.areas.find((x) => x.name === area);
  return (
    <div className="discovery-areas pl-areas" aria-label="Areas">
      <div className="pl-chips" role="tablist" aria-label="Areas">
        <button
          type="button"
          role="tab"
          aria-selected={!area}
          className={`pl-chip${!area ? " on" : ""}`}
          onClick={() => onArea(null)}
        >
          Everywhere
        </button>
        {view.areas.map((x) => (
          <button
            key={x.name}
            type="button"
            role="tab"
            aria-selected={area === x.name}
            className={`pl-chip${area === x.name ? " on" : ""}`}
            onClick={() => onArea(x.name)}
          >
            {x.name}
            <span className="pl-chip-n">{x.found}</span>
          </button>
        ))}
      </div>
      {a ? (
        <p className="pl-area-line">
          {a.found} found{a.rumored ? ` · ${a.rumored} rumored` : ""}
          {a.total !== undefined ? ` · ${a.total - a.found} left to find` : ""}
          {a.total !== undefined ? (
            <span className="area-slots" aria-hidden="true">
              {Array.from({ length: Math.min(a.total, 30) }, (_, i) => (
                <span
                  key={i}
                  className={`area-slot${i < a.found ? " found" : i < a.found + a.rumored ? " rumored" : ""}`}
                />
              ))}
            </span>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
