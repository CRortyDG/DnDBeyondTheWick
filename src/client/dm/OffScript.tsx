"use client";

// The off-script kit: a slide-out panel for when the players leave the plan
// (O in run-game mode and the DM console), and quick capture (N).
//
// DM-only. Nothing in here changes the TV unless the DM presses a Show,
// Deliver-on-TV or Met-now button; everything else is the DM's own notes.

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AMBIENT, ambientOfRef } from "@/shared/ambient";
import { refForScene, resolveRef } from "@/shared/assets";
import { entriesOf, kindInfo, stageLabel } from "@/shared/discovery";
import { capturesOf, cluesOf, hereOf, hereView, readyClues } from "@/shared/offscript";
import { storyOf } from "@/shared/story";
import type { Clue, Entry, GameState } from "@/shared/types";
import { AmbientScene } from "../scenes/Ambient";
import { Drawer } from "./Drawer";
import { useDm } from "./context";
import { typing } from "./QuickBar";

export type OffTab = "here" | "clues" | "scenes" | "notes";
const TABS: { id: OffTab; label: string }[] = [
  { id: "here", label: "Here" },
  { id: "clues", label: "Clues" },
  { id: "scenes", label: "Scenes" },
  { id: "notes", label: "Notes" },
];

/** Is the off-script panel or the quick note box open? Other key handlers step aside. */
export function isOffScriptOpen(): boolean {
  return !!document.querySelector(".offscript, .capture-box");
}

function useGame(): GameState {
  return useDm().view.state as unknown as GameState;
}

