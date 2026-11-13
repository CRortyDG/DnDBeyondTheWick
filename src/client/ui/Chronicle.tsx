"use client";

// The Chronicle: the story so far, chapter by chapter, note by note. The same
// screen serves players (their own notes) and the DM (every note, plus stars,
// hiding and the note-taker).

import { useEffect, useMemo, useRef, useState } from "react";
import { chapterHeading, chronicleMarkdown, NOTE_MAX, TAG_MAX, TAGS_PER_NOTE, tagKey, type ChronicleChapter, type ChronicleNote, type ChronicleView } from "@/shared/chronicle";

type Send = (cmd: object) => Promise<string | null>;

const ORDER_KEY = "candlefair-chronicle-order";

function loadOrder(): "newest" | "oldest" {
  try {
    return localStorage.getItem(ORDER_KEY) === "oldest" ? "oldest" : "newest";
  } catch {
    return "newest";
  }
}

const day = (ms: number) => new Date(ms).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const time = (ms: number) => new Date(ms).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
const sameDay = (a: number, b: number) => new Date(a).toDateString() === new Date(b).toDateString();

export function Chronicle({ view, gameName, send }: { view: ChronicleView; gameName: string; send: Send }) {
  const [order, setOrder] = useState<"newest" | "oldest">("newest");
  useEffect(() => setOrder(loadOrder()), []);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [starred, setStarred] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const latest = view.chapters[view.chapters.length - 1]?.id;
  const [open, setOpen] = useState<Set<string>>(() => new Set(latest ? [latest] : []));
  // A new chapter (a session starting) opens by itself.
  const seenLatest = useRef(latest);
  useEffect(() => {
    if (latest && latest !== seenLatest.current) {
      seenLatest.current = latest;
      setOpen((o) => new Set(o).add(latest));
    }
  }, [latest]);

  const flipOrder = () => {
    const next = order === "newest" ? "oldest" : "newest";
    setOrder(next);
    try {
      localStorage.setItem(ORDER_KEY, next);
    } catch {}
  };

  const filtering = !!q.trim() || !!tag || starred;
  const matches = useMemo(() => {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const tk = tag ? tagKey(tag) : null;
    return (n: ChronicleNote) => {
      if (starred && !n.starred) return false;
      if (tk && !n.tags.some((t) => tagKey(t) === tk)) return false;
      if (!words.length) return true;
      const hay = `${n.text} ${n.author} ${n.player ?? ""} ${n.tags.join(" ")}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    };
  }, [q, tag, starred]);

  const byChapter = useMemo(() => {
    const m = new Map<string, ChronicleNote[]>();
    for (const n of view.notes) {
      if (!m.has(n.chapterId)) m.set(n.chapterId, []);
      m.get(n.chapterId)!.push(n);
    }
    for (const list of m.values()) list.sort((a, b) => a.at - b.at);
    return m;
  }, [view.notes]);

  const chapters = order === "newest" ? [...view.chapters].reverse() : view.chapters;
  const shown = filtering ? chapters.filter((c) => (byChapter.get(c.id) ?? []).some(matches)) : chapters;
  const matchCount = filtering ? view.notes.filter(matches).length : 0;

  const copy = async (chapterId?: string) => {
    const text = chronicleMarkdown(view, { gameName, chapterId });
    try {
      await navigator.clipboard.writeText(text);
      setMsg(chapterId ? "Chapter copied as Markdown." : "The whole Chronicle is copied as Markdown.");
    } catch {
      // No clipboard (an old phone, or http): download it instead.
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([text], { type: "text/markdown" }));
      a.download = chapterId ? "chronicle-chapter.md" : "chronicle.md";
      a.click();
      URL.revokeObjectURL(a.href);
      setMsg("Saved as a Markdown file.");
    }
  };

  const pickTag = (t: string) => {
    setTag(t);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="chron">
      <QuickAdd view={view} send={send} />

      <div className="chron-tools" role="search">
        <input className="fld chron-search" type="search" placeholder="Search every note" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search the Chronicle" />
        <div className="chron-toggles">
          <button type="button" className="btn small" onClick={flipOrder} aria-label={`Showing ${order} first. Switch.`}>
            {order === "newest" ? "Newest first" : "Oldest first"}
          </button>
          <button type="button" className={`btn small${starred ? " on" : ""}`} aria-pressed={starred} onClick={() => setStarred((x) => !x)}>
            &#9733; Starred only
          </button>
          <button type="button" className="btn small" onClick={() => void copy()}>
            Copy all as Markdown
          </button>
        </div>
        {tag ? (
          <p className="chron-filter">
            Notes tagged <span className="chron-tag on">{tag}</span>
            <button type="button" className="linkish" onClick={() => setTag(null)}>
              Show all
            </button>
          </p>
        ) : null}
        {filtering ? (
          <p className="note" role="status">
            {matchCount === 0 ? "No notes match." : `${matchCount} note${matchCount === 1 ? "" : "s"} match.`}
          </p>
        ) : null}
        {msg ? (
          <p className="note" role="status">
            {msg}
          </p>
        ) : null}
      </div>

      {shown.map((c) => (
        <Chapter
          key={c.id}
          chapter={c}
          notes={(byChapter.get(c.id) ?? []).filter(matches)}
          total={(byChapter.get(c.id) ?? []).length}
          open={filtering || open.has(c.id)}
          onToggle={(o) =>
            setOpen((s) => {
              const n = new Set(s);
              if (o) n.add(c.id);
              else n.delete(c.id);
              return n;
            })
          }
          view={view}
          send={send}
          onTag={pickTag}
          onCopy={() => void copy(c.id)}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------

function QuickAdd({ view, send }: { view: ChronicleView; send: Send }) {
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [more, setMore] = useState(false);
  const [chapterId, setChapterId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const target = chapterId && view.chapters.some((c) => c.id === chapterId) ? chapterId : view.defaultChapterId;
  const targetChapter = view.chapters.find((c) => c.id === target);

  const post = async () => {
    const t = text;
    if (!t.trim() || busy) return;
    // Clear straight away so the next thought can go in; put it back if it fails.
    setText("");
    setBusy(true);
    const e = await send({ type: view.dm ? "note.add" : "me.noteAdd", text: t, tags, chapterId: target });
    setBusy(false);
    if (e) {
      setText((cur) => cur || t);
      setErr(e);
    } else {
      setErr(null);
      setTags([]);
    }
  };

  return (
    <form
      className="chron-add"
      onSubmit={(e) => {
        e.preventDefault();
        void post();
      }}
    >
      <label className="chron-add-label" htmlFor="chron-add-text">
        Add to {targetChapter ? chapterHeading(targetChapter) : "the Chronicle"}
      </label>
      <textarea
        id="chron-add-text"
        className="fld chron-add-text"
        rows={3}
        maxLength={NOTE_MAX}
        value={text}
        placeholder="What just happened? Chef says he bought the recipes from a traveling merchant…"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            void post();
          }
        }}
      />
      <div className="chron-add-row">
        <button type="submit" className="btn primary chron-post" disabled={!text.trim()}>
          Add note
        </button>
        <button type="button" className={`btn small${more ? " on" : ""}`} aria-expanded={more} onClick={() => setMore((m) => !m)}>
          {tags.length ? `Tags (${tags.length})` : "Tags"} &middot; chapter
        </button>
      </div>
      {more ? (
        <div className="chron-add-more">
          <TagEditor tags={tags} onChange={setTags} suggestions={view.tags} />
          <ChapterSelect chapters={view.chapters} value={target} onChange={setChapterId} />
        </div>
      ) : tags.length ? (
        <div className="chron-tags">
          {tags.map((t) => (
            <span key={t} className="chron-tag">
              {t}
            </span>
          ))}
        </div>
      ) : null}
      {err ? (
        <p className="note error-text" role="alert">
          {err}
        </p>
      ) : null}
    </form>
  );
}

function ChapterSelect({ chapters, value, onChange }: { chapters: ChronicleChapter[]; value: string; onChange: (id: string) => void }) {
  return (
    <label className="chron-chapter-pick">
      Chapter
      <select className="fld" value={value} onChange={(e) => onChange(e.target.value)}>
        {[...chapters].reverse().map((c) => (
          <option key={c.id} value={c.id}>
            {chapterHeading(c)}
            {c.running ? " (tonight)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Pick from things the table knows about, or type your own. */
function TagEditor({ tags, onChange, suggestions }: { tags: string[]; onChange: (t: string[]) => void; suggestions: string[] }) {
  const [v, setV] = useState("");
  const have = new Set(tags.map(tagKey));
  const k = tagKey(v);
  const offer = suggestions.filter((s) => !have.has(tagKey(s)) && (!k || tagKey(s).includes(k))).slice(0, k ? 8 : 12);
  const add = (t: string) => {
    const clean = t.replace(/\s+/g, " ").trim().slice(0, TAG_MAX);
    if (!clean || have.has(tagKey(clean)) || tags.length >= TAGS_PER_NOTE) return;
    onChange([...tags, clean]);
    setV("");
  };
  return (
    <div className="chron-tag-editor">
      {tags.length ? (
        <div className="chron-tags">
          {tags.map((t) => (
            <button key={t} type="button" className="chron-tag on" onClick={() => onChange(tags.filter((x) => x !== t))} aria-label={`Remove tag ${t}`}>
              {t} <span aria-hidden="true">&times;</span>
            </button>
          ))}
        </div>
      ) : null}
      <label>
        Tags: people, places, clues, quests, loot
        <input
          className="fld"
          value={v}
          maxLength={TAG_MAX}
          placeholder="Type a tag and press Enter"
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(v);
            }
          }}
        />
      </label>
      {offer.length || v.trim() ? (
        <div className="chron-tags chron-offer">
          {v.trim() && !suggestions.some((s) => tagKey(s) === k) ? (
            <button type="button" className="chron-tag new" onClick={() => add(v)}>
              + &ldquo;{v.trim()}&rdquo;
            </button>
          ) : null}
          {offer.map((s) => (
            <button key={s} type="button" className="chron-tag" onClick={() => add(s)}>
              + {s}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------

function Chapter({
  chapter: c,
  notes,
  total,
  open,
  onToggle,
  view,
  send,
  onTag,
  onCopy,
}: {
  chapter: ChronicleChapter;
  notes: ChronicleNote[];
  total: number;
  open: boolean;
  onToggle: (open: boolean) => void;
  view: ChronicleView;
  send: Send;
  onTag: (t: string) => void;
  onCopy: () => void;
}) {
  const named = chapterHeading(c);
  return (
    <section className={`chron-page${open ? " open" : ""}`} aria-label={named}>
      <button type="button" className="chron-page-head" aria-expanded={open} onClick={() => onToggle(!open)}>
        <span className="chron-page-title">{named}</span>
        <span className="chron-page-meta">
          {c.startedAt !== null ? day(c.startedAt) : "The next page"}
          {c.running ? " · tonight" : ""} &middot; {total} note{total === 1 ? "" : "s"}
        </span>
        <span className="chron-caret" aria-hidden="true">
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open ? (
        <div className="chron-page-body">
          {c.attendees.length || c.noteTaker || view.dm ? (
            <p className="chron-who">
              {c.attendees.length ? <>At the table: {c.attendees.join(", ")}</> : null}
              {c.noteTaker && !view.dm ? (
                <>
                  {c.attendees.length ? " · " : ""}
                  <Quill /> Note-taker: {c.noteTaker.name}
                </>
              ) : null}
            </p>
          ) : null}
          {view.dm && c.id !== "next" ? <NoteTakerPick chapter={c} view={view} send={send} /> : null}
          {c.recap?.trim() ? (
            <blockquote className="chron-recap">
              <div className="chron-recap-kicker">{c.endedAt === null ? "Recap (players see it once the session ends)" : "The DM's recap"}</div>
              {c.recap
                .trim()
                .split(/\n\s*\n/)
                .map((p, i) => (
                  <p key={i}>{p.trim()}</p>
                ))}
            </blockquote>
          ) : null}
          {notes.length ? (
            <ol className="chron-notes">
              {notes.map((n) => (
                <NoteLine key={n.id} note={n} chapter={c} view={view} send={send} onTag={onTag} />
              ))}
            </ol>
          ) : (
            <p className="chron-empty">{total ? "No notes here match." : "An empty page, waiting for the story."}</p>
          )}
          {total ? (
            <button type="button" className="linkish chron-copy" onClick={onCopy}>
              Copy this chapter as Markdown
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function NoteTakerPick({ chapter, view, send }: { chapter: ChronicleChapter; view: ChronicleView; send: Send }) {
  const [err, setErr] = useState<string | null>(null);
  return (
    <label className="chron-taker">
      <span>
        <Quill /> Note-taker
      </span>
      <select
        className="fld small-select"
        value={chapter.noteTaker?.id ?? ""}
        onChange={async (e) => setErr(await send({ type: "session.noteTaker", sessionId: chapter.id, playerId: e.target.value || null }))}
      >
        <option value="">Nobody</option>
        {(view.noteTakers ?? []).map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      {err ? <span className="error-text">{err}</span> : null}
    </label>
  );
}

function Quill() {
  return (
    <svg className="chron-quill" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 2c-6 1-11 6-13 12l-2 6 2 .5 1.6-4.2C14 15 18 9 20 2Z" fill="currentColor" />
      <path d="M4 22l3-8" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function NoteLine({ note: n, chapter, view, send, onTag }: { note: ChronicleNote; chapter: ChronicleChapter; view: ChronicleView; send: Send; onTag: (t: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const update = view.dm ? "note.update" : "me.noteUpdate";
  const remove = view.dm ? "note.remove" : "me.noteRemove";
  const when = chapter.startedAt !== null && sameDay(chapter.startedAt, n.at) ? time(n.at) : `${day(n.at)}, ${time(n.at)}`;

  if (editing) {
    return (
      <li className="chron-note editing">
        <EditNote
          note={n}
          view={view}
          onCancel={() => setEditing(false)}
          onSave={async (patch) => {
            const e = await send({ type: update, noteId: n.id, patch });
            setErr(e);
            if (!e) setEditing(false);
          }}
        />
        {err ? <p className="note error-text">{err}</p> : null}
      </li>
    );
  }

  return (
    <li className={`chron-note${n.starred ? " starred" : ""}${n.hidden ? " hidden" : ""}`}>
      <div className="chron-note-by">
        {n.starred ? (
          <span className="chron-star" role="img" aria-label="Starred">
            &#9733;
          </span>
        ) : null}
        <span className="chron-author">{n.author}</span>
        {n.quill ? (
          <span className="chron-quill-mark" title="Note-taker" aria-label="note-taker">
            <Quill />
          </span>
        ) : null}
        {n.player ? <span className="chron-player">({n.player})</span> : null}
        <span className="chron-when">
          {when}
          {n.editedAt ? " · edited" : ""}
        </span>
        {n.hidden ? <span className="tag wax">hidden from players</span> : null}
      </div>
      <div className="chron-text">{n.text}</div>
      {n.tags.length ? (
        <div className="chron-tags">
          {n.tags.map((t) => (
            <button key={t} type="button" className="chron-tag" onClick={() => onTag(t)} aria-label={`Show every note tagged ${t}`}>
              {t}
            </button>
          ))}
        </div>
      ) : null}
      {n.editable ? (
        <div className="chron-note-actions">
          {view.dm ? (
            <>
              <button type="button" className={`linkish${n.starred ? " on" : ""}`} onClick={async () => setErr(await send({ type: update, noteId: n.id, patch: { starred: !n.starred } }))}>
                {n.starred ? "Unstar" : "Star"}
              </button>
              <button type="button" className="linkish" onClick={async () => setErr(await send({ type: update, noteId: n.id, patch: { hidden: !n.hidden } }))}>
                {n.hidden ? "Show to players" : "Hide"}
              </button>
            </>
          ) : null}
          <button type="button" className="linkish" onClick={() => setEditing(true)}>
            Edit
          </button>
          {confirmDel ? (
            <>
              <button type="button" className="linkish danger" onClick={async () => setErr(await send({ type: remove, noteId: n.id }))}>
                Yes, delete it
              </button>
              <button type="button" className="linkish" onClick={() => setConfirmDel(false)}>
                Keep it
              </button>
            </>
          ) : (
            <button type="button" className="linkish" onClick={() => setConfirmDel(true)}>
              Delete
            </button>
          )}
        </div>
      ) : null}
      {err ? <p className="note error-text">{err}</p> : null}
    </li>
  );
}

function EditNote({ note, view, onSave, onCancel }: { note: ChronicleNote; view: ChronicleView; onSave: (p: { text: string; tags: string[]; chapterId: string }) => void; onCancel: () => void }) {
  const [text, setText] = useState(note.text);
  const [tags, setTags] = useState(note.tags);
  const [chapterId, setChapterId] = useState(note.chapterId);
  return (
    <form
      className="chron-edit"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ text, tags, chapterId });
      }}
    >
      <textarea className="fld chron-add-text" rows={3} maxLength={NOTE_MAX} value={text} onChange={(e) => setText(e.target.value)} aria-label="Note" autoFocus />
      <TagEditor tags={tags} onChange={setTags} suggestions={view.tags} />
      <ChapterSelect chapters={view.chapters} value={chapterId} onChange={setChapterId} />
      <div className="inline">
        <button type="submit" className="btn primary" disabled={!text.trim()}>
          Save
        </button>
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
