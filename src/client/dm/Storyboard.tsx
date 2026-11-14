"use client";

// The storyboard: DM-only planning above episodes. Columns are time (December
// 2026 to December 2027, by month or by season), rows are threads, cards are
// story beats. Drag a card to another column or thread; beats with no window
// wait in the Floating tray. Click a card to edit it on the right.
//
// None of this reaches the TV or a phone: GameState.story is never copied into
// their views.

import { useEffect, useMemo, useRef, useState } from "react";
import { entriesOf, kindInfo, KINDS } from "@/shared/discovery";
import {
  BEAT_TYPES,
  boardColumns,
  beatMatches,
  beatWarnings,
  columnOf,
  dayLabel,
  FESTIVALS,
  LAST_MONTH,
  linkInfo,
  linkKey,
  monthOf,
  shiftWindow,
  STATUSES,
  statusLabel,
  storyOf,
  THREAD_KINDS,
  threadLabel,
  todayOf,
  typeLabel,
  WINDOW_PRESETS,
  windowLabel,
  type BeatFilter,
  type BoardColumn,
} from "@/shared/story";
import type { GameState, StoryBeat, StoryBeatType, StoryLink, StoryStatus, StoryThread } from "@/shared/types";
import { DownIcon, UpIcon } from "../ui/icons";
import { Field } from "./Field";
import { useDm } from "./context";

type Sel = { kind: "beat"; id: string } | { kind: "thread"; id: string } | { kind: "dates" } | null;

const DRAG = "application/x-story-beat";

