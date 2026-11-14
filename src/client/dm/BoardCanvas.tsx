"use client";

// The DM's notice board: a live copy of the TV board where every note can be
// dragged, tilted, resized, restacked, edited, taken down into the drawer, or thrown away.

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type DragEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { BOARD_MAX, boardNotes, defaultWidth, FONT_IDS, FONT_LABELS, LIST_MAX, noticesOf, PAPERS, PIN_IDS, PIN_LABELS, TITLE_SIZE_MAX, TITLE_SIZE_MIN, topZ, type NoteKind } from "@/shared/board";
import { projectTv, publicFlyer, publicJob, publicNotice } from "@/shared/projection";
import { jobsOf, jobTitle, pinnedCount } from "@/shared/renown";
import type { Flyer, GameState, Job, NoteLook, NotePlace, Notice, Paper } from "@/shared/types";
import { boardCards, FlyerCard, JobCard, NoteCard, placeStyle, type BoardView } from "../scenes/Board";
import { NoticeBoard } from "../scenes/NoticeBoard";
import { useDm } from "./context";
import { Check } from "./Check";
import { uploadImage } from "./upload";

type Key = { kind: NoteKind; id: string };
const keyOf = (k: Key) => `${k.kind}:${k.id}`;
type Mode = "move" | "rotate" | "resize";

/** The board as the TV shows it, built from the DM's full state. */
function boardOf(s: GameState): BoardView {
  const tv = projectTv(s, 0);
  return { notices: tv.notices, jobs: tv.jobs, flyers: tv.flyers, renown: tv.renown, plaqueHidden: tv.plaqueHidden };
}

