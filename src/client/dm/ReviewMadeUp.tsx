"use client";

// The Review page's second list: things the DM made up at the table with the
// off-script kit, turned from quick notes, or got as starter tables. They're
// already in the game (Hidden); this is where the DM reads them over and
// either keeps them (Looks good) or removes them.

import { useState } from "react";
import { entriesOf, kindInfo, stageLabel } from "@/shared/discovery";
import { needsReview } from "@/shared/offscript";
import type { Entry, GameState, RandomTable } from "@/shared/types";
import { useDm } from "./context";

const ORIGIN: Record<string, string> = { improvised: "Made up at the table", capture: "From a quick note", seed: "Starter" };

function when(at: number): string {
  return at ? new Date(at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "";
}

export function reviewCount(g: GameState): number {
  const r = needsReview(g);
  return r.entries.length + r.tables.length;
}

export function ReviewMadeUp() {
  const { view } = useDm();
  const g = view.state as unknown as GameState;
  const { entries, tables } = needsReview(g);
  const all = entriesOf(g);
  if (!entries.length && !tables.length) return <p className="note">Nothing to review. Things you make up in the off-script panel (O in run-game mode) and turn from quick notes show up here.</p>;
  const placeName = (id?: string) => (id ? all.find((e) => e.id === id)?.name : undefined);
  return (
    <>
      <p className="note">These are already in your campaign, Hidden unless you said you met them. Read them over, fix anything in Discover or Random tables, then press Looks good.</p>
      {entries.length ? (
        <section className="builder-batch">
          <h3>
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </h3>
          {entries.map((e) => (
            <EntryRow key={e.id} e={e} at={placeName(e.review?.placeId)} />
          ))}
        </section>
      ) : null}
      {tables.length ? (
        <section className="builder-batch">
          <h3>
            {tables.length} random {tables.length === 1 ? "table" : "tables"}
          </h3>
          {tables.map((t) => (
            <TableRow key={t.id} t={t} />
          ))}
        </section>
      ) : null}
    </>
  );
}

function EntryRow({ e, at }: { e: Entry; at?: string }) {
  const { run } = useDm();
  const [sure, setSure] = useState(false);
  const notes = (
    [
      ["Look", e.look],
      ["Quirk", e.quirk],
      ["Wants", e.wants],
      ["Knows", e.knows],
      ["Voice", e.voice],
    ] as const
  ).filter(([, v]) => v);
  return (
    <article className="box draft-card">
      <div className="inline">
        <span className="tag">{kindInfo(e.kind).label}</span>
        <b>{e.name}</b>
        {e.title ? <span className="note">{e.title}</span> : null}
        <span className={`tag entry-stage-${e.stage}`}>{stageLabel(e.kind, e.stage)}</span>
      </div>
      <p className="note">
        {ORIGIN[e.origin ?? ""] ?? "Flagged"}
        {e.review?.at ? `, ${when(e.review.at)}` : ""}
        {at ? `, at ${at}` : ""}
      </p>
      {e.summary ? <p>{e.summary}</p> : null}
      {notes.length ? (
        <dl className="gen-lines">
          {notes.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <div className="inline">
        <button type="button" className="btn small primary" onClick={() => void run({ type: "review.done", entryId: e.id }, `${e.name} kept.`)}>
          Looks good
        </button>
        {sure ? (
          <>
            <button type="button" className="btn small danger" onClick={() => void run({ type: "entry.remove", entryId: e.id }, `${e.name} removed.`)}>
              Yes, remove {e.name}
            </button>
            <button type="button" className="btn small" onClick={() => setSure(false)}>
              Keep it
            </button>
          </>
        ) : (
          <button type="button" className="btn small" onClick={() => setSure(true)}>
            Remove
          </button>
        )}
      </div>
    </article>
  );
}

function TableRow({ t }: { t: RandomTable }) {
  const { run } = useDm();
  return (
    <article className="box draft-card">
      <div className="inline">
        <span className="tag">d{t.die}</span>
        <b>{t.name}</b>
        <span className="note">{ORIGIN[t.origin ?? ""] ?? "Flagged"}</span>
      </div>
      <ol className="plain table-preview">
        {t.rows.slice(0, 5).map((r) => (
          <li key={r.from}>
            <span className="note">{r.from === r.to ? r.from : `${r.from}–${r.to}`}</span> {r.text}
          </li>
        ))}
        {t.rows.length > 5 ? <li className="note">and {t.rows.length - 5} more on the Random tables page</li> : null}
      </ol>
      <div className="inline">
        <button type="button" className="btn small primary" onClick={() => void run({ type: "review.done", tableId: t.id }, `${t.name} kept.`)}>
          Looks good
        </button>
      </div>
    </article>
  );
}