export function Storyboard({ onClose, select }: { onClose: () => void; select?: string }) {
  const { view, run, toast } = useDm();
  const g = view.state as unknown as GameState;
  const st = storyOf(g);
  const today = todayOf(Date.now());
  const cols = boardColumns(st.zoom);
  const [pick, setPick] = useState<Sel>(select ? { kind: "beat", id: select } : null);
  const [filter, setFilter] = useState<BeatFilter & { warn?: boolean }>({});
  const [over, setOver] = useState<string | null>(null);

  // Select a beat or thread as soon as it arrives from the server.
  const waitFor = useRef<{ kind: "beat" | "thread"; before: Set<string> } | null>(null);
  useEffect(() => {
    const w = waitFor.current;
    if (!w) return;
    const list = w.kind === "beat" ? st.beats : st.threads;
    const made = list.find((x) => !w.before.has(x.id));
    if (made) {
      waitFor.current = null;
      setPick({ kind: w.kind, id: made.id });
    }
  }, [st.beats, st.threads]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;
      if (e.key === "Escape") {
        e.preventDefault();
        if (pick) setPick(null);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pick, onClose]);

  const warnings = useMemo(() => new Map(st.beats.map((b) => [b.id, beatWarnings(st, b, today)])), [st, today]);
  const shown = (b: StoryBeat) => beatMatches(b, filter) && (!filter.warn || (warnings.get(b.id)?.length ?? 0) > 0);
  const warnCount = [...warnings.values()].filter((w) => w.length).length;

  const addBeat = async (threadId: string, window: StoryBeat["window"] | null) => {
    waitFor.current = { kind: "beat", before: new Set(st.beats.map((b) => b.id)) };
    await run({ type: "story.beatAdd", beat: { threadId, title: "New beat", window: window ?? null } });
  };
  const addThread = async () => {
    waitFor.current = { kind: "thread", before: new Set(st.threads.map((t) => t.id)) };
    await run({ type: "story.threadAdd", thread: { name: "New thread" } });
  };

  /** Drop a card: into a thread's row at a column, or the tray. */
  const drop = (beatId: string, threadId: string | null, col: string) => {
    const b = st.beats.find((x) => x.id === beatId);
    if (!b) return;
    let window: StoryBeat["window"] | null;
    if (col === "floating") window = null;
    else if (col === "anytime") window = "anytime";
    else {
      const c = cols.find((x) => x.id === col)!;
      if (b.window && b.window !== "anytime" && columnOf(b, cols) === col) window = b.window;
      else if (st.zoom === "season" || !b.window || b.window === "anytime") window = { from: c.months[0], to: c.months.at(-1)! };
      else {
        // By month: keep its length, but not past the end of the board.
        const moved = shiftWindow(b.window, c.months[0]);
        window = { from: moved.from, to: moved.to > LAST_MONTH ? LAST_MONTH : moved.to };
      }
    }
    const patch: { window?: StoryBeat["window"] | null; threadId?: string } = {};
    if (JSON.stringify(window ?? null) !== JSON.stringify(b.window ?? null)) patch.window = window;
    if (threadId && threadId !== b.threadId) patch.threadId = threadId;
    if (Object.keys(patch).length) void run({ type: "story.beatUpdate", beatId, patch });
  };
  const dropProps = (key: string, threadId: string | null, col: string) => ({
    onDragOver: (e: React.DragEvent) => {
      if (!e.dataTransfer.types.includes(DRAG)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (over !== key) setOver(key);
    },
    onDragLeave: () => setOver((o) => (o === key ? null : o)),
    onDrop: (e: React.DragEvent) => {
      const id = e.dataTransfer.getData(DRAG);
      setOver(null);
      if (id) {
        e.preventDefault();
        drop(id, threadId, col);
      }
    },
  });

  const datesIn = (c: BoardColumn) => st.dates.filter((d) => c.months.includes(monthOf(d.date)));
  const visibleThreads = st.threads.filter((t) => !filter.threadIds?.length || filter.threadIds.includes(t.id));
  const floating = st.beats.filter((b) => !b.window && shown(b));
  const cardsAt = (t: StoryThread, col: string) => st.beats.filter((b) => b.threadId === t.id && b.window && columnOf(b, cols) === col && shown(b));
  const card = (b: StoryBeat, showThread = false) => (
    <BeatCard key={b.id} beat={b} g={g} warns={warnings.get(b.id) ?? []} on={pick?.kind === "beat" && pick.id === b.id} onPick={() => setPick({ kind: "beat", id: b.id })} thread={showThread ? st.threads.find((t) => t.id === b.threadId) : undefined} />
  );

  const gridCols = `200px 210px repeat(${cols.length}, ${st.zoom === "month" ? "210px" : "300px"})`;

  return (
    <div className="story-overlay" role="dialog" aria-modal="true" aria-label="Storyboard">
      <div className="story-head">
        <h2>Storyboard</h2>
        <span className="note">DM only. Nothing here reaches the TV or the phones.</span>
        <span className="grow" />
        <div className="seg" role="group" aria-label="Zoom">
          <button type="button" className={`btn small${st.zoom === "month" ? " on" : ""}`} aria-pressed={st.zoom === "month"} onClick={() => run({ type: "story.board", zoom: "month" })}>
            Months
          </button>
          <button type="button" className={`btn small${st.zoom === "season" ? " on" : ""}`} aria-pressed={st.zoom === "season"} onClick={() => run({ type: "story.board", zoom: "season" })}>
            Seasons
          </button>
        </div>
        <label className="check">
          <input type="checkbox" checked={st.festivals} onChange={(e) => void run({ type: "story.board", festivals: e.target.checked })} />
          Festivals
        </label>
        <button type="button" className={`btn small${pick?.kind === "dates" ? " on" : ""}`} onClick={() => setPick(pick?.kind === "dates" ? null : { kind: "dates" })}>
          Session dates{st.dates.length ? ` (${st.dates.filter((d) => !d.cancelled).length})` : ""}
        </button>
        <button type="button" className="btn small" onClick={() => void addThread()}>
          New thread
        </button>
        <button type="button" className="btn small primary" disabled={!st.threads.length} onClick={() => void addBeat(filter.threadIds?.[0] ?? st.threads[0].id, null)}>
          New beat
        </button>
        <button type="button" className="btn small" onClick={onClose}>
          Close <span className="key">Esc</span>
        </button>
      </div>

      <Filters g={g} filter={filter} setFilter={setFilter} warnCount={warnCount} />

      <div className={`story-body${pick ? " with-side" : ""}`}>
        <div className="story-main">
          <div className="story-scroll">
            <div className="story-grid" style={{ gridTemplateColumns: gridCols }}>
              {st.festivals ? (
                <>
                  <div className="sg-corner sg-fest-label">Festivals</div>
                  <div className="sg-fest" />
                  {cols.map((c) => (
                    <div key={c.id} className="sg-fest">
                      {FESTIVALS.filter((f) => c.months.includes(f.month)).map((f, i) => (
                        <span key={i} className="festival" title={f.note}>
                          {f.name}
                        </span>
                      ))}
                    </div>
                  ))}
                </>
              ) : null}

              <div className="sg-corner">Thread</div>
              <div className="sg-col-head">
                <b>Anytime</b>
                <span className="note">No fixed time</span>
              </div>
              {cols.map((c) => (
                <div key={c.id} className={`sg-col-head${c.months.includes(monthOf(today)) ? " now" : ""}`}>
                  <b>{c.label}</b>
                  {c.sub ? <span className="note">{c.sub}</span> : null}
                </div>
              ))}

              <div className="sg-corner sg-sess-label">Sessions</div>
              <div className="sg-sess" />
              {cols.map((c) => (
                <div key={c.id} className="sg-sess">
                  {datesIn(c).map((d) => {
                    const ep = d.episodeId ? (g.episodes ?? []).find((e) => e.id === d.episodeId) : undefined;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        className={`sess-marker${d.cancelled ? " cancelled" : ""}${d.date < today ? " past" : ""}${over === `date|${d.id}` ? " over" : ""}`}
                        onClick={() => setPick({ kind: "dates" })}
                        title={d.cancelled ? "Cancelled" : ep ? `${ep.title}: drop a card here to place it in this episode` : "Session: pick its episode under Session dates, then drop cards here"}
                        onDragOver={(e) => {
                          if (!e.dataTransfer.types.includes(DRAG) || d.cancelled) return;
                          e.preventDefault();
                          if (over !== `date|${d.id}`) setOver(`date|${d.id}`);
                        }}
                        onDragLeave={() => setOver((o) => (o === `date|${d.id}` ? null : o))}
                        onDrop={(e) => {
                          const id = e.dataTransfer.getData(DRAG);
                          setOver(null);
                          if (!id) return;
                          e.preventDefault();
                          e.stopPropagation();
                          if (d.episodeId) void run({ type: "episode.placeStory", episodeId: d.episodeId, storyBeatId: id }, `Placed in ${ep?.title ?? "the episode"}.`);
                          else toast("Pick an episode for that date first (Session dates).");
                        }}
                      >
                        {dayLabel(d.date).replace(/, \d{4}$/, "")}
                        {ep ? <span className="sess-ep">{ep.title}</span> : null}
                      </button>
                    );
                  })}
                </div>
              ))}

              {visibleThreads.map((t) => (
                <ThreadRow key={t.id} t={t} g={g} cols={cols} on={pick?.kind === "thread" && pick.id === t.id} onPick={() => setPick({ kind: "thread", id: t.id })}>
                  <div className={`sg-cell anytime${over === `${t.id}|anytime` ? " over" : ""}`} {...dropProps(`${t.id}|anytime`, t.id, "anytime")} onDoubleClick={() => void addBeat(t.id, "anytime")}>
                    {cardsAt(t, "anytime").map((b) => card(b))}
                  </div>
                  {cols.map((c) => (
                    <div
                      key={c.id}
                      className={`sg-cell${over === `${t.id}|${c.id}` ? " over" : ""}${c.months.includes(monthOf(today)) ? " now" : ""}`}
                      {...dropProps(`${t.id}|${c.id}`, t.id, c.id)}
                      onDoubleClick={(e) => {
                        if (e.target !== e.currentTarget) return;
                        void addBeat(t.id, { from: c.months[0], to: c.months.at(-1)! });
                      }}
                    >
                      {cardsAt(t, c.id).map((b) => card(b))}
                    </div>
                  ))}
                </ThreadRow>
              ))}
            </div>
          </div>

          <section className={`story-tray${over === "tray" ? " over" : ""}`} aria-label="Floating beats" {...dropProps("tray", null, "floating")}>
            <h3>
              Floating <span className="note">Beats with no window yet. Drag one onto the board to give it a time, or drag a card here to unpin it.</span>
            </h3>
            <div className="tray-cards">{floating.length ? floating.map((b) => card(b, true)) : <span className="note">Nothing floating.</span>}</div>
          </section>
          <p className="note hint">Double-click an empty cell to add a beat there. Drag cards between columns and threads. Esc closes the editor, then the board.</p>
        </div>

        {pick ? (
          <aside className="story-side box" aria-label="Editor">
            {pick.kind === "beat" ? <BeatEditor key={pick.id} id={pick.id} g={g} today={today} onClose={() => setPick(null)} onPick={setPick} /> : null}
            {pick.kind === "thread" ? <ThreadEditor key={pick.id} id={pick.id} g={g} onClose={() => setPick(null)} /> : null}
            {pick.kind === "dates" ? <DatesEditor g={g} onClose={() => setPick(null)} /> : null}
          </aside>
        ) : null}
      </div>
    </div>
  );
}

