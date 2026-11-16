"use client";

// The episode builder: story beats placed in a run sheet, @mentions with
// autocomplete and "Create as new…", an episode's cast and props, its prep
// checklist, and the story ticks in run-game mode. DM-only, all of it.

import { useMemo, useRef, useState } from "react";
import { entriesOf, isStub, kindInfo, STUB_NOTE, uniqueSlug } from "@/shared/discovery";
import { castOf, CAST_GROUPS, episodeDate, findMentions, pendingPlacement, prepOf, resolveMention, splitMentions, STORY_SECTION, type Mention } from "@/shared/episodeBuilder";
import { dayLabel, linkInfo, storyOf, threadLabel, typeLabel, windowLabel } from "@/shared/story";
import type { Beat, Episode, GameState, StoryBeat } from "@/shared/types";
import { useDm } from "./context";

const useGame = () => useDm().view.state as unknown as GameState;

// ---------------------------------------------------------------------------
// Story blocks in the episode editor

/** The story beats placed in one run-sheet beat, with a way to take each out. */
export function StoryBlocks({ episodeId, beat }: { episodeId: string; beat: Beat }) {
  const { run } = useDm();
  const g = useGame();
  const st = storyOf(g);
  if (!beat.stories?.length) return null;
  return (
    <ul className="story-blocks" aria-label="Story beats placed here">
      {beat.stories.map((x) => {
        const sb = st.beats.find((b) => b.id === x.storyBeatId);
        const thread = sb && st.threads.find((t) => t.id === sb.threadId);
        return (
          <li key={x.storyBeatId} className={`story-block${x.done ? " done" : ""}`} style={{ ["--thread" as string]: thread?.color ?? "#888" }}>
            <span className="sb-kind">Story beat · {sb ? typeLabel(sb.type) : "deleted"}</span>
            <b>{x.done ? "✓ " : ""}{sb?.title ?? "A deleted story beat"}</b>
            {sb?.summary ? <span className="note">{sb.summary}</span> : null}
            {sb ? <FactLines g={g} sb={sb} /> : null}
            <button
              type="button"
              className="chip-x"
              aria-label={`Take “${sb?.title ?? "it"}” out of this episode`}
              title="Take it out of this episode (it goes back to Planned)"
              onClick={() => void run({ type: "episode.unplaceStory", episodeId, beatId: beat.id, storyBeatId: x.storyBeatId }, "Back to Planned.")}
            >
              ×
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function FactLines({ g, sb }: { g: GameState; sb: StoryBeat }) {
  const facts = sb.links.filter((l) => l.kind === "fact");
  if (!facts.length) return null;
  return (
    <ul className="sb-facts">
      {facts.map((l) => {
        const e = l.kind === "fact" ? entriesOf(g).find((x) => x.id === l.entryId) : undefined;
        const f = l.kind === "fact" ? e?.facts.find((x) => x.id === l.factId) : undefined;
        return (
          <li key={linkInfo(g, l).key}>
            <code>
              fact: {e?.kind}/{e?.slug}/{f?.slug}
            </code>{" "}
            <span className="note">{f?.text}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** "Add story beat": pick one, pick where it goes. */
export function AddStoryBeat({ ep }: { ep: Episode }) {
  const { run } = useDm();
  const g = useGame();
  const st = storyOf(g);
  const [sbId, setSbId] = useState("");
  const [beatId, setBeatId] = useState("");
  const free = (b: StoryBeat) => b.status !== "played" && (b.repeat || !pendingPlacement(g, b.id));
  return (
    <form
      className="inline add-story"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!sbId) return;
        if (await run({ type: "episode.placeStory", episodeId: ep.id, storyBeatId: sbId, ...(beatId ? { beatId } : {}) }, "Placed.")) setSbId("");
      }}
    >
      <label className="grow">
        Add story beat
        <select className="fld" value={sbId} onChange={(e) => setSbId(e.target.value)}>
          <option value="">Pick a story beat…</option>
          {st.threads.map((t) => {
            const list = st.beats.filter((b) => b.threadId === t.id && free(b) && b.status !== "dropped");
            return list.length ? (
              <optgroup key={t.id} label={threadLabel(t, g.players)}>
                {list.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} ({typeLabel(b.type)}, {windowLabel(b.window)})
                  </option>
                ))}
              </optgroup>
            ) : null;
          })}
        </select>
      </label>
      <label>
        Into
        <select className="fld" value={beatId} onChange={(e) => setBeatId(e.target.value)}>
          <option value="">“{STORY_SECTION}” at the end</option>
          {ep.beats
            .filter((b) => b.title !== STORY_SECTION)
            .map((b, i) => (
              <option key={b.id} value={b.id}>
                {i + 1}. {b.title}
              </option>
            ))}
        </select>
      </label>
      <button type="submit" className="btn" disabled={!sbId}>
        Place it
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Cast and props, and the prep checklist

/** Type your own item onto the prep checklist. */
function PrepAdd({ episodeId }: { episodeId: string }) {
  const { run } = useDm();
  const [text, setText] = useState("");
  const add = async () => {
    const t = text.trim();
    if (t && (await run({ type: "episode.prepNote", episodeId, text: t }))) setText("");
  };
  return (
    <form
      className="prep-add"
      onSubmit={(e) => {
        e.preventDefault();
        void add();
      }}
    >
      <input className="fld" placeholder="Add your own item, e.g. Need a name for the guard" maxLength={300} value={text} onChange={(e) => setText(e.target.value)} aria-label="Add a prep item" />
      <button className="btn" type="submit" disabled={!text.trim()}>
        Add
      </button>
    </form>
  );
}

export function CastAndPrep({ ep }: { ep: Episode }) {
  const { run } = useDm();
  const g = useGame();
  const st = storyOf(g);
  const cast = useMemo(() => castOf(g, ep), [g, ep]);
  const prep = useMemo(() => prepOf(g, ep), [g, ep]);
  const [showDone, setShowDone] = useState(false);
  const date = episodeDate(st, ep.id);
  const open = prep.filter((p) => !ep.prep?.[p.key]);
  const closed = prep.filter((p) => ep.prep?.[p.key]);
  const groups = CAST_GROUPS.filter((grp) => cast.some((c) => c.group === grp));
  return (
    <div className="cast-prep">
      <section className="cast-panel" aria-label="Cast and props">
        <h4>
          Cast and props <span className="note">{date ? `· on ${dayLabel(date)}` : ""}</span>
        </h4>
        {cast.length ? (
          <dl className="cast-list">
            {groups.map((grp) => (
              <div key={grp}>
                <dt>{grp}</dt>
                <dd>
                  {cast
                    .filter((c) => c.group === grp)
                    .map((c) => (
                      <span key={c.key} className={`chip${c.missingTemplate || (c.entry && isStub(c.entry)) ? " missing" : ""}`} title={`From: ${c.from.join(", ")}`}>
                        {c.label}
                        {c.entry && c.entry.stage === "hidden" ? <span className="chip-kind"> hidden</span> : null}
                      </span>
                    ))}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="note">Nobody yet. Type @ in a beat to mention someone, or place a story beat.</p>
        )}
      </section>
      <section className="prep-panel" aria-label="Prep checklist">
        <h4>
          Prep checklist <span className="note">· {open.length ? `${open.length} to do` : "all done"}</span>
        </h4>
        {open.length ? (
          <ul className="prep-list">
            {open.map((p) => (
              <li key={p.key}>
                <label className="check">
                  <input type="checkbox" checked={false} onChange={() => void run({ type: "episode.prep", episodeId: ep.id, key: p.key, state: "done" })} />
                  {p.text}
                </label>
                <button type="button" className="chip-x" aria-label={`Dismiss: ${p.text}`} title="Dismiss" onClick={() => void run({ type: "episode.prep", episodeId: ep.id, key: p.key, state: "dismissed" })}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="note">Nothing left to prep.</p>
        )}
        <PrepAdd episodeId={ep.id} />
        {closed.length ? (
          <>
            <button type="button" className="linkish note" aria-expanded={showDone} onClick={() => setShowDone((v) => !v)}>
              {showDone ? "Hide" : "Show"} {closed.length} ticked or dismissed
            </button>
            {showDone ? (
              <ul className="prep-list done">
                {closed.map((p) => (
                  <li key={p.key}>
                    <label className="check">
                      <input type="checkbox" checked onChange={() => void run({ type: "episode.prep", episodeId: ep.id, key: p.key, state: null })} />
                      <s>{p.text}</s> <span className="note">({ep.prep?.[p.key] === "dismissed" ? "dismissed" : "done"})</span>
                    </label>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : null}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// @mentions: the editor's autocomplete, and chips when reading

const STUB_KINDS = ["person", "place", "monster", "item"] as const;

/** The token being typed right before the caret ("@fen"), if any. */
function tokenAt(text: string, caret: number): { start: number; query: string } | null {
  const before = text.slice(0, caret);
  const m = /(?:^|[\s(\[“"'])@([a-z0-9/-]*)$/i.exec(before);
  return m ? { start: caret - m[1].length - 1, query: m[1] } : null;
}

/** A textarea where "@" opens a finder of people, places, monsters and flyers, with "Create as new…". */
export function MentionTextarea({ value, onChange, rows, label }: { value: string; onChange: (v: string) => void; rows: number; label: string }) {
  const { run } = useDm();
  const g = useGame();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [tok, setTok] = useState<{ start: number; query: string } | null>(null);
  const [hi, setHi] = useState(0);
  const hits = tok ? findMentions(g, tok.query.split("/").pop() ?? "", 7) : [];
  const name = tok ? tok.query.replace(/^[a-z]+\//, "").replace(/-/g, " ").trim() : "";
  const exact = tok && resolveMention(g, tok.query);
  // "Create as new" only when nothing already goes by that name.
  const creates = tok && name.length >= 2 && !exact && !hits.some((h) => h.label.toLowerCase().startsWith(name.toLowerCase())) ? STUB_KINDS : [];
  const total = hits.length + creates.length;

  const sync = (el: HTMLTextAreaElement) => {
    const t = tokenAt(el.value, el.selectionStart);
    setTok(t);
    setHi(0);
  };
  const insert = (full: string) => {
    if (!tok) return;
    const next = `${value.slice(0, tok.start)}@${full} ${value.slice(tok.start + 1 + tok.query.length)}`;
    onChange(next);
    setTok(null);
    const caret = tok.start + full.length + 2;
    requestAnimationFrame(() => {
      const ta = ref.current;
      if (ta) {
        ta.focus();
        ta.setSelectionRange(caret, caret);
      }
    });
  };
  const create = async (kind: (typeof STUB_KINDS)[number]) => {
    const display = name.replace(/\b\w/g, (c) => c.toUpperCase());
    const slug = uniqueSlug(entriesOf(g), kind, display);
    const ok = await run({ type: "entry.add", entry: { kind, name: display, dmNote: STUB_NOTE } }, `${display} added as a hidden ${kindInfo(kind).label.toLowerCase()}. Fill them in under Discovery.`);
    if (ok) insert(`${kind}/${slug}`);
  };
  const choose = (i: number) => {
    if (i < hits.length) insert(hits[i].ref);
    else void create(creates[i - hits.length]);
  };

  return (
    <div className="mention-wrap">
      <textarea
        ref={ref}
        className="fld mono"
        rows={rows}
        value={value}
        aria-label={label}
        aria-autocomplete="list"
        aria-expanded={!!tok && total > 0}
        onChange={(e) => {
          onChange(e.target.value);
          sync(e.target);
        }}
        onClick={(e) => sync(e.currentTarget)}
        onBlur={() => setTimeout(() => setTok(null), 150)}
        onKeyDown={(e) => {
          if (!tok || !total) return;
          if (e.key === "ArrowDown") setHi((h) => (h + 1) % total);
          else if (e.key === "ArrowUp") setHi((h) => (h - 1 + total) % total);
          else if (e.key === "Enter" || e.key === "Tab") choose(hi);
          else if (e.key === "Escape") setTok(null);
          else return;
          e.preventDefault();
          e.stopPropagation();
        }}
      />
      {tok && total ? (
        <ul className="mention-menu" role="listbox" aria-label="Mention">
          {hits.map((m, i) => (
            <li key={m.ref} role="option" aria-selected={i === hi} className={i === hi ? "on" : ""} onMouseDown={(e) => (e.preventDefault(), choose(i))}>
              <b>{m.label}</b> <span className="note">{mentionSub(m)}</span> <code>@{m.ref}</code>
            </li>
          ))}
          {creates.map((k, j) => (
            <li key={k} role="option" aria-selected={hits.length + j === hi} className={`create${hits.length + j === hi ? " on" : ""}`} onMouseDown={(e) => (e.preventDefault(), choose(hits.length + j))}>
              Create “{name}” as a new {kindInfo(k).label.toLowerCase()}…
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function mentionSub(m: Mention): string {
  if (m.entry) return `${kindInfo(m.entry.kind).label}${m.entry.stage === "hidden" ? " · hidden" : ""}${isStub(m.entry) ? " · stub" : ""}`;
  if (m.job) return `Job flyer${m.job.pinned ? "" : " · not pinned"}`;
  if (m.flyer) return `Player flyer${m.flyer.up ? "" : " · not up"}`;
  if (m.notice) return `Board note${m.notice.up ? "" : " · in the drawer"}`;
  return "Monster template";
}

/** Text with @mentions drawn as chips; a chip opens a little card about the entry. */
export function MentionText({ text }: { text: string }) {
  const g = useGame();
  const parts = splitMentions(text);
  if (parts.length === 1 && "text" in parts[0]) return <>{text}</>;
  return (
    <>
      {parts.map((p, i) => ("text" in p ? <span key={i}>{p.text}</span> : <MentionChip key={i} g={g} token={p.token} />))}
    </>
  );
}

function MentionChip({ g, token }: { g: GameState; token: string }) {
  const [open, setOpen] = useState(false);
  const m = resolveMention(g, token);
  if (!m) return <span className="mention missing" title="Nothing has this name yet">@{token}</span>;
  return (
    <span className="mention-anchor">
      <button type="button" className="mention" aria-expanded={open} onClick={() => setOpen((v) => !v)} title={`@${m.ref}`}>
        {m.label}
      </button>
      {open ? (
        <span className="mention-card" role="note">
          <b>{m.label}</b>
          <span className="note"> {mentionSub(m)}</span>
          {m.entry?.title ? <span className="mc-line">{m.entry.title}</span> : null}
          {m.entry?.summary ? <span className="mc-line">{m.entry.summary}</span> : null}
          {m.entry?.dmNote ? <span className="mc-line note">DM: {m.entry.dmNote}</span> : null}
          {m.job ? <span className="mc-line">{m.job.body}</span> : null}
          {m.notice?.body ? <span className="mc-line">{m.notice.body}</span> : null}
          {m.template ? <span className="mc-line">AC {m.template.ac} · HP {m.template.hp}</span> : null}
        </span>
      ) : null}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Run-game mode

/** Tick a story block: it's Played in this session. Asks for a one-line outcome (Enter saves, Esc skips). */
export function RunStoryBlocks({ episodeId, beat }: { episodeId: string; beat: Beat }) {
  const { run } = useDm();
  const g = useGame();
  const st = storyOf(g);
  const [asking, setAsking] = useState<string | null>(null);
  const [outcome, setOutcome] = useState("");
  if (!beat.stories?.length) return null;
  const tick = async (storyBeatId: string, text: string) => {
    if (await run({ type: "run.story", episodeId, beatId: beat.id, storyBeatId, done: true, ...(text.trim() ? { outcome: text } : {}) }, "Played.")) {
      setAsking(null);
      setOutcome("");
    }
  };
  return (
    <section className="run-story" aria-label="Story beats">
      {beat.stories.map((x) => {
        const sb = st.beats.find((b) => b.id === x.storyBeatId);
        if (!sb) return null;
        const play = x.done ? [...sb.plays].reverse().find((p) => p.episodeId === episodeId && p.sessionId === x.done!.sessionId) : undefined;
        return (
          <div key={x.storyBeatId} className={`run-story-block${x.done ? " done" : ""}`} style={{ ["--thread" as string]: st.threads.find((t) => t.id === sb.threadId)?.color ?? "#888" }}>
            <label className="check">
              <input
                type="checkbox"
                checked={!!x.done}
                onChange={(e) => {
                  if (e.target.checked) setAsking(x.storyBeatId);
                  else void run({ type: "run.story", episodeId, beatId: beat.id, storyBeatId: x.storyBeatId, done: false });
                }}
              />
              <span>
                <span className="sb-kind">Story beat · {typeLabel(sb.type)}</span> <b>{sb.title}</b>
              </span>
            </label>
            {sb.summary ? <p>{sb.summary}</p> : null}
            <FactLines g={g} sb={sb} />
            {play?.outcome ? <p className="note">Outcome: {play.outcome}</p> : null}
            {asking === x.storyBeatId ? (
              <form
                className="inline"
                onSubmit={(e) => {
                  e.preventDefault();
                  void tick(x.storyBeatId, outcome);
                }}
              >
                <label className="grow">
                  What happened? One line, or skip.
                  <input
                    className="fld"
                    autoFocus
                    maxLength={300}
                    value={outcome}
                    placeholder="They let Mardon go."
                    onChange={(e) => setOutcome(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        e.preventDefault();
                        e.stopPropagation();
                        void tick(x.storyBeatId, "");
                      }
                    }}
                  />
                </label>
                <button type="submit" className="btn small primary">
                  Save
                </button>
                <button type="button" className="btn small" onClick={() => void tick(x.storyBeatId, "")}>
                  Skip
                </button>
              </form>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}

/** At the end of an episode: placed story beats that didn't happen. */
export function Leftovers({ episode }: { episode: Episode }) {
  const { run } = useDm();
  const g = useGame();
  const st = storyOf(g);
  const [kept, setKept] = useState<string[]>([]);
  const left = episode.beats.flatMap((b) => (b.stories ?? []).filter((x) => !x.done).map((x) => x.storyBeatId)).filter((id, i, all) => all.indexOf(id) === i && !kept.includes(id));
  if (!left.length) return null;
  return (
    <section className="run-section">
      <h2>Story beats that didn&rsquo;t happen</h2>
      <ul className="leftovers">
        {left.map((id) => {
          const sb = st.beats.find((b) => b.id === id);
          return (
            <li key={id}>
              <b>{sb?.title ?? "A deleted story beat"}</b>
              <span className="inline">
                <button type="button" className="btn small" onClick={() => void run({ type: "episode.leftover", episodeId: episode.id, storyBeatId: id, choice: "planned" }, "Back to Planned.")}>
                  Back to Planned
                </button>
                <button
                  type="button"
                  className="btn small"
                  onClick={() => {
                    setKept([...kept, id]);
                    void run({ type: "episode.leftover", episodeId: episode.id, storyBeatId: id, choice: "keep" });
                  }}
                >
                  Keep for next time
                </button>
                <button type="button" className="btn small danger" onClick={() => void run({ type: "episode.leftover", episodeId: episode.id, storyBeatId: id, choice: "drop" }, "Dropped.")}>
                  Drop it
                </button>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
