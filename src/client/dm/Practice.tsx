"use client";

// Practice mode on the DM's screen: the PRACTICE bar (timer, notes, stand-ins,
// preview, reset, end), the preview of the practice TV and a stand-in's phone,
// the end screen, and the live console's way in.

import { MenuItem } from "./RowMenu";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { aboutDuration, formatDuration, practiceTimes, type PracticeEdit, type PracticeTimes } from "@/shared/practice";
import type { PracticeInfo } from "@/shared/types";
import { api, hrefFor, practiceHref, type Ident } from "../api";
import { useDm } from "./context";
import { useAutosave } from "./useAutosave";

// ---------------------------------------------------------------------------
// The way in, from the live console

export interface PracticeStatus {
  active: boolean;
  startedAt?: number;
  episodeId?: string;
  episodeTitle?: string;
}

export function usePracticeStatus(ident: Ident) {
  const [status, setStatus] = useState<PracticeStatus | null>(null);
  const reload = useCallback(() => {
    if (ident.practice) return;
    api<PracticeStatus>("/api/practice", ident)
      .then(setStatus)
      .catch(() => setStatus({ active: false }));
  }, [ident]);
  useEffect(() => {
    reload();
    // Coming back to this tab (say, after finishing practice in the other one).
    const onVis = () => document.visibilityState === "visible" && reload();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [reload]);
  return { status, reload };
}

/** Start (or resume) practice and open it in a new tab, so this live console stays as it is. */
export async function openPractice(ident: Ident, episodeId?: string): Promise<string | null> {
  // Open the tab now, while the click still counts, so the browser doesn't block it.
  const w = window.open("about:blank", `candlefair-practice-${ident.game}`);
  try {
    await api("/api/practice/start", ident, {
      method: "POST",
      body: JSON.stringify(episodeId ? { episodeId } : {}),
    });
  } catch (e) {
    w?.close();
    return e instanceof Error ? e.message : "Couldn't start practice.";
  }
  const href = practiceHref(ident.game, "DM");
  if (w) w.location.href = href;
  else window.location.href = href;
  return null;
}

/** The top bar button on the live console: Practice, or Resume practice when one is waiting. */
/** Practice in the top bar's ⋯ menu, away from Start session. While a practice is running, PracticeButton shows Resume instead. */
export function PracticeItems({ episodeId, episodeTitle }: { episodeId?: string; episodeTitle?: string }) {
  const { ident, toast } = useDm();
  const { status } = usePracticeStatus(ident);
  if (status?.active) return null;
  const go = async (ep?: string) => {
    const err = await openPractice(ident, ep);
    if (err) toast(err);
  };
  return (
    <>
      {episodeId ? (
        <MenuItem onClick={() => go(episodeId)} title="Rehearse alone on a private copy. Nothing reaches the real TV or phones.">
          Practice {episodeTitle ? `“${episodeTitle}”` : "this episode"}
        </MenuItem>
      ) : null}
      <MenuItem onClick={() => go()} title="A private copy of the campaign as it is now. Opens in a new tab; the real TV and phones never see it.">
        Practice mode
      </MenuItem>
    </>
  );
}

/** Only shown while a practice is running: one tap back into it. */
export function PracticeResume() {
  const { ident, toast } = useDm();
  const { status } = usePracticeStatus(ident);
  if (!status?.active) return null;
  return (
    <button className="btn practice-btn active" type="button" onClick={async () => { const err = await openPractice(ident); if (err) toast(err); }} title={`Practice started ${new Date(status.startedAt ?? 0).toLocaleString()}`}>
      Resume practice{status.episodeTitle ? `: ${status.episodeTitle}` : ""}
    </button>
  );
}

export function PracticeButton({ episodeId, episodeTitle }: { episodeId?: string; episodeTitle?: string }) {
  const { ident, toast } = useDm();
  const { status } = usePracticeStatus(ident);
  const [open, setOpen] = useState(false);
  const go = async (ep?: string) => {
    setOpen(false);
    const err = await openPractice(ident, ep);
    if (err) toast(err);
  };
  if (status?.active) {
    return (
      <button className="btn practice-btn active" type="button" onClick={() => go()} title={`Practice started ${new Date(status.startedAt ?? 0).toLocaleString()}`}>
        Resume practice{status.episodeTitle ? `: ${status.episodeTitle}` : ""}
      </button>
    );
  }
  return (
    <span className="practice-menu">
      <button className="btn practice-btn" type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} title="Rehearse alone on a private copy. Nothing reaches the real TV or phones.">
        Practice
      </button>
      {open ? (
        <div className="practice-pop" role="menu">
          {episodeId ? (
            <button type="button" role="menuitem" className="practice-pop-item" onClick={() => go(episodeId)}>
              <b>Practice this episode</b>
              <span className="note">{episodeTitle}: its run sheet is up, ready to click through.</span>
            </button>
          ) : null}
          <button type="button" role="menuitem" className="practice-pop-item" onClick={() => go()}>
            <b>Practice mode</b>
            <span className="note">A private copy of the campaign as it is now. Try anything.</span>
          </button>
          <p className="note">Opens in a new tab. The real TV and phones never see it.</p>
        </div>
      ) : null}
    </span>
  );
}