function ThreadRow({ t, g, on, onPick, children }: { t: StoryThread; g: GameState; cols: BoardColumn[]; on: boolean; onPick: () => void; children: React.ReactNode }) {
  return (
    <>
      <button type="button" className={`sg-thread${on ? " on" : ""}`} style={{ ["--thread" as string]: t.color }} onClick={onPick} title={t.description}>
        <b>{threadLabel(t, g.players)}</b>
        {t.goal ? <span className="note">Goal: {t.goal}</span> : <span className="note">{THREAD_KINDS.find((k) => k.id === t.kind)?.label}</span>}
      </button>
      {children}
    </>
  );
}

function BeatCard({ beat: b, g, warns, on, onPick, thread }: { beat: StoryBeat; g: GameState; warns: { text: string }[]; on: boolean; onPick: () => void; thread?: StoryThread }) {
  const st = storyOf(g);
  const color = thread?.color ?? st.threads.find((t) => t.id === b.threadId)?.color ?? "#888";
  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(DRAG, b.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={`beat-card st-${b.status}${warns.length ? " warn" : ""}${on ? " on" : ""}`}
      style={{ ["--thread" as string]: color }}
      onClick={onPick}
      aria-label={`${b.title}, ${typeLabel(b.type)}, ${statusLabel(b.status)}${warns.length ? `, ${warns.length} warning${warns.length === 1 ? "" : "s"}` : ""}`}
    >
      <span className="bc-top">
        <span className={`bc-type t-${b.type}`}>{typeLabel(b.type)}</span>
        {b.repeat ? (
          <span className="bc-flag" title="Can happen again and again">
            ↻{b.plays.length ? ` ${b.plays.length}` : ""}
          </span>
        ) : null}
        {b.status === "played" ? <span className="bc-flag ok" title="Played">✓</span> : null}
        {warns.length ? (
          <span className="bc-flag bad" title={warns.map((w) => w.text).join("\n")}>
            ⚠
          </span>
        ) : null}
      </span>
      <span className="bc-title">{b.title}</span>
      <span className="bc-sub">
        {[
          thread ? threadLabel(thread, g.players) : "",
          b.window && b.window !== "anytime" ? windowLabel(b.window) : "",
          b.by ? `by ${dayLabel(b.by)}` : "",
          b.status === "dropped" ? "Dropped" : b.status === "placed" ? "Placed" : "",
        ]
          .filter(Boolean)
          .join(" · ")}
      </span>
    </button>
  );
}