export function BoardCanvas({ onEditJob, onNewJob }: { onEditJob: (id: string) => void; onNewJob: () => void }) {
  const { view, run, call, toast } = useDm();
  const s = view.state;
  const board = useMemo(() => boardOf(s), [s]);
  const [selected, setSelected] = useState<Key | null>(null);
  const [editing, setEditing] = useState<Key | null>(null);
  const [drag, setDrag] = useState<{ key: string; place: NotePlace } | null>(null);
  const [scale, setScale] = useState(0.5);
  const outer = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const op = useRef<{ key: Key; mode: Mode; x: number; y: number; start: NotePlace; cx: number; cy: number; moved: boolean } | null>(null);

  useLayoutEffect(() => {
    const el = outer.current;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / 1920);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const notes = boardNotes(s);
  const cards = boardCards(board);
  const up = pinnedCount(s);
  const sel = selected ? notes.find((n) => n.kind === selected.kind && n.id === selected.id) : undefined;
  const selCard = selected ? cards.find((c) => c.kind === selected.kind && c.id === selected.id) : undefined;

  const place = async (k: Key, p: NotePlace) => {
    const r = await call({ type: "board.place", note: k, place: p });
    if (r.error) toast(r.error);
  };
  /** Up on the board (at a spot, or the emptiest one) or down into the drawer. */
  const setUp = async (k: Key, on: boolean, at?: NotePlace) => {
    const cmd =
      k.kind === "notice"
        ? ({ type: "notice.update", noticeId: k.id, patch: { up: on, ...(at ? { place: at } : {}) } } as const)
        : k.kind === "job"
          ? ({ type: "job.pin", jobId: k.id, pinned: on, ...(at ? { place: at } : {}) } as const)
          : ({ type: "flyer.update", flyerId: k.id, patch: { up: on, ...(at ? { place: at } : {}) } } as const);
    const r = await call(cmd);
    if (r.error) return toast(r.error);
    if (!on && selected && keyOf(selected) === keyOf(k)) setSelected(null);
  };

  const down = (k: Key, mode: Mode, e: ReactPointerEvent<HTMLDivElement>, p: NotePlace) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    const wrap = (e.currentTarget.closest(".pin-at") as HTMLElement | null) ?? e.currentTarget;
    const r = wrap.getBoundingClientRect();
    op.current = { key: k, mode, x: e.clientX, y: e.clientY, start: p, cx: r.left + r.width / 2, cy: r.top + r.height / 2, moved: false };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setSelected(k);
  };
  const move = (e: ReactPointerEvent) => {
    const o = op.current;
    if (!o) return;
    const dx = (e.clientX - o.x) / scale;
    const dy = (e.clientY - o.y) / scale;
    if (!o.moved && Math.hypot(e.clientX - o.x, e.clientY - o.y) < 3) return;
    o.moved = true;
    let p = o.start;
    if (o.mode === "move") p = { ...p, x: Math.round(p.x + dx), y: Math.round(p.y + dy) };
    if (o.mode === "rotate") {
      let a = (Math.atan2(e.clientY - o.cy, e.clientX - o.cx) * 180) / Math.PI + 90;
      if (a > 180) a -= 360;
      a = e.shiftKey ? Math.round(a / 5) * 5 : Math.round(a);
      p = { ...p, rot: Math.max(-30, Math.min(30, a)) };
    }
    if (o.mode === "resize") {
      const t = (p.rot * Math.PI) / 180;
      p = { ...p, w: Math.round(Math.max(160, Math.min(640, p.w + dx * Math.cos(t) + dy * Math.sin(t)))) };
    }
    setDrag({ key: keyOf(o.key), place: p });
  };
  const upPtr = async () => {
    const o = op.current;
    op.current = null;
    if (!o || !o.moved || !drag) return setDrag(null);
    await place(o.key, drag.place);
    setDrag(null);
  };

  const restack = (k: Key, p: NotePlace, top: boolean) => {
    if (top) return place(k, { ...p, z: topZ(s) + 1 });
    const low = Math.min(...cards.map((c) => c.place.z));
    if (low > 0) return place(k, { ...p, z: low - 1 });
    // Already at the bottom: lift everything else one step.
    void Promise.all(cards.filter((c) => !(c.kind === k.kind && c.id === k.id)).map((c) => call({ type: "board.place", note: { kind: c.kind, id: c.id }, place: { ...c.place, z: c.place.z + 1 } }))).then(() => place(k, { ...p, z: 0 }));
  };

  // A note just added (new or duplicated): select it once it arrives.
  const [awaiting, setAwaiting] = useState<{ ids: Set<string>; edit: boolean } | null>(null);
  useEffect(() => {
    if (!awaiting) return;
    const n = noticesOf(s).find((x) => !awaiting.ids.has(x.id));
    if (!n) return;
    const k = { kind: "notice" as const, id: n.id };
    setSelected(k);
    if (awaiting.edit) setEditing(k);
    setAwaiting(null);
  }, [s, awaiting]);
  const adding = async (cmd: Parameters<typeof call>[0], edit: boolean) => {
    const ids = new Set(noticesOf(s).map((x) => x.id));
    const r = await call(cmd);
    if (r.error) return toast(r.error);
    setAwaiting({ ids, edit });
  };
  const newNote = () => adding({ type: "notice.add", notice: { style: "cream", title: "New notice", body: "", look: { pin: "red" } } }, true);
  const duplicate = (id: string) => {
    const n = noticesOf(s).find((x) => x.id === id);
    if (!n) return;
    return adding({ type: "notice.add", notice: { style: n.style, title: n.title, body: n.body, sign: n.sign, look: n.look, dmNote: n.dmNote, place: { ...n.place, x: n.place.x + 30, y: n.place.y + 30, z: topZ(s) + 1 } } }, false);
  };

  // Drop from the drawer: where it lands is where it hangs.
  const onDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("text/x-board-note");
    if (!raw || !layer.current) return;
    const [kind, id] = raw.split(":") as [NoteKind, string];
    const r = layer.current.getBoundingClientRect();
    const w = widthOf(s, { kind, id });
    const x = Math.round((e.clientX - r.left) / scale - w / 2);
    const y = Math.round((e.clientY - r.top) / scale - 30);
    await setUp({ kind, id }, true, { x, y, rot: 0, w, z: topZ(s) + 1 });
    setSelected({ kind, id });
  };

  const drawer = drawerOf(s);
  const editThing = editing ? thingOf(s, editing) : undefined;

  return (
    <section className="box board-wide board-canvas-box">
      <div className="box-head">
        <h3>The notice board</h3>
        <span className="note">
          {up} of {BOARD_MAX} up
        </span>
      </div>
      <p className="note">This is the TV&rsquo;s board. Drag a note to move it, the round handle to tilt it, the side handle to make it wider. Double-click to edit. Changes go to the TV when you let go. Notes in the drawer never leave this screen.</p>
      <div className="inline">
        <button type="button" className="btn primary" onClick={() => void newNote()}>
          New note
        </button>
        <button type="button" className="btn" onClick={onNewJob}>
          New job flyer
        </button>
        <Check checked={!s.plaqueHidden} onChange={(v) => run({ type: "board.plaque", shown: v })}>
          Renown plaque on the frame
        </Check>
      </div>

      <div ref={outer} className="board-canvas" onPointerMove={move} onPointerUp={() => void upPtr()} onPointerDown={() => setSelected(null)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => void onDrop(e)}>
        <div className="board-canvas-stage" style={{ transform: `scale(${scale})` }}>
          <NoticeBoard>
            <div ref={layer} className="board-edit-layer">
              {cards.map((c) => {
                const k = { kind: c.kind, id: c.id };
                const key = keyOf(k);
                const p = drag?.key === key ? drag.place : c.place;
                const on = selected && keyOf(selected) === key;
                return (
                  <div
                    key={key}
                    data-note={key}
                    className={`pin-at editable${on ? " selected" : ""}`}
                    style={placeStyle(p)}
                    onPointerDown={(e) => down(k, "move", e, c.place)}
                    onDoubleClick={() => (c.kind === "job" ? onEditJob(c.id) : setEditing(k))}
                    tabIndex={0}
                    aria-label={`${notes.find((n) => n.kind === c.kind && n.id === c.id)?.title || "Note"}: drag to move`}
                    onKeyDown={(e) => {
                      const step = e.shiftKey ? 20 : 4;
                      const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
                      if (!d) return;
                      e.preventDefault();
                      void place(k, { ...c.place, x: c.place.x + d[0], y: c.place.y + d[1] });
                    }}
                  >
                    {c.render()}
                  </div>
                );
              })}
              {selected && selCard ? (
                // The handles ride above every note, so a note on top never hides them.
                <SelectionFrame key={keyOf(selected)} place={drag?.key === keyOf(selected) ? drag.place : selCard.place} target={`${selected.kind}:${selected.id}`} onDown={(mode, e) => down(selected, mode, e, selCard.place)} />
              ) : null}
            </div>
          </NoticeBoard>
        </div>
      </div>

      {sel && selCard ? (
        <div className="board-toolbar" role="toolbar" aria-label="Selected note">
          <b className="board-toolbar-title">{sel.kind === "job" ? `Job: ${jobTitle(jobsOf(s).find((j) => j.id === sel.id) ?? { style: "scrawl", title: sel.title })}` : sel.kind === "flyer" ? `Player flyer: ${sel.title}` : sel.title || "Note"}</b>
          <span className="note">@flyer/{sel.slug}</span>
          <button type="button" className="btn small" onClick={() => (sel.kind === "job" ? onEditJob(sel.id) : setEditing(sel))}>
            Edit&hellip;
          </button>
          <button type="button" className="btn small" onClick={() => void restack(sel, selCard.place, true)}>
            To front
          </button>
          <button type="button" className="btn small" onClick={() => void restack(sel, selCard.place, false)}>
            To back
          </button>
          <button type="button" className="btn small" onClick={() => void place(sel, { ...selCard.place, rot: 0 })}>
            Straighten
          </button>
          {sel.kind === "notice" ? (
            <button type="button" className="btn small" onClick={() => void duplicate(sel.id)}>
              Duplicate
            </button>
          ) : null}
          <button type="button" className="btn small" onClick={() => void setUp(sel, false)}>
            Take down
          </button>
        </div>
      ) : null}

      {editThing ? <NoteEditor key={keyOf(editing!)} thing={editThing} onClose={() => setEditing(null)} /> : null}

      <div className="board-drawer">
        <h4>
          The drawer <span className="note">({drawer.length}) drag one onto the board, or put it up where there&rsquo;s room</span>
        </h4>
        {!drawer.length ? <p className="note">Empty. Notes you take down land here.</p> : null}
        <div className="board-drawer-list">
          {drawer.map((d) => (
            <div
              key={keyOf(d.key)}
              className="board-drawer-item"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/x-board-note", keyOf(d.key));
                e.dataTransfer.effectAllowed = "move";
              }}
            >
              <div className="board-drawer-paper" style={{ width: `${d.w}px` }}>
                {d.render()}
              </div>
              <div className="board-row-actions">
                <span className="tag">{d.key.kind === "job" ? "job" : d.key.kind === "flyer" ? "player flyer" : "note"}</span>
                <button type="button" className="btn small primary" onClick={() => void setUp(d.key, true)}>
                  Put up
                </button>
                <button type="button" className="btn small" onClick={() => (d.key.kind === "job" ? onEditJob(d.key.id) : setEditing(d.key))}>
                  Edit
                </button>
                {d.key.kind !== "job" ? (
                  <button
                    type="button"
                    className="btn small danger"
                    onClick={() => {
                      if (!confirm(`Throw away “${d.title}”?`)) return;
                      void run(d.key.kind === "notice" ? { type: "notice.remove", noticeId: d.key.id } : { type: "flyer.remove", flyerId: d.key.id });
                    }}
                  >
                    Throw away
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** The tilt and width handles over the selected note, sized to it. */
function SelectionFrame({ place, target, onDown }: { place: NotePlace; target: string; onDown: (mode: Mode, e: ReactPointerEvent<HTMLDivElement>) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current?.parentElement?.querySelector<HTMLElement>(`[data-note="${CSS.escape(target)}"]`);
    if (!el) return;
    const fit = () => setH(el.offsetHeight);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [target]);
  return (
    <div ref={ref} className="pin-at select-frame" style={{ ...placeStyle(place), height: `${h}px`, zIndex: 900 }}>
      <div className="handle handle-rot" title="Tilt (Shift: 5° steps)" onPointerDown={(e) => onDown("rotate", e)} />
      <div className="handle handle-w" title="Width" onPointerDown={(e) => onDown("resize", e)} />
    </div>
  );
}

function widthOf(s: GameState, k: Key): number {
  const t = thingOf(s, k);
  if (!t) return 290;
  const it = t.kind === "notice" ? t.n : t.kind === "job" ? t.j : t.f;
  return it.place?.w ?? defaultWidth((t.kind === "notice" ? t.n.style : t.kind === "job" ? t.j.style : t.f.style) ?? "white");
}

type Thing = { kind: "notice"; n: Notice } | { kind: "job"; j: Job } | { kind: "flyer"; f: Flyer };
function thingOf(s: GameState, k: Key): Thing | undefined {
  if (k.kind === "notice") {
    const n = noticesOf(s).find((x) => x.id === k.id);
    return n && { kind: "notice", n };
  }
  if (k.kind === "job") {
    const j = jobsOf(s).find((x) => x.id === k.id);
    return j && { kind: "job", j };
  }
  const f = s.flyers.find((x) => x.id === k.id);
  return f && { kind: "flyer", f };
}

/** Everything that could go up but isn't: notes taken down, unpinned jobs (not pulled), player flyers waiting. */
function drawerOf(s: GameState) {
  const out: { key: Key; title: string; w: number; render: () => ReactNode }[] = [];
  const w = (p: NotePlace | undefined, st: Paper | undefined) => Math.round(p?.w ?? defaultWidth(st ?? "white"));
  for (const n of noticesOf(s)) if (!n.up) out.push({ key: { kind: "notice", id: n.id }, title: n.title || "Note", w: w(n.place, n.style), render: () => <NoteCard face={publicNotice(n)} page /> });
  for (const j of jobsOf(s)) if (!j.pinned && j.status !== "expired") out.push({ key: { kind: "job", id: j.id }, title: jobTitle(j), w: w(j.place, j.style), render: () => <JobCard job={publicJob(s, j)} page /> });
  for (const f of s.flyers) if (!f.up) out.push({ key: { kind: "flyer", id: f.id }, title: f.title, w: w(f.place, f.style), render: () => <FlyerCard flyer={publicFlyer(f)} page /> });
  return out;
}

// ---------- editing a note's words and looks ----------

/** Bring an editor into view when it opens (once, not on every keystroke). */
export function useScrollIn() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    void ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);
  return ref;
}

interface Words {
  style: Paper | undefined;
  title: string;
  body: string;
  sign: string;
  look: NoteLook;
  slug?: string;
  dmNote?: string;
}

function wordsOf(t: Thing): Words {
  if (t.kind === "notice") return { style: t.n.style, title: t.n.title, body: t.n.body, sign: t.n.sign, look: structuredClone(t.n.look), slug: t.n.slug, dmNote: t.n.dmNote };
  if (t.kind === "job") return { style: t.j.style, title: t.j.title, body: t.j.body, sign: t.j.postedBy, look: structuredClone(t.j.look ?? {}) };
  return { style: t.f.style, title: t.f.title, body: t.f.body, sign: t.f.signedBy, look: structuredClone(t.f.look ?? {}) };
}

/** Edit a plain note or a player's flyer. Jobs use the job editor (it has the reward and locks). */
function NoteEditor({ thing, onClose }: { thing: Thing; onClose: () => void }) {
  const { call, toast } = useDm();
  const scrollIn = useScrollIn();
  const [d, setD] = useState<Words>(() => wordsOf(thing));
  const set = <K extends keyof Words>(k: K, v: Words[K]) => setD((x) => ({ ...x, [k]: v }));
  const width = (thing.kind === "notice" ? thing.n.place.w : thing.kind === "flyer" ? thing.f.place?.w : undefined) ?? 290;

  const save = async () => {
    const r =
      thing.kind === "notice"
        ? await call({ type: "notice.update", noticeId: thing.n.id, patch: { style: d.style ?? "cream", title: d.title, body: d.body, sign: d.sign, look: d.look, slug: d.slug ?? "", dmNote: d.dmNote ?? "" } })
        : thing.kind === "flyer"
          ? await call({ type: "flyer.update", flyerId: thing.f.id, patch: { title: d.title || "Notice", body: d.body, signedBy: d.sign, look: d.look, ...(d.style ? { style: d.style } : {}) } })
          : { error: "Edit jobs in the job editor." };
    if (r.error) return toast(r.error);
    toast("Saved.");
    onClose();
  };
  const remove = async () => {
    if (!confirm(`Throw away “${d.title || "this note"}”?`)) return;
    const r = thing.kind === "notice" ? await call({ type: "notice.remove", noticeId: thing.n.id }) : thing.kind === "flyer" ? await call({ type: "flyer.remove", flyerId: thing.f.id }) : { error: "" };
    if (r.error) return toast(r.error);
    onClose();
  };
  const face = { style: d.style ?? "white", title: d.title, body: d.body, sign: d.sign, look: thing.kind === "flyer" && !d.style ? { font: "hand" as const, ...d.look } : d.look };

  return (
    <div ref={scrollIn} className="box board-editor" role="group" aria-label="Edit note">
      <h4>{thing.kind === "flyer" ? "Player flyer" : "Note"}</h4>
      <div className="board-editor-split">
        <div className="form">
          <label>
            Title
            <input className="fld" value={d.title} maxLength={thing.kind === "flyer" ? 60 : 120} onChange={(e) => set("title", e.target.value)} />
          </label>
          <label>
            Text
            <textarea className="fld" rows={4} value={d.body} maxLength={thing.kind === "flyer" ? 400 : 800} onChange={(e) => set("body", e.target.value)} />
          </label>
          <label>
            Signed
            <input className="fld" value={d.sign} maxLength={thing.kind === "flyer" ? 60 : 80} onChange={(e) => set("sign", e.target.value)} placeholder="The Watch" />
          </label>
          <LookFields style={d.style} setStyle={(v) => set("style", v)} look={d.look} setLook={(v) => set("look", v)} allowDefault={thing.kind === "flyer"} />
          {thing.kind === "notice" ? (
            <>
              <label>
                Short name (for run sheets: @flyer/&hellip;)
                <input className="fld" value={d.slug ?? ""} maxLength={40} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} />
              </label>
              <label>
                Your note (only you see it)
                <textarea className="fld" rows={2} value={d.dmNote ?? ""} onChange={(e) => set("dmNote", e.target.value)} />
              </label>
            </>
          ) : null}
        </div>
        <div className="board-editor-preview">
          <div style={{ width: `${width}px` }}>{d.style || thing.kind !== "flyer" ? <NoteCard face={face} page /> : <FlyerCard flyer={{ id: "p", title: d.title, body: d.body, signedBy: d.sign, at: 0 }} page />}</div>
        </div>
      </div>
      <div className="inline">
        <button type="button" className="btn primary" onClick={() => void save()}>
          Save
        </button>
        <button type="button" className="btn" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn danger" onClick={() => void remove()}>
          Throw away
        </button>
      </div>
    </div>
  );
}

/** Paper, pin, type and the extra lines any note can have. Shared by notes, player flyers and job flyers. */
export function LookFields({ style, setStyle, look, setLook, allowDefault }: { style: Paper | undefined; setStyle: (p: Paper) => void; look: NoteLook; setLook: (l: NoteLook) => void; allowDefault?: boolean }) {
  const { ident, toast } = useDm();
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof NoteLook>(k: K, v: NoteLook[K] | undefined) => {
    const next = { ...look };
    if (v === undefined || v === "" || v === false) delete next[k];
    else next[k] = v;
    setLook(next);
  };
  const list = look.list ?? [];
  const setItem = (i: number, part: "head" | "text", v: string) => set("list", list.map((x, j) => (j === i ? { ...x, [part]: v } : x)));
  const pick = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    try {
      set("image", await uploadImage(ident, f));
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <fieldset className="look-fields">
      <legend>Looks</legend>
      <div className="inline">
        <label>
          Paper
          <select className="fld" value={style ?? ""} onChange={(e) => setStyle(e.target.value as Paper)}>
            {allowDefault && !style ? <option value="">As the player wrote it</option> : null}
            {PAPERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Pin
          <select className="fld" value={look.pin ?? ""} onChange={(e) => set("pin", (e.target.value || undefined) as NoteLook["pin"])}>
            <option value="">Paper&rsquo;s own</option>
            {PIN_IDS.map((p) => (
              <option key={p} value={p}>
                {PIN_LABELS[p]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Title type
          <select className="fld" value={look.font ?? ""} onChange={(e) => set("font", (e.target.value || undefined) as NoteLook["font"])}>
            <option value="">Paper&rsquo;s own</option>
            {FONT_IDS.map((f) => (
              <option key={f} value={f}>
                {FONT_LABELS[f]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Title size
          <input className="fld amt" type="number" min={TITLE_SIZE_MIN} max={TITLE_SIZE_MAX} value={look.titleSize ?? ""} placeholder="auto" onChange={(e) => set("titleSize", e.target.value ? Number(e.target.value) : undefined)} />
        </label>
        <label>
          Title ink
          <select className="fld" value={look.ink ?? ""} onChange={(e) => set("ink", (e.target.value || undefined) as NoteLook["ink"])}>
            <option value="">Paper&rsquo;s own</option>
            <option value="red">Red</option>
            <option value="blue">Blue</option>
            <option value="gold">Gold</option>
          </select>
        </label>
        <label>
          Text
          <select className="fld" value={look.align ?? ""} onChange={(e) => set("align", (e.target.value || undefined) as NoteLook["align"])}>
            <option value="">Centred</option>
            <option value="left">Left</option>
          </select>
        </label>
        <label className="check">
          <input type="checkbox" checked={!!look.band} onChange={(e) => set("band", e.target.checked)} /> Band across the top
        </label>
      </div>
      <label>
        Small line above the title
        <input className="fld" value={look.kicker ?? ""} maxLength={80} onChange={(e) => set("kicker", e.target.value)} placeholder="Hear ye, good folk of Candlefair" />
      </label>
      <label>
        Line under the title
        <input className="fld" value={look.sub ?? ""} maxLength={80} onChange={(e) => set("sub", e.target.value)} placeholder="after dark" />
      </label>
      <div className="look-list">
        <span>
          List{" "}
          <input className="fld look-list-label" value={look.listLabel ?? ""} maxLength={30} onChange={(e) => set("listLabel", e.target.value)} placeholder="Wanted" aria-label="Word over the list" />
        </span>
        {list.map((x, i) => (
          <div key={i} className="inline">
            <input className="fld" value={x.head} maxLength={40} onChange={(e) => setItem(i, "head", e.target.value)} placeholder="Steady Climbers" aria-label={`List line ${i + 1} heading`} />
            <input className="fld" value={x.text} maxLength={160} onChange={(e) => setItem(i, "text", e.target.value)} placeholder="to hang fir garlands" aria-label={`List line ${i + 1} text`} />
            <button type="button" className="btn small" onClick={() => set("list", list.filter((_, j) => j !== i))} aria-label={`Remove list line ${i + 1}`}>
              ✕
            </button>
          </div>
        ))}
        {list.length < LIST_MAX ? (
          <button type="button" className="btn small" onClick={() => set("list", [...list, { head: "", text: "" }])}>
            Add a list line
          </button>
        ) : null}
      </div>
      <label>
        Small print at the bottom
        <textarea className="fld" rows={2} value={look.footer ?? ""} maxLength={400} onChange={(e) => set("footer", e.target.value)} />
      </label>
      <label>
        Under the signature
        <input className="fld" value={look.signNote ?? ""} maxLength={80} onChange={(e) => set("signNote", e.target.value)} placeholder="Planner of Winterfest" />
      </label>
      <div className="inline">
        <label className="btn small">
          {busy ? "Uploading…" : look.image ? "Change picture" : "Add a picture"}
          <input type="file" accept="image/*" hidden onChange={(e) => void pick(e.target.files?.[0])} />
        </label>
        {look.image ? (
          <button type="button" className="btn small" onClick={() => set("image", undefined)}>
            Remove picture
          </button>
        ) : null}
      </div>
    </fieldset>
  );
}