/** The panel. tab: which section; the parent remembers it between openings. */
export function OffScriptPanel({ tab, setTab, onClose, episodeId }: { tab: OffTab; setTab: (t: OffTab) => void; onClose: () => void; episodeId?: string }) {
  // ↑ and ↓ move between sections (← → and Space still step the run sheet).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (typing(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      const i = TABS.findIndex((t) => t.id === tab);
      setTab(TABS[(i + (e.key === "ArrowDown" ? 1 : TABS.length - 1)) % TABS.length].id);
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tab, setTab]);

  return (
    <Drawer title="Off-script" subtitle="Only you see this. Nothing reaches the TV until you press Show, Reveal or Deliver on the TV." onClose={onClose} closeLabel="Close">
      <div className="offscript">
        <div className="seg offscript-tabs" role="tablist" aria-label="Off-script sections (↑ ↓)">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={`btn small${tab === t.id ? " on" : ""}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        {tab === "here" ? <HereSection /> : null}
        {tab === "clues" ? <CluesSection episodeId={episodeId} /> : null}
        {tab === "scenes" ? <ScenesSection /> : null}
        {tab === "notes" ? <NotesSection /> : null}
      </div>
    </Drawer>
  );
}

// ---------------------------------------------------------------------------
// Where the party is

/** Pick where the party is. One click; a place with a default scene offers it. */
export function HerePicker({ compact }: { compact?: boolean }) {
  const { run } = useDm();
  const g = useGame();
  const here = hereOf(g);
  const places = entriesOf(g).filter((e) => e.kind === "place");
  if (!places.length) return compact ? null : <p className="note">No places yet. Add one in Discover (kind: place) to track where the party is.</p>;
  return (
    <label className={`here-pick${compact ? " compact" : ""}`}>
      <span className={compact ? "sr-only" : "note"}>The party is at</span>
      <select className="fld" value={here?.id ?? ""} onChange={(e) => void run({ type: "here.set", placeId: e.target.value || null })}>
        <option value="">Nowhere in particular</option>
        {places.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
            {p.stage === "hidden" ? " (hidden)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

function StageTag({ e }: { e: Entry }) {
  return <span className={`tag entry-stage-${e.stage}`}>{stageLabel(e.kind, e.stage)}</span>;
}

function HereSection() {
  const { run } = useDm();
  const g = useGame();
  const v = hereView(g);
  const threads = new Map(storyOf(g).threads.map((t) => [t.id, t.name || "Backstory"]));
  return (
    <section className="offscript-sec" aria-label="Here">
      <HerePicker />
      {v ? (
        <>
          <DefaultScene place={v.place} />
          <HereList title="People here" empty="Nobody is tied to this place yet. Link people to it in Discover." items={v.people.map((e) => ({ key: e.id, main: e.name, sub: e.title, tag: <StageTag e={e} /> }))} />
          <HereList
            title="Sites inside"
            empty="No places or shops inside it."
            items={v.sites.map((e) => ({
              key: e.id,
              main: e.name,
              sub: kindInfo(e.kind).label,
              tag: <StageTag e={e} />,
              act: e.kind === "place" ? (
                <button type="button" className="btn small" onClick={() => void run({ type: "here.set", placeId: e.id })}>
                  Go there
                </button>
              ) : undefined,
            }))}
          />
          <HereList title="Open leads pointing here" empty="No open leads point here." items={v.leads.map((l) => ({ key: l.id, main: l.text, tag: l.shown ? undefined : <span className="tag">not shown</span> }))} />
          <HereList title="Story beats for here or anywhere" empty="No unplayed story beats are tied to this place or marked “anywhere”." items={v.beats.map((b) => ({ key: b.id, main: b.title, sub: `${threads.get(b.threadId) ?? ""}${b.anywhere ? " · anywhere" : ""}` }))} />
          <section className="offscript-list">
            <h3>Clues for here</h3>
            {v.clues.length ? v.clues.map((c) => <ClueRow key={c.id} clue={c} />) : <p className="note">No ready clues are tagged for this place or its people.</p>}
          </section>
        </>
      ) : (
        <p className="note">Set where the party is to see who and what is here. Showing a place (or its pin on a map) moves the party there too.</p>
      )}
    </section>
  );
}

function HereList({ title, items, empty }: { title: string; empty: string; items: { key: string; main: string; sub?: string; tag?: ReactNode; act?: ReactNode }[] }) {
  return (
    <section className="offscript-list">
      <h3>{title}</h3>
      {items.length ? (
        <ul>
          {items.map((x) => (
            <li key={x.key}>
              <span className="offscript-main">{x.main}</span>
              {x.sub ? <span className="note"> {x.sub}</span> : null}
              {x.tag ? <> {x.tag}</> : null}
              {x.act ? <span className="offscript-act">{x.act}</span> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="note">{empty}</p>
      )}
    </section>
  );
}

/** The place's default TV scene: one click to show, and where to change it. */
function DefaultScene({ place }: { place: Entry }) {
  const { run } = useDm();
  const g = useGame();
  const ref = place.place?.scene;
  const a = ref ? resolveRef(g, ref) : null;
  const amb = ambientOfRef(ref);
  return (
    <div className="offscript-default">
      {a ? (
        <>
          <span>
            TV scene for {place.name}: <b>{a.label}</b>
            {place.place?.caption ? <span className="note"> “{place.place.caption}”</span> : null}
          </span>
          <button type="button" className="btn small primary" onClick={() => void (amb ? run({ type: "ambient.show", id: amb, ...(place.place?.caption ? { caption: place.place.caption } : {}) }) : run({ type: "show", ref: a.ref }))}>
            <span className="key">V</span> Show it
          </button>
        </>
      ) : (
        <span className="note">{place.name} has no TV scene yet. Under Scenes, press “Use here” on one.</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Clues

function ClueRow({ clue }: { clue: Clue }) {
  const { run } = useDm();
  const g = useGame();
  const [open, setOpen] = useState(false);
  const here = hereOf(g);
  const [placeId, setPlaceId] = useState(here?.id ?? "");
  const [viaId, setViaId] = useState("");
  const [tv, setTv] = useState(true);
  const all = entriesOf(g);
  const fact = clue.fact ? all.find((e) => e.id === clue.fact!.entryId)?.facts.find((f) => f.id === clue.fact!.factId) : undefined;
  const factOwner = clue.fact ? all.find((e) => e.id === clue.fact!.entryId) : undefined;
  const mystery = clue.entryId ? all.find((e) => e.id === clue.entryId) : undefined;
  const beat = clue.storyBeatId ? storyOf(g).beats.find((b) => b.id === clue.storyBeatId) : undefined;
  const tags = clue.tags.map((t) => all.find((e) => e.id === t)?.name ?? storyOf(g).threads.find((x) => x.id === t)?.name).filter(Boolean);
  const reveals = (!!fact && fact.revealedAt === undefined) || (!!mystery && (mystery.stage === "hidden" || mystery.stage === "rumored"));
  return (
    <div className="clue-row">
      <div className="clue-text">{clue.text}</div>
      <div className="clue-meta note">
        {clue.episodeId === null ? <span className="tag">pool</span> : null}
        {fact ? <span>Reveals: {factOwner?.name} · “{fact.text}”{fact.revealedAt !== undefined ? " (already known)" : ""}</span> : null}
        {mystery ? <span>Moves {mystery.name} forward ({stageLabel(mystery.kind, mystery.stage)})</span> : null}
        {beat ? <span>Plays: {beat.title}</span> : null}
        {tags.length ? <span>About: {tags.join(", ")}</span> : null}
      </div>
      {open ? (
        <div className="clue-deliver">
          <label>
            <span className="note">Where</span>
            <select className="fld" value={placeId} onChange={(e) => setPlaceId(e.target.value)}>
              <option value="">Not saying</option>
              {all
                .filter((e) => e.kind === "place")
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            <span className="note">Through whom</span>
            <select className="fld" value={viaId} onChange={(e) => setViaId(e.target.value)}>
              <option value="">Nobody in particular</option>
              {all
                .filter((e) => e.kind === "person")
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
            </select>
          </label>
          {reveals ? (
            <label className="check">
              <input type="checkbox" checked={tv} onChange={(e) => setTv(e.target.checked)} /> Reveal it on the TV
            </label>
          ) : null}
          <div className="row">
            <button
              type="button"
              className="btn small primary"
              onClick={async () => {
                if (await run({ type: "clue.deliver", clueId: clue.id, placeId: placeId || null, viaId: viaId || null, tv: reveals && tv }, "Clue delivered.")) setOpen(false);
              }}
            >
              Deliver
            </button>
            <button type="button" className="btn small" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn small" onClick={() => (setPlaceId(here?.id ?? ""), setOpen(true))}>
          Deliver…
        </button>
      )}
    </div>
  );
}

function CluesSection({ episodeId }: { episodeId?: string }) {
  const { run } = useDm();
  const g = useGame();
  const ready = readyClues(g, episodeId);
  const [text, setText] = useState("");
  const sess = g.currentSessionId;
  const delivered = cluesOf(g).filter((c) => c.status === "delivered" && sess && c.delivered?.sessionId === sess);
  const all = entriesOf(g);
  const add = async () => {
    if (!text.trim()) return;
    if (await run({ type: "clue.add", clue: { text, episodeId: episodeId ?? null } })) setText("");
  };
  return (
    <section className="offscript-sec" aria-label="Clues">
      <p className="note">Secrets and clues you can drop wherever the party ends up. This episode&rsquo;s first, then the campaign pool.</p>
      {ready.length ? ready.map((c) => <ClueRow key={c.id} clue={c} />) : <p className="note">No ready clues. Write some in the episode builder, or add one here.</p>}
      <div className="row offscript-add">
        <input className="fld" value={text} maxLength={400} placeholder={episodeId ? "A new clue for this episode" : "A new clue for the pool"} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void add()} />
        <button type="button" className="btn small" onClick={() => void add()}>
          Add
        </button>
      </div>
      {delivered.length ? (
        <section className="offscript-list">
          <h3>Delivered this session</h3>
          <ul>
            {delivered.map((c) => (
              <li key={c.id}>
                <span className="offscript-main">{c.text}</span>
                <span className="note">
                  {c.delivered?.placeId ? ` at ${all.find((e) => e.id === c.delivered!.placeId)?.name ?? "?"}` : ""}
                  {c.delivered?.viaId ? `, through ${all.find((e) => e.id === c.delivered!.viaId)?.name ?? "?"}` : ""}
                </span>
                <span className="offscript-act">
                  <button type="button" className="btn small" onClick={() => void run({ type: "clue.settle", clueId: c.id, to: "ready" })}>
                    Undo
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Ambient scenes

function ScenesSection() {
  const { run } = useDm();
  const g = useGame();
  const here = hereOf(g);
  const liveAmb = g.live.ambient?.id;
  const [caption, setCaption] = useState(() => (here?.place?.caption ?? ""));
  const placeScene = ambientOfRef(here?.place?.scene);
  return (
    <section className="offscript-sec" aria-label="Scenes">
      <p className="note">Click a scene to put it on the TV. The caption is optional.</p>
      <label className="offscript-caption">
        <span className="note">Caption on the TV</span>
        <input className="fld" value={caption} maxLength={80} placeholder="The coast road, dusk." onChange={(e) => setCaption(e.target.value)} />
      </label>
      <div className="amb-grid">
        {AMBIENT.map((a) => (
          <div key={a.id} className={`amb-tile${liveAmb === a.id ? " live" : ""}`}>
            <button type="button" className="amb-thumb" aria-label={`Show ${a.label} on the TV`} onClick={() => void run({ type: "ambient.show", id: a.id, caption: caption.trim() })}>
              <AmbientScene id={a.id} />
            </button>
            <div className="amb-tile-foot">
              <span>{a.label}</span>
              {liveAmb === a.id ? <span className="tag">on the TV</span> : null}
              {here ? (
                <button
                  type="button"
                  className={`btn tiny${placeScene === a.id ? " on" : ""}`}
                  title={`Make this ${here.name}'s scene`}
                  onClick={() => void run({ type: "place.setup", entryId: here.id, scene: placeScene === a.id ? null : `ambient/${a.id}`, caption: caption.trim() || null }, placeScene === a.id ? undefined : `${a.label} is now ${here.name}'s scene.`)}
                >
                  {placeScene === a.id ? "Here’s scene ✓" : "Use here"}
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Quick notes

function NotesSection() {
  const { run } = useDm();
  const g = useGame();
  const sess = g.currentSessionId;
  const notes = capturesOf(g).filter((c) => c.status === "open" && (!sess || c.sessionId === sess));
  const all = entriesOf(g);
  return (
    <section className="offscript-sec" aria-label="Quick notes">
      <p className="note">
        Press <span className="key">N</span> anywhere in run-game mode to jot something down. After the session, turn each note into a draft at wrap-up.
      </p>
      {notes.length ? (
        <ul className="capture-list">
          {notes.map((c) => (
            <li key={c.id}>
              <span className="offscript-main">{c.text}</span>
              <span className="note">
                {" "}
                {new Date(c.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                {c.placeId ? ` · ${all.find((e) => e.id === c.placeId)?.name ?? ""}` : ""}
              </span>
              <span className="offscript-act">
                <button type="button" className="btn small" onClick={() => void run({ type: "capture.update", captureId: c.id, status: "dismissed" })}>
                  Dismiss
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="note">No notes yet this session.</p>
      )}
    </section>
  );
}

/** N: a one-line note box. Enter saves it (with the time, place and session), Esc cancels. */
export function QuickCapture({ onClose }: { onClose: () => void }) {
  const { run } = useDm();
  const g = useGame();
  const here = hereOf(g);
  const [text, setText] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);
  const save = async () => {
    if (!text.trim()) return onClose();
    if (await run({ type: "capture.add", text }, "Noted.")) onClose();
  };
  return (
    <div className="capture-box" role="dialog" aria-label="Quick note">
      <input
        ref={input}
        className="fld"
        value={text}
        maxLength={500}
        placeholder={here ? `A quick note (at ${here.name})` : "A quick note"}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void save();
          } else if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }
        }}
      />
      <span className="note">Enter saves · Esc cancels</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Wrap-up: leftover clues and "Turn notes into…"

export function ClueLeftovers({ episodeId }: { episodeId: string }) {
  const { run } = useDm();
  const g = useGame();
  const left = cluesOf(g).filter((c) => c.episodeId === episodeId && c.status === "ready");
  if (!left.length) return null;
  return (
    <section className="run-section">
      <h2>Clues not delivered</h2>
      <ul className="run-notelist">
        {left.map((c) => (
          <li key={c.id} className="clue-left">
            <div className="run-notelist-text">{c.text}</div>
            <div className="row">
              <button type="button" className="btn small" title="It stays with this episode, ready for the next session" onClick={() => void run({ type: "clue.settle", clueId: c.id, to: "keep" }, "Kept for next time.")}>
                Keep for next episode
              </button>
              <button type="button" className="btn small" onClick={() => void run({ type: "clue.settle", clueId: c.id, to: "pool" }, "Moved to the clue pool.")}>
                Move to pool
              </button>
              <button type="button" className="btn small" onClick={() => void run({ type: "clue.settle", clueId: c.id, to: "drop" }, "Dropped.")}>
                Drop
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

type MakeAs = "person" | "place" | "fact" | "job" | "beat";
const MAKE_LABEL: Record<MakeAs, string> = { person: "Person", place: "Place", fact: "Fact", job: "Flyer", beat: "Story beat" };

/** A guess at what a note is: "Met Old Tam the ferryman" is a person; "The mill" a place. */
function guessAs(text: string, g: GameState): MakeAs {
  const t = text.toLowerCase();
  if (/\b(met|named|called|innkeeper|keeper|captain|ferryman|guard|merchant|smith|priest)\b/.test(t)) return "person";
  if (/\b(job|bounty|reward|wanted|flyer|notice)\b/.test(t)) return "job";
  if (/\b(inn|tavern|mill|shop|tower|bridge|cave|farm|chapel|square|street|dock|docks|road)\b/.test(t)) return "place";
  if (entriesOf(g).some((e) => e.kind !== "place" && t.includes(e.name.toLowerCase()))) return "fact";
  return "beat";
}

/** The first few words as a title: "Old Tam, the ferryman, owes the mill money" -> "Old Tam". */
function guessTitle(text: string, as: MakeAs): string {
  const t = text.trim();
  if (as === "fact" || as === "beat") return t.slice(0, 160);
  const cut = t.split(/[,.;:\-–—(]/)[0].replace(/^(met|meet|found|visited|went to)\s+/i, "").trim();
  return (cut || t).slice(0, 80);
}

export function TurnNotesInto({ sessionId }: { sessionId: string }) {
  const g = useGame();
  const notes = capturesOf(g).filter((c) => c.sessionId === sessionId && c.status === "open");
  const made = capturesOf(g).filter((c) => c.sessionId === sessionId && c.status === "made");
  if (!notes.length && !made.length) return null;
  return (
    <section className="run-section">
      <h2>Turn notes into&hellip;</h2>
      <p className="note">Each quick note can become a draft (Hidden, marked for review), or be dismissed.</p>
      {notes.map((c) => (
        <NoteToDraft key={c.id} id={c.id} text={c.text} />
      ))}
      {made.length ? <p className="note">{made.length} already turned into drafts.</p> : null}
    </section>
  );
}

function NoteToDraft({ id, text }: { id: string; text: string }) {
  const { run } = useDm();
  const g = useGame();
  const [as, setAs] = useState<MakeAs>(() => guessAs(text, g));
  const [title, setTitle] = useState(() => guessTitle(text, as));
  const [whose, setWhose] = useState(() => entriesOf(g).find((e) => text.toLowerCase().includes(e.name.toLowerCase()))?.id ?? "");
  const pick = (a: MakeAs) => {
    setAs(a);
    setTitle(guessTitle(text, a));
  };
  const entries = useMemo(() => entriesOf(g), [g]);
  return (
    <div className="note-draft">
      <div className="note-draft-text">{text}</div>
      <div className="seg" role="group" aria-label="Turn it into">
        {(Object.keys(MAKE_LABEL) as MakeAs[]).map((a) => (
          <button key={a} type="button" className={`btn small${as === a ? " on" : ""}`} aria-pressed={as === a} onClick={() => pick(a)}>
            {MAKE_LABEL[a]}
          </button>
        ))}
      </div>
      <div className="row">
        {as === "fact" ? (
          <select className="fld" aria-label="Whose fact" value={whose} onChange={(e) => setWhose(e.target.value)}>
            <option value="">Whose fact is it?</option>
            {entries.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        ) : null}
        <input className="fld" aria-label={as === "fact" ? "The fact" : "Name or title"} value={title} maxLength={160} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="row">
        <button
          type="button"
          className="btn small primary"
          disabled={!title.trim() || (as === "fact" && !whose)}
          onClick={() => void run({ type: "capture.make", captureId: id, as, title: title.trim(), body: as === "fact" ? undefined : text, ...(as === "fact" ? { entryId: whose } : {}) }, `Made a ${MAKE_LABEL[as].toLowerCase()} draft.`)}
        >
          Make {MAKE_LABEL[as].toLowerCase()} draft
        </button>
        <button type="button" className="btn small" onClick={() => void run({ type: "capture.update", captureId: id, status: "dismissed" })}>
          Dismiss
        </button>
      </div>
    </div>
  );
}

/** Keys for the kit: O opens the panel, N a quick note, V shows the current place's scene while the panel is open. */
export function useOffScriptKeys(opts: { enabled: boolean; panelOpen: boolean; togglePanel: () => void; openCapture: () => void }) {
  const { run, view } = useDm();
  const g = view.state as unknown as GameState;
  const here = hereOf(g);
  const scene = here?.place?.scene;
  const caption = here?.place?.caption;
  const { enabled, panelOpen, togglePanel, openCapture } = opts;
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (typing(e) || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      if (document.querySelector(".capture-box, .finder, .inbox-drawer")) return;
      const k = e.key.toLowerCase();
      if (k === "o") togglePanel();
      else if (k === "n") openCapture();
      else if (k === "v" && panelOpen && scene) {
        const amb = ambientOfRef(scene);
        void run(amb ? { type: "ambient.show", id: amb, ...(caption ? { caption } : {}) } : { type: "show", ref: scene });
      } else return;
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, panelOpen, togglePanel, openCapture, run, scene, caption]);
}

// ---------------------------------------------------------------------------
// Prep: writing clues (the episode builder, and the pool on the Story page)

/** The clues written for an episode, or the campaign pool (episodeId null). */
export function CluesEditor({ episodeId }: { episodeId: string | null }) {
  const { run } = useDm();
  const g = useGame();
  const list = cluesOf(g).filter((c) => c.episodeId === episodeId);
  const [text, setText] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const ready = list.filter((c) => c.status === "ready").length;
  const add = async () => {
    if (!text.trim()) return;
    if (await run({ type: "clue.add", clue: { text, episodeId } })) setText("");
  };
  return (
    <section className="clue-editor" aria-label={episodeId ? "Clues for this episode" : "The clue pool"}>
      <h4>
        {episodeId ? "Clues" : "Clue pool"} <span className="note">· {ready} ready{episodeId ? " (aim for 5 to 10)" : ""}</span>
      </h4>
      <p className="note">{episodeId ? "Short secrets and clues not tied to any scene. In run-game mode you deliver them wherever the party is." : "Clues not tied to an episode. They show in run-game mode after the episode's own."}</p>
      {list.length ? (
        <ul className="clue-edit-list">
          {list.map((c) => (
            <li key={c.id} className={`clue-edit status-${c.status}`}>
              <div className="clue-edit-line">
                <span className="clue-text">{c.text}</span>
                {c.status !== "ready" ? <span className="tag">{c.status}</span> : null}
                <span className="offscript-act">
                  <button type="button" className="btn small" aria-expanded={open === c.id} onClick={() => setOpen(open === c.id ? null : c.id)}>
                    {open === c.id ? "Done" : "Edit"}
                  </button>
                </span>
              </div>
              {open === c.id ? <ClueFields clue={c} /> : null}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="row offscript-add">
        <input className="fld" value={text} maxLength={400} placeholder="The miller's daughter was seen at the crypt" onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void add()} />
        <button type="button" className="btn small" onClick={() => void add()}>
          Add clue
        </button>
      </div>
    </section>
  );
}

function ClueFields({ clue }: { clue: Clue }) {
  const { run } = useDm();
  const g = useGame();
  const all = entriesOf(g);
  const st = storyOf(g);
  const up = (patch: Extract<Parameters<typeof run>[0], { type: "clue.update" }>["patch"]) => void run({ type: "clue.update", clueId: clue.id, patch });
  const [text, setText] = useState(clue.text);
  const factValue = clue.fact ? `${clue.fact.entryId}|${clue.fact.factId}` : "";
  const tagOptions = [...all.filter((e) => e.kind === "person" || e.kind === "place").map((e) => ({ id: e.id, label: e.name })), ...st.threads.map((t) => ({ id: t.id, label: `Thread: ${t.name || "Backstory"}` }))];
  return (
    <div className="clue-fields">
      <label>
        <span className="note">Clue</span>
        <input className="fld" value={text} maxLength={400} onChange={(e) => setText(e.target.value)} onBlur={() => text.trim() && text !== clue.text && up({ text })} />
      </label>
      <label>
        <span className="note">Reveals a fact</span>
        <select
          className="fld"
          value={factValue}
          onChange={(e) => {
            const [entryId, factId] = e.target.value.split("|");
            up({ fact: factId ? { entryId, factId } : null });
          }}
        >
          <option value="">No fact</option>
          {all
            .filter((e) => e.facts.length)
            .map((e) => (
              <optgroup key={e.id} label={e.name}>
                {e.facts.map((f) => (
                  <option key={f.id} value={`${e.id}|${f.id}`}>
                    {f.text.slice(0, 90)}
                  </option>
                ))}
              </optgroup>
            ))}
        </select>
      </label>
      <label>
        <span className="note">Moves a mystery (or anything) one stage forward</span>
        <select className="fld" value={clue.entryId ?? ""} onChange={(e) => up({ entryId: e.target.value || null })}>
          <option value="">Nothing</option>
          {all.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name} ({kindInfo(e.kind).label}, {stageLabel(e.kind, e.stage)})
            </option>
          ))}
        </select>
      </label>
      {st.beats.length ? (
        <label>
          <span className="note">Plays a story beat</span>
          <select className="fld" value={clue.storyBeatId ?? ""} onChange={(e) => up({ storyBeatId: e.target.value || null })}>
            <option value="">No story beat</option>
            {st.beats
              .filter((b) => b.status !== "dropped")
              .map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
          </select>
        </label>
      ) : null}
      <div>
        <span className="note">About (shows it in the Here section for these)</span>
        <div className="chips">
          {clue.tags.map((t) => (
            <span key={t} className="chip">
              {tagOptions.find((o) => o.id === t)?.label ?? "?"}
              <button type="button" className="chip-x" aria-label="Remove" onClick={() => up({ tags: clue.tags.filter((x) => x !== t) })}>
                ×
              </button>
            </span>
          ))}
          <select className="fld" value="" aria-label="Add who or where it's about" onChange={(e) => e.target.value && up({ tags: [...clue.tags, e.target.value] })}>
            <option value="">+ person, place or thread</option>
            {tagOptions
              .filter((o) => !clue.tags.includes(o.id))
              .map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
          </select>
        </div>
      </div>
      <div className="row">
        {clue.status !== "ready" ? (
          <button type="button" className="btn small" onClick={() => void run({ type: "clue.settle", clueId: clue.id, to: "ready" })}>
            Make it ready again
          </button>
        ) : (
          <button type="button" className="btn small" onClick={() => void run({ type: "clue.settle", clueId: clue.id, to: "drop" })}>
            Drop
          </button>
        )}
        {clue.episodeId !== null ? (
          <button type="button" className="btn small" onClick={() => void run({ type: "clue.update", clueId: clue.id, patch: { episodeId: null } })}>
            Move to the pool
          </button>
        ) : null}
        <button type="button" className="btn small danger" onClick={() => void run({ type: "clue.remove", clueId: clue.id }, "Clue removed.")}>
          Remove
        </button>
      </div>
    </div>
  );
}

/** A place's default TV scene and caption, in its Discover editor. */
export function PlaceSceneFields({ place }: { place: Entry }) {
  const { run } = useDm();
  const g = useGame();
  const [caption, setCaption] = useState(place.place?.caption ?? "");
  const maps = g.scenes.filter((x) => x.kind === "map");
  return (
    <div className="place-scene">
      <label>
        Off-script TV scene (suggested when the party gets here)
        <select className="fld" value={place.place?.scene ?? ""} onChange={(e) => void run({ type: "place.setup", entryId: place.id, scene: e.target.value || null })}>
          <option value="">None</option>
          <optgroup label="Ambient scenes">
            {AMBIENT.map((a) => (
              <option key={a.id} value={`ambient/${a.id}`}>
                {a.label}
              </option>
            ))}
          </optgroup>
          {maps.length ? (
            <optgroup label="Maps">
              {maps.map((m) => (
                <option key={m.id} value={refForScene(g, m)}>
                  {m.label}
                </option>
              ))}
            </optgroup>
          ) : null}
        </select>
      </label>
      {ambientOfRef(place.place?.scene) ? (
        <label>
          Caption on the TV
          <input className="fld" value={caption} maxLength={80} placeholder="The coast road, dusk." onChange={(e) => setCaption(e.target.value)} onBlur={() => caption !== (place.place?.caption ?? "") && void run({ type: "place.setup", entryId: place.id, caption: caption.trim() || null })} />
        </label>
      ) : null}
    </div>
  );
}

/** The DM console's way in: a top-bar button, O for the panel and N for a quick note. */
export function OffScriptButton({ enabled }: { enabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<OffTab>("here");
  const [capturing, setCapturing] = useState(false);
  const toggle = useMemo(() => () => setOpen((v) => !v), []);
  const capture = useMemo(() => () => setCapturing(true), []);
  useOffScriptKeys({ enabled: enabled && !capturing, panelOpen: open, togglePanel: toggle, openCapture: capture });
  const g = useGame();
  const run = g.sessions.find((x) => x.id === g.currentSessionId)?.run;
  return (
    <>
      <button type="button" className={`btn small${open ? " on" : ""}`} aria-pressed={open} title="Off-script tools (O). N jots a quick note." onClick={toggle}>
        <span className="key">O</span> Off-script
      </button>
      {open ? <OffScriptPanel tab={tab} setTab={setTab} onClose={() => setOpen(false)} episodeId={run?.episodeId} /> : null}
      {capturing ? <QuickCapture onClose={() => setCapturing(false)} /> : null}
    </>
  );
}