function Filters({ g, filter, setFilter, warnCount }: { g: GameState; filter: BeatFilter & { warn?: boolean }; setFilter: (f: BeatFilter & { warn?: boolean }) => void; warnCount: number }) {
  const st = storyOf(g);
  const linked = entriesOf(g).filter((e) => (e.kind === "person" || e.kind === "place") && st.beats.some((b) => b.links.some((l) => (l.kind === "entry" ? l.id : l.kind === "fact" ? l.entryId : "") === e.id)));
  const any = !!(filter.threadIds?.length || filter.types?.length || filter.statuses?.length || filter.entryId || filter.warn);
  return (
    <div className="story-filters" role="group" aria-label="Filters">
      <label>
        Thread
        <select className="fld" value={filter.threadIds?.[0] ?? ""} onChange={(e) => setFilter({ ...filter, threadIds: e.target.value ? [e.target.value] : [] })}>
          <option value="">All threads</option>
          {st.threads.map((t) => (
            <option key={t.id} value={t.id}>
              {threadLabel(t, g.players)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Type
        <select className="fld" value={filter.types?.[0] ?? ""} onChange={(e) => setFilter({ ...filter, types: e.target.value ? [e.target.value as StoryBeatType] : [] })}>
          <option value="">All types</option>
          {BEAT_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Status
        <select className="fld" value={filter.statuses?.[0] ?? ""} onChange={(e) => setFilter({ ...filter, statuses: e.target.value ? [e.target.value as StoryStatus] : [] })}>
          <option value="">Any status</option>
          {STATUSES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Person or place
        <select className="fld" value={filter.entryId ?? ""} onChange={(e) => setFilter({ ...filter, entryId: e.target.value || undefined })}>
          <option value="">Anyone, anywhere</option>
          {linked.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name} ({kindInfo(e.kind).label.toLowerCase()})
            </option>
          ))}
        </select>
      </label>
      <button type="button" className={`btn small${filter.warn ? " on" : ""}`} aria-pressed={!!filter.warn} disabled={!warnCount && !filter.warn} onClick={() => setFilter({ ...filter, warn: !filter.warn })}>
        ⚠ {warnCount} warning{warnCount === 1 ? "" : "s"}
      </button>
      {any ? (
        <button type="button" className="btn small" onClick={() => setFilter({})}>
          Clear filters
        </button>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Editors

function windowValue(w: StoryBeat["window"]): string {
  if (!w) return "floating";
  if (w === "anytime") return "anytime";
  return WINDOW_PRESETS.find((p) => p.range.from === w.from && p.range.to === w.to)?.id ?? "custom";
}

function BeatEditor({ id, g, today, onClose, onPick }: { id: string; g: GameState; today: string; onClose: () => void; onPick: (p: Sel) => void }) {
  const { run } = useDm();
  const st = storyOf(g);
  const b = st.beats.find((x) => x.id === id);
  const [outcome, setOutcome] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!b) return <p className="note">That beat is gone.</p>;
  const up = (patch: Parameters<typeof patchCmd>[1]) => run(patchCmd(b.id, patch));
  const warns = beatWarnings(st, b, today);
  const wv = windowValue(b.window);
  const range = b.window && b.window !== "anytime" ? b.window : null;

  return (
    <div className="story-editor">
      <div className="box-head">
        <h3>Story beat</h3>
        <button type="button" className="btn small" onClick={onClose}>
          Done
        </button>
      </div>
      {warns.length ? (
        <ul className="story-warns" role="status">
          {warns.map((w, i) => (
            <li key={i}>⚠ {w.text}</li>
          ))}
        </ul>
      ) : null}
      <Field label="Title" value={b.title} onCommit={(v) => (v.trim() ? void up({ title: v }) : false)} />
      <div className="inline">
        <label>
          Thread
          <select className="fld" value={b.threadId} onChange={(e) => void up({ threadId: e.target.value })}>
            {st.threads.map((t) => (
              <option key={t.id} value={t.id}>
                {threadLabel(t, g.players)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Type
          <select className="fld" value={b.type} onChange={(e) => void up({ type: e.target.value as StoryBeatType })}>
            {BEAT_TYPES.map((t) => (
              <option key={t.id} value={t.id} title={t.hint}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Field label="Summary" multiline value={b.summary} onCommit={(v) => void up({ summary: v })} placeholder="What happens, in a line or two." />
      <Field label="DM notes" multiline value={b.dmNotes} onCommit={(v) => void up({ dmNotes: v })} />

      <div className="inline">
        <label>
          When
          <select
            className="fld"
            value={wv}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "floating") void up({ window: null });
              else if (v === "anytime") void up({ window: "anytime" });
              else if (v === "custom") void up({ window: range ?? { from: "2027-01", to: "2027-01" } });
              else void up({ window: { ...WINDOW_PRESETS.find((p) => p.id === v)!.range } });
            }}
          >
            <option value="floating">Floating (not yet)</option>
            <option value="anytime">Anytime</option>
            {WINDOW_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
            <option value="custom">{wv === "custom" ? windowLabel(b.window) : "Months…"}</option>
          </select>
        </label>
        {range ? (
          <>
            <label>
              From
              <input className="fld" type="month" min="2026-01" max="2028-12" value={range.from} onChange={(e) => e.target.value && void up({ window: { from: e.target.value, to: e.target.value > range.to ? e.target.value : range.to } })} />
            </label>
            <label>
              To
              <input className="fld" type="month" min={range.from} max="2028-12" value={range.to} onChange={(e) => e.target.value && void up({ window: { from: range.from, to: e.target.value < range.from ? range.from : e.target.value } })} />
            </label>
          </>
        ) : null}
      </div>
      <div className="inline">
        <label>
          Must happen by
          <input className="fld" type="date" value={b.by ?? ""} onChange={(e) => void up({ by: e.target.value || null })} />
        </label>
        <label className="check">
          <input type="checkbox" checked={!!b.repeat} onChange={(e) => void up({ repeat: e.target.checked })} />
          Can happen again and again
        </label>
      </div>

      <h4>Links</h4>
      <Links g={g} beat={b} onChange={(links) => void up({ links })} />

      <h4>After</h4>
      <p className="note">Beats that have to be played first.</p>
      <ul className="chip-list">
        {b.after.map((a) => {
          const dep = st.beats.find((x) => x.id === a);
          return (
            <li key={a} className={`chip${dep?.plays.length ? " ok" : ""}`}>
              <button type="button" className="chip-link" onClick={() => onPick({ kind: "beat", id: a })}>
                {dep?.plays.length ? "✓ " : ""}
                {dep?.title ?? "A deleted beat"}
              </button>
              <button type="button" className="chip-x" aria-label={`Remove ${dep?.title ?? "link"}`} onClick={() => void up({ after: b.after.filter((x) => x !== a) })}>
                ×
              </button>
            </li>
          );
        })}
      </ul>
      <select
        className="fld"
        value=""
        aria-label="Add a beat that comes first"
        onChange={(e) => {
          if (e.target.value) void up({ after: [...b.after, e.target.value] });
        }}
      >
        <option value="">Add a beat that comes first…</option>
        {st.threads.map((t) => (
          <optgroup key={t.id} label={threadLabel(t, g.players)}>
            {st.beats
              .filter((x) => x.threadId === t.id && x.id !== b.id && !b.after.includes(x.id))
              .map((x) => (
                <option key={x.id} value={x.id}>
                  {x.title}
                </option>
              ))}
          </optgroup>
        ))}
      </select>

      <h4>Status</h4>
      <div className="inline">
        <span className={`tag st-tag st-${b.status}`}>{statusLabel(b.status)}</span>
        {b.status !== "played" || b.repeat ? (
          <button type="button" className="btn small" onClick={() => setOutcome("")}>
            Mark played{b.repeat && b.plays.length ? " again" : ""}
          </button>
        ) : (
          <button type="button" className="btn small" onClick={() => void run({ type: "story.beatStatus", beatId: b.id, status: "planned" })}>
            Not played after all
          </button>
        )}
        {b.status === "dropped" ? (
          <button type="button" className="btn small" onClick={() => void run({ type: "story.beatStatus", beatId: b.id, status: "planned" })}>
            Bring it back
          </button>
        ) : (
          <button type="button" className="btn small" onClick={() => void run({ type: "story.beatStatus", beatId: b.id, status: "dropped" })}>
            Drop it
          </button>
        )}
      </div>
      {outcome !== null ? (
        <form
          className="inline"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await run({ type: "story.beatStatus", beatId: b.id, status: "played", outcome }, "Marked played.")) setOutcome(null);
          }}
        >
          <label className="grow">
            What happened? (optional)
            <input className="fld" autoFocus value={outcome} maxLength={300} onChange={(e) => setOutcome(e.target.value)} placeholder="They let Mardon go." />
          </label>
          <button type="submit" className="btn small primary">
            Save
          </button>
          <button type="button" className="btn small" onClick={() => setOutcome(null)}>
            Cancel
          </button>
        </form>
      ) : null}
      {b.plays.length ? (
        <ol className="plays">
          {b.plays.map((p, i) => {
            const sess = p.sessionId ? g.sessions.find((x) => x.id === p.sessionId) : undefined;
            return (
              <li key={i}>
                <Field label={sess ? `Session ${sess.number}${sess.title ? `: ${sess.title}` : ""}` : `Played ${new Date(p.at).toLocaleDateString()}`} value={p.outcome} placeholder="What happened?" onCommit={(v) => void run({ type: "story.playOutcome", beatId: b.id, index: i, outcome: v })} />
              </li>
            );
          })}
        </ol>
      ) : null}

      <div className="inline story-actions">
        <button type="button" className="btn small" onClick={() => void run({ type: "story.beatDuplicate", beatId: b.id }, "Copied. The copy sits right after it.")}>
          Duplicate
        </button>
        {confirmDelete ? (
          <>
            <button type="button" className="btn small danger" onClick={() => void run({ type: "story.beatRemove", beatId: b.id }).then((ok) => ok && onClose())}>
              Delete for good
            </button>
            <button type="button" className="btn small" onClick={() => setConfirmDelete(false)}>
              Keep it
            </button>
          </>
        ) : (
          <button type="button" className="btn small danger" onClick={() => setConfirmDelete(true)}>
            Delete
          </button>
        )}
      </div>
      {b.variantOf ? <p className="note">A version of “{st.beats.find((x) => x.id === b.variantOf)?.title ?? "a deleted beat"}”.</p> : null}
    </div>
  );
}

function patchCmd(beatId: string, patch: { threadId?: string; title?: string; summary?: string; dmNotes?: string; type?: StoryBeatType; window?: StoryBeat["window"] | null; by?: string | null; links?: StoryLink[]; after?: string[]; repeat?: boolean }) {
  return { type: "story.beatUpdate" as const, beatId, patch };
}

/** Everything a beat can link to, grouped for one select. */
function linkOptions(g: GameState): { group: string; items: { value: string; label: string; link: StoryLink }[] }[] {
  const entries = entriesOf(g);
  const out: ReturnType<typeof linkOptions> = KINDS.map((k) => ({
    group: k.plural,
    items: entries.filter((e) => e.kind === k.id).map((e) => ({ value: `entry:${e.id}`, label: e.name, link: { kind: "entry", id: e.id } as StoryLink })),
  }));
  out.push({
    group: "Facts",
    items: entries.flatMap((e) => e.facts.map((f) => ({ value: `fact:${e.id}/${f.id}`, label: `${e.name}: ${f.text.slice(0, 60)}`, link: { kind: "fact", entryId: e.id, factId: f.id } as StoryLink }))),
  });
  out.push({ group: "Job flyers", items: (g.jobs ?? []).map((j) => ({ value: `job:${j.id}`, label: j.title, link: { kind: "job", id: j.id } as StoryLink })) });
  out.push({ group: "Player flyers", items: g.flyers.map((f) => ({ value: `flyer:${f.id}`, label: f.title, link: { kind: "flyer", id: f.id } as StoryLink })) });
  out.push({ group: "Leads", items: (g.leads ?? []).map((l) => ({ value: `lead:${l.id}`, label: l.text.slice(0, 60), link: { kind: "lead", id: l.id } as StoryLink })) });
  out.push({ group: "Shop projects", items: g.items.filter((i) => i.kind === "project").map((i) => ({ value: `item:${i.id}`, label: i.name, link: { kind: "item", id: i.id } as StoryLink })) });
  out.push({ group: "Monster templates", items: (g.monsters ?? []).map((m) => ({ value: `monster:${m.id}`, label: m.name, link: { kind: "monster", id: m.id } as StoryLink })) });
  return out.filter((x) => x.items.length);
}

function Links({ g, beat: b, onChange }: { g: GameState; beat: StoryBeat; onChange: (links: StoryLink[]) => void }) {
  const opts = linkOptions(g);
  const have = new Set(b.links.map(linkKey));
  return (
    <>
      <ul className="chip-list">
        {b.links.map((l) => {
          const info = linkInfo(g, l);
          return (
            <li key={info.key} className={`chip${info.missing ? " missing" : ""}`} title={info.kind}>
              <span className="chip-kind">{info.kind}</span> {info.label}
              <button type="button" className="chip-x" aria-label={`Remove ${info.label}`} onClick={() => onChange(b.links.filter((x) => linkKey(x) !== info.key))}>
                ×
              </button>
            </li>
          );
        })}
      </ul>
      <select
        className="fld"
        value=""
        aria-label="Link something"
        onChange={(e) => {
          const hit = opts.flatMap((o) => o.items).find((x) => x.value === e.target.value);
          if (hit) onChange([...b.links, hit.link]);
        }}
      >
        <option value="">Link a person, place, fact, flyer…</option>
        {opts.map((o) => (
          <optgroup key={o.group} label={o.group}>
            {o.items
              .filter((x) => !have.has(x.value))
              .map((x) => (
                <option key={x.value} value={x.value}>
                  {x.label}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
    </>
  );
}

function ThreadEditor({ id, g, onClose }: { id: string; g: GameState; onClose: () => void }) {
  const { run } = useDm();
  const st = storyOf(g);
  const t = st.threads.find((x) => x.id === id);
  const [moveTo, setMoveTo] = useState("");
  if (!t) return <p className="note">That thread is gone.</p>;
  const i = st.threads.indexOf(t);
  const count = st.beats.filter((b) => b.threadId === t.id).length;
  const backstory = t.kind === "backstory";
  const atTable = backstory && g.players.some((p) => p.id === t.playerId && !p.archived);
  return (
    <div className="story-editor">
      <div className="box-head">
        <h3>Thread</h3>
        <button type="button" className="btn small" onClick={onClose}>
          Done
        </button>
      </div>
      {backstory ? (
        <p className="note">
          <b>{threadLabel(t, g.players)}</b>. Backstory lanes come from the player list and follow their character&rsquo;s name.
        </p>
      ) : (
        <Field label="Name" value={t.name} onCommit={(v) => (v.trim() ? void run({ type: "story.threadUpdate", threadId: t.id, patch: { name: v } }) : false)} />
      )}
      <div className="inline">
        <label>
          Color
          <input className="fld color" type="color" value={t.color} onChange={(e) => void run({ type: "story.threadUpdate", threadId: t.id, patch: { color: e.target.value } })} />
        </label>
        {backstory ? null : (
          <label>
            Kind
            <select className="fld" value={t.kind} onChange={(e) => void run({ type: "story.threadUpdate", threadId: t.id, patch: { kind: e.target.value as StoryThread["kind"] } })}>
              {THREAD_KINDS.filter((k) => k.id !== "backstory").map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <button type="button" className="btn small icon" aria-label="Move up" disabled={i === 0} onClick={() => void run({ type: "story.threadMove", threadId: t.id, dir: -1 })}>
          <UpIcon />
        </button>
        <button type="button" className="btn small icon" aria-label="Move down" disabled={i === st.threads.length - 1} onClick={() => void run({ type: "story.threadMove", threadId: t.id, dir: 1 })}>
          <DownIcon />
        </button>
      </div>
      <Field label="Description" multiline value={t.description} onCommit={(v) => void run({ type: "story.threadUpdate", threadId: t.id, patch: { description: v } })} />
      <Field label="End goal (optional)" value={t.goal} onCommit={(v) => void run({ type: "story.threadUpdate", threadId: t.id, patch: { goal: v } })} />
      <p className="note">
        {count} beat{count === 1 ? "" : "s"}.
      </p>
      {atTable ? null : (
        <div className="inline story-actions">
          {count ? (
            <label>
              Move its beats to
              <select className="fld" value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
                <option value="">Sel a thread…</option>
                {st.threads
                  .filter((x) => x.id !== t.id)
                  .map((x) => (
                    <option key={x.id} value={x.id}>
                      {threadLabel(x, g.players)}
                    </option>
                  ))}
              </select>
            </label>
          ) : null}
          <button type="button" className="btn small danger" disabled={!!count && !moveTo} onClick={() => void run({ type: "story.threadRemove", threadId: t.id, ...(moveTo ? { moveTo } : {}) }).then((ok) => ok && onClose())}>
            Remove thread
          </button>
        </div>
      )}
    </div>
  );
}

function DatesEditor({ g, onClose }: { g: GameState; onClose: () => void }) {
  const { run } = useDm();
  const st = storyOf(g);
  const [start, setStart] = useState(st.dates[0]?.date ?? "2026-12-05");
  const [every, setEvery] = useState(14);
  const [add, setAdd] = useState("");
  return (
    <div className="story-editor">
      <div className="box-head">
        <h3>Session dates</h3>
        <button type="button" className="btn small" onClick={onClose}>
          Done
        </button>
      </div>
      <p className="note">Planned game nights. Episodes sit on their dates; &ldquo;must happen by&rdquo; warnings count the sessions left.</p>
      <form
        className="inline"
        onSubmit={(e) => {
          e.preventDefault();
          void run({ type: "story.datesGenerate", start, every }, "Session dates added.");
        }}
      >
        <label>
          Starting
          <input className="fld" type="date" value={start} onChange={(e) => setStart(e.target.value)} required />
        </label>
        <label>
          Every
          <select className="fld" value={every} onChange={(e) => setEvery(Number(e.target.value))}>
            <option value={7}>week</option>
            <option value={14}>2 weeks</option>
            <option value={21}>3 weeks</option>
            <option value={28}>4 weeks</option>
          </select>
        </label>
        <button type="submit" className="btn small primary" disabled={!start}>
          Fill in to Dec 2027
        </button>
      </form>
      <form
        className="inline"
        onSubmit={async (e) => {
          e.preventDefault();
          if (add && (await run({ type: "story.dateAdd", date: add }))) setAdd("");
        }}
      >
        <label>
          One more date
          <input className="fld" type="date" value={add} onChange={(e) => setAdd(e.target.value)} />
        </label>
        <button type="submit" className="btn small" disabled={!add}>
          Add
        </button>
      </form>
      <ol className="date-list">
        {st.dates.map((d) => {
          return (
            <li key={d.id} className={d.cancelled ? "cancelled" : ""}>
              <input className="fld" type="date" aria-label="Move to" value={d.date} onChange={(e) => e.target.value && void run({ type: "story.dateUpdate", dateId: d.id, date: e.target.value })} />
              <select className="fld" aria-label="Episode on this date" value={d.episodeId ?? ""} onChange={(e) => void run({ type: "story.dateUpdate", dateId: d.id, episodeId: e.target.value || null })}>
                <option value="">No episode</option>
                {(g.episodes ?? []).map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.title}
                  </option>
                ))}
              </select>
              <label className="check">
                <input type="checkbox" checked={!!d.cancelled} onChange={(e) => void run({ type: "story.dateUpdate", dateId: d.id, cancelled: e.target.checked })} />
                Cancelled
              </label>
              <button type="button" className="btn small icon" aria-label={`Remove ${dayLabel(d.date)}`} onClick={() => void run({ type: "story.dateRemove", dateId: d.id })}>
                ×
              </button>
            </li>
          );
        })}
      </ol>
      {!st.dates.length ? <p className="note">No dates yet.</p> : null}
    </div>
  );
}