// ---------------------------------------------------------------------------
// The PRACTICE bar, on every practice screen of the DM's

function useNow(everyMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(t);
  }, [everyMs]);
  return now;
}

/** A tab hidden for more than two minutes is time away from practice: tell the server how long. */
function useAwayTime(onAway: (ms: number) => void) {
  useEffect(() => {
    let hiddenAt: number | null = null;
    const onVis = () => {
      if (document.visibilityState === "hidden") hiddenAt = Date.now();
      else if (hiddenAt !== null) {
        const ms = Date.now() - hiddenAt;
        hiddenAt = null;
        if (ms > 2 * 60_000) onAway(ms);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [onAway]);
}

export function PracticeBar({ practice }: { practice: PracticeInfo }) {
  const { view, run, ident, toast } = useDm();
  const s = view.state;
  const now = useNow(1000);
  const times = practiceTimes(practice, now);
  const [pane, setPane] = useState<"notes" | "standins" | null>(null);
  const [preview, setPreview] = useState(false);
  const [ending, setEnding] = useState(false);
  const ep = practice.episodeId ? (s.episodes ?? []).find((e) => e.id === practice.episodeId) : undefined;
  const away = useCallback((ms: number) => void run({ type: "practice.away", ms }), [run]);
  useAwayTime(away);

  useEffect(() => {
    document.documentElement.dataset.practice = "1";
    const was = document.title;
    document.title = `PRACTICE · ${s.name}`;
    return () => {
      delete document.documentElement.dataset.practice;
      document.title = was;
    };
  }, [s.name]);

  const reset = async () => {
    if (!window.confirm("Start practice over from the live game as it is now? Edits you haven't kept yet are lost. Your practice notes stay.")) return;
    try {
      await api("/api/practice/start", ident, {
        method: "POST",
        body: JSON.stringify({ fresh: true }),
      });
      toast("Practice reset to the live game.");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't reset.");
    }
  };

  return (
    <>
      <div className="practice-bar" role="region" aria-label="Practice mode">
        <span className="practice-tag">PRACTICE</span>
        <span className="practice-what">
          {ep ? <b>{ep.title}</b> : <b>Practice mode</b>}
          <span className="note"> · nothing here reaches the real TV or phones</span>
        </span>
        <span className="practice-clock" title="Practice time (time away from this tab isn't counted)">
          {formatClock(times.totalMs)}
          {practice.open ? <span className="note"> · {practice.open.label}</span> : null}
        </span>
        {s.currentSessionId && !ep ? <span className="practice-warn">A session is running in this copy</span> : null}
        <span className="spacer" />
        <button type="button" className={`btn small${pane === "notes" ? " on" : ""}`} aria-expanded={pane === "notes"} onClick={() => setPane((p) => (p === "notes" ? null : "notes"))}>
          Notes
          {practice.notes.trim() ? ` (${practice.notes.split("\n").filter((x) => x.trim()).length})` : ""}
        </button>
        <button type="button" className={`btn small${pane === "standins" ? " on" : ""}`} aria-expanded={pane === "standins"} onClick={() => setPane((p) => (p === "standins" ? null : "standins"))}>
          Stand-ins
        </button>
        <button type="button" className={`btn small${preview ? " on" : ""}`} aria-pressed={preview} onClick={() => setPreview((v) => !v)}>
          Preview
        </button>
        <button type="button" className="btn small" onClick={reset}>
          Reset practice
        </button>
        <button type="button" className="btn small primary" onClick={() => setEnding(true)}>
          End practice
        </button>
      </div>
      {pane === "notes" ? <NotesPane practice={practice} onClose={() => setPane(null)} /> : null}
      {pane === "standins" ? <StandInsPane onClose={() => setPane(null)} /> : null}
      {preview ? <PreviewPanel onClose={() => setPreview(false)} /> : null}
      {ending ? <EndPractice onClose={() => setEnding(false)} /> : null}
    </>
  );
}

function formatClock(ms: number) {
  const sec = Math.floor(ms / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const ss = sec % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}` : `${m}:${String(ss).padStart(2, "0")}`;
}

function NotesPane({ practice, onClose }: { practice: PracticeInfo; onClose: () => void }) {
  const { run } = useDm();
  const notes = useAutosave(practice.notes, (text) => run({ type: "practice.notes", text }));
  return (
    <div className="practice-pane" role="dialog" aria-label="Practice notes">
      <div className="box-head">
        <h3>Practice notes</h3>
        <button type="button" className="btn small" onClick={() => (void notes.flush(), onClose())}>
          Done
        </button>
      </div>
      <p className="note">One per line. When practice ends they go on this episode&rsquo;s prep checklist. {notes.state === "saved" ? "Saved." : notes.state === "saving" ? "Saving…" : ""}</p>
      <textarea className="fld" rows={6} autoFocus placeholder="Need a name for the guard" value={notes.text} onChange={(e) => notes.onChange(e.target.value)} onBlur={() => void notes.flush()} />
    </div>
  );
}

function StandInsPane({ onClose }: { onClose: () => void }) {
  const { view, run } = useDm();
  const players = view.state.players.filter((p) => !p.archived);
  const [name, setName] = useState("");
  const num = (v: string) => (v.trim() === "" ? null : Number.isFinite(Number(v)) ? Math.round(Number(v)) : undefined);
  return (
    <div className="practice-pane wide" role="dialog" aria-label="Stand-ins">
      <div className="box-head">
        <h3>Stand-ins</h3>
        <button type="button" className="btn small" onClick={onClose}>
          Done
        </button>
      </div>
      <p className="note">One for each character at the table. You act for them on the fight screen, and their phone shows in Preview. AC and initiative bonus are only for practice.</p>
      <table className="standin-table">
        <thead>
          <tr>
            <th>Stand-in</th>
            <th>AC</th>
            <th>Init</th>
            <th>Max HP</th>
            <th aria-label="Remove" />
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.id}>
              <td>
                <b>{p.character?.trim() || p.name}</b>
                {p.character?.trim() ? <span className="note"> {p.name}</span> : null}
              </td>
              <td>
                <input
                  className="fld num"
                  inputMode="numeric"
                  aria-label={`${p.name} AC`}
                  defaultValue={p.standIn?.ac ?? ""}
                  onBlur={(e) => {
                    const v = num(e.target.value);
                    if (v !== undefined && v !== (p.standIn?.ac ?? null))
                      void run({
                        type: "practice.standinSet",
                        playerId: p.id,
                        ac: v,
                      });
                  }}
                />
              </td>
              <td>
                <input
                  className="fld num"
                  inputMode="numeric"
                  aria-label={`${p.name} initiative bonus`}
                  placeholder="+0"
                  defaultValue={p.standIn?.initBonus ?? ""}
                  onBlur={(e) => {
                    const v = num(e.target.value.replace("+", ""));
                    if (v !== undefined && v !== (p.standIn?.initBonus ?? null))
                      void run({
                        type: "practice.standinSet",
                        playerId: p.id,
                        initBonus: v,
                      });
                  }}
                />
              </td>
              <td>
                <input
                  className="fld num"
                  inputMode="numeric"
                  aria-label={`${p.name} max HP`}
                  defaultValue={p.hp?.max ?? ""}
                  onBlur={(e) => {
                    const v = num(e.target.value);
                    if (v !== undefined && v !== (p.hp?.max ?? null))
                      void run({
                        type: "practice.standinSet",
                        playerId: p.id,
                        maxHp: v,
                      });
                  }}
                />
              </td>
              <td>
                <button type="button" className="chip-x" aria-label={`Remove ${p.name}`} title="Remove" onClick={() => void run({ type: "practice.standinRemove", playerId: p.id })}>
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <form
        className="prep-add"
        onSubmit={async (e) => {
          e.preventDefault();
          if (name.trim() && (await run({ type: "practice.standinAdd", name: name.trim() }))) setName("");
        }}
      >
        <input className="fld" placeholder="Add a stand-in, e.g. Extra fighter" maxLength={32} value={name} onChange={(e) => setName(e.target.value)} aria-label="New stand-in name" />
        <button className="btn" type="submit" disabled={!name.trim()}>
          Add
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview: the practice TV and a stand-in's phone, exactly as those screens get them

export function PreviewPanel({ onClose }: { onClose: () => void }) {
  const { view, ident } = useDm();
  const players = view.state.players.filter((p) => !p.archived);
  const [which, setWhich] = useState<"tv" | "phone">("tv");
  const [who, setWho] = useState(players[0]?.handle ?? "");
  const tvHref = practiceHref(ident.game, "TV");
  const phoneHref = who ? practiceHref(ident.game, who) : "";
  return (
    <aside className={`practice-preview ${which}`} aria-label="Preview">
      <div className="practice-preview-head">
        <div className="seg" role="tablist" aria-label="Which screen">
          <button type="button" role="tab" aria-selected={which === "tv"} className={which === "tv" ? "on" : ""} onClick={() => setWhich("tv")}>
            TV
          </button>
          <button type="button" role="tab" aria-selected={which === "phone"} className={which === "phone" ? "on" : ""} onClick={() => setWhich("phone")}>
            Phone
          </button>
        </div>
        {which === "phone" ? (
          <select className="fld" aria-label="Whose phone" value={who} onChange={(e) => setWho(e.target.value)}>
            {players.map((p) => (
              <option key={p.id} value={p.handle}>
                {p.character?.trim() || p.name}
              </option>
            ))}
          </select>
        ) : (
          <button type="button" className="btn small" onClick={() => window.open(tvHref, `candlefair-practice-tv-${ident.game}`, "popup,width=1280,height=720")}>
            Open TV in a window
          </button>
        )}
        <span className="spacer" />
        <button type="button" className="btn small" onClick={onClose} aria-label="Close the preview">
          Close
        </button>
      </div>
      <p className="note practice-preview-note">The real {which === "tv" ? "TV page" : "phone page"}, fed exactly what that screen would get. You can tap it.</p>
      <div className="practice-frame-wrap">
        {which === "tv" ? (
          <TvFrame src={tvHref} />
        ) : phoneHref ? (
          <div className="practice-frame phone">
            <iframe key={phoneHref} title="Stand-in phone" src={phoneHref} />
          </div>
        ) : (
          <p className="note">No stand-ins. Add one under Stand-ins.</p>
        )}
      </div>
    </aside>
  );
}

/** The TV page at its real 1920x1080, scaled down to the panel. */
function TvFrame({ src }: { src: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.28);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / 1920);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={box} className="practice-frame tv">
      <iframe title="Practice TV" src={src} style={{ transform: `scale(${scale})` }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ending practice

interface EditsReply {
  edits: PracticeEdit[];
  times: PracticeTimes;
  notes: string;
  factor: number;
  episodeId: string | null;
}

export function EndPractice({ onClose }: { onClose: () => void }) {
  const { ident, run, view } = useDm();
  const [data, setData] = useState<EditsReply | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [keep, setKeep] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");
  const [factor, setFactor] = useState(view.state.practice?.factor ?? 2);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ applied: number; notes: number } | null>(null);

  useEffect(() => {
    api<EditsReply>("/api/practice/edits", ident)
      .then((d) => {
        setData(d);
        setNotes(d.notes);
        setFactor(d.factor);
        setKeep(Object.fromEntries(d.edits.map((e) => [e.id, !e.conflict])));
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [ident]);

  const estimate = data ? Math.round(data.times.totalMs * factor) : 0;
  const chosen = useMemo(
    () =>
      Object.entries(keep)
        .filter(([, v]) => v)
        .map(([k]) => k),
    [keep],
  );
  const lines = notes.split("\n").filter((x) => x.trim()).length;

  const finish = async (discard: boolean) => {
    if (discard && !window.confirm("Throw away the whole practice copy? No edits or notes are kept.")) return;
    setBusy(true);
    try {
      const r = await api<{ applied: number; notes: number }>("/api/practice/end", ident, {
        method: "POST",
        body: JSON.stringify(discard ? { discard: true } : { keep: chosen, notes }),
      });
      setDone(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="inbox-backdrop">
        <aside className="inbox-drawer wrapup practice-end" role="dialog" aria-label="Practice ended">
          <div className="box-head">
            <h2>Practice ended</h2>
          </div>
          <p>
            {done.applied ? `Kept ${done.applied} ${done.applied === 1 ? "edit" : "edits"} in the live game. ` : "Nothing was changed in the live game. "}
            {done.notes ? `${done.notes} ${done.notes === 1 ? "note is" : "notes are"} on the prep checklist.` : ""} The practice copy is deleted.
          </p>
          <a className="btn primary" href={hrefFor(ident.game, "DM")}>
            Back to the live game
          </a>
        </aside>
      </div>
    );
  }

  return (
    <div className="inbox-backdrop" onClick={onClose}>
      <aside className="inbox-drawer wrapup practice-end" role="dialog" aria-label="End practice" onClick={(e) => e.stopPropagation()}>
        <div className="box-head">
          <h2>End practice</h2>
          <button type="button" className="btn small" onClick={onClose}>
            Keep practising
          </button>
        </div>
        {error ? <p className="error-text">{error}</p> : null}
        {!data ? (
          <p className="note">{error ? "" : "Looking at what changed…"}</p>
        ) : (
          <>
            <section className="practice-section">
              <h3>Time</h3>
              <p className="practice-total">
                <b>{formatDuration(data.times.totalMs)}</b> practised. Real session estimate: <b>{aboutDuration(estimate)}</b>
              </p>
              <label className="practice-factor">
                Players take
                <select
                  className="fld"
                  value={factor}
                  onChange={(e) => {
                    const f = Number(e.target.value);
                    setFactor(f);
                    void run({ type: "practice.factor", factor: f });
                  }}
                >
                  {[1, 1.5, 2, 2.5, 3, 4].map((f) => (
                    <option key={f} value={f}>
                      {f}×
                    </option>
                  ))}
                </select>
                as long as you did
              </label>
              {data.times.segments.length ? (
                <table className="practice-times">
                  <tbody>
                    {data.times.segments.map((x) => (
                      <tr key={x.key}>
                        <td>{x.label}</td>
                        <td className="num">{formatDuration(x.ms)}</td>
                        <td className="num note">{aboutDuration(x.ms * factor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="note">No beats or fights were timed. Click through a run sheet or run a fight to see each one.</p>
              )}
            </section>

            <section className="practice-section">
              <h3>{data.edits.length ? `Keep ${data.edits.length === 1 ? "this edit" : `these ${data.edits.length} edits`}?` : "Edits"}</h3>
              {data.edits.length ? (
                <>
                  <p className="note">Only content edits can be kept. Gold, HP, fights, reveals, Renown and everything else that happened is thrown away.</p>
                  <ul className="practice-edits">
                    {data.edits.map((e) => (
                      <li key={e.id} className={e.conflict ? "conflict" : ""}>
                        <label className="check">
                          <input
                            type="checkbox"
                            checked={!!keep[e.id]}
                            onChange={(ev) =>
                              setKeep((k) => ({
                                ...k,
                                [e.id]: ev.target.checked,
                              }))
                            }
                          />
                          <span>
                            <b>
                              {e.what}: {e.name}
                            </b>{" "}
                            <span className="note">{e.change === "added" ? "new" : e.change === "removed" ? "deleted" : e.detail ? `${e.detail} changed` : "changed"}</span>
                            {e.conflict ? <span className="tag wax">changed in both</span> : null}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  {data.edits.some((e) => e.conflict) ? <p className="note">“Changed in both”: you also changed it in the live game during practice. Ticking it replaces the live version.</p> : null}
                </>
              ) : (
                <p className="note">No content was edited. Everything that happened in practice is thrown away.</p>
              )}
            </section>

            <section className="practice-section">
              <h3>Practice notes</h3>
              <p className="note">{data.episodeId ? "Each line goes on the episode’s prep checklist." : "Each line goes on your to-do list."}</p>
              <textarea className="fld" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Nothing noted." />
            </section>

            <div className="practice-end-actions">
              <button type="button" className="btn" disabled={busy} onClick={() => finish(true)}>
                Throw everything away
              </button>
              <button type="button" className="btn primary" disabled={busy} onClick={() => finish(false)}>
                Finish: keep {chosen.length} {chosen.length === 1 ? "edit" : "edits"}
                {lines ? ` and ${lines} ${lines === 1 ? "note" : "notes"}` : ""}
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

/** A practice screen that isn't the DM's (the TV, a stand-in's phone): a stripe so it can't pass for the real thing. */
export function PracticeStripe({ label }: { label: string }) {
  useEffect(() => {
    document.documentElement.dataset.practice = "1";
    const t = document.title;
    document.title = `PRACTICE · ${label}`;
    return () => {
      delete document.documentElement.dataset.practice;
      document.title = t;
    };
  }, [label]);
  return (
    <div className="practice-stripe" role="status">
      <span className="practice-tag">PRACTICE</span> {label}
    </div>
  );
}
