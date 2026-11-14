"use client";

// Run-game mode: a presenter view for running a session beat by beat.
// DM-only. Everything here comes from the DM view; the TV only ever sees the
// effects of actions (a scene switch, the purse), never the run sheet.

import { useCallback, useEffect, useRef, useState } from "react";
import { previousRecap } from "@/shared/reducer";
import { beatFirstLine } from "@/shared/runsheet";
import type { Beat, BeatAction, Episode, Scene, Session, SessionRun } from "@/shared/types";
import { BankPanel } from "./BankPanel";
import { Inbox, isInboxOpen } from "./Inbox";
import { Dues } from "./Dues";
import { useDm } from "./context";

export function actionLabel(a: BeatAction, scenes: Scene[]): string {
  if (a.type === "black") return "TV → black screen";
  if (a.type === "bank") return "Bank opens · purse on the TV";
  if (a.type === "stinger") return "TV → plays the stinger";
  if (a.type === "fight") return `Fight: ${a.monsters.map((m) => (m.count > 1 ? `${m.name} ×${m.count}` : m.name)).join(", ")} · TV → Roll initiative!`;
  const sc = scenes.find((x) => x.id === a.sceneId);
  if (!sc) return "TV → a scene that was deleted";
  return sc.kind === "portrait" ? `TV → ${sc.label}’s portrait` : `TV → ${sc.label}`;
}

export function RunGame({ onExit, onFight }: { onExit: () => void; onFight?: () => void }) {
  const { view, run } = useDm();
  const s = view.state;
  const session = s.sessions.find((x) => x.id === s.currentSessionId);
  const r = session?.run;
  const ep = r ? (s.episodes ?? []).find((e) => e.id === r.episodeId) : undefined;
  const [drawer, setDrawer] = useState(false);
  const [bank, setBank] = useState(false);
  const [skip, setSkip] = useState<number[]>([]);

  // Skips belong to the beat you're about to land on; reset them when you move.
  const where = r ? `${r.stage}:${r.beat}` : "";
  useEffect(() => setSkip([]), [where]);

  const target = (rr: SessionRun, e: Episode): Beat | null => {
    if (rr.stage === "start") return e.beats[rr.beat] ?? null;
    if (rr.stage === "beat") return e.beats[rr.beat + 1] ?? null;
    return null;
  };

  const next = useCallback(() => {
    if (!r || !ep) return;
    const t = target(r, ep);
    if (t && t.actions.some((a, i) => a.type === "bank" && !skip.includes(i))) setBank(true);
    void run({ type: "run.next", ...(skip.length ? { skip } : {}) });
  }, [r, ep, skip, run]);
  const back = useCallback(() => void run({ type: "run.back" }), [run]);
  const jump = useCallback(
    (stage: SessionRun["stage"], beat?: number) => {
      setDrawer(false);
      if (stage === "beat" && ep && beat !== undefined && ep.beats[beat]?.actions.some((a) => a.type === "bank")) setBank(true);
      void run({ type: "run.jump", stage, ...(beat !== undefined ? { beat } : {}) });
    },
    [ep, run],
  );

  // Keys: Space or → next, Shift+Space or ← back. 0–9, S, P and Esc work as in the DM view; B opens the bank here.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isInboxOpen()) return; // the requests drawer has the keys while it's open
      const k = e.key;
      if ((k === " " && !e.shiftKey) || k === "ArrowRight" || k === "PageDown") next();
      else if ((k === " " && e.shiftKey) || k === "ArrowLeft" || k === "PageUp") back();
      else if (/^[0-9]$/.test(k)) {
        const sc = s.scenes.find((x) => x.hotkey === Number(k));
        if (sc) void run({ type: "scene.show", sceneId: sc.id });
      } else if (k === "s" || k === "S") void run({ type: "live.shop", open: !s.live.shopOpen });
      else if (k === "p" || k === "P") void run({ type: "live.purse", visible: !s.live.purseVisible });
      else if (k === "b" || k === "B") setBank((v) => !v);
      else if (k === "t" || k === "T") void run({ type: "arrival.showTable" });
      else if (k === "Escape") {
        if (bank) setBank(false);
        else if (drawer) setDrawer(false);
        else if (s.live.shopOpen) void run({ type: "live.shop", open: false });
        else return;
      } else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, back, run, s.scenes, s.live.shopOpen, s.live.purseVisible, bank, drawer]);

  if (!session || !r || !ep) {
    return (
      <div className="run-root">
        <div className="run-empty box">
          <h2>Run-game mode</h2>
          <p>No episode is running right now. Pick one in the header and press Run game.</p>
          <button className="btn" type="button" onClick={onExit}>
            Back to the DM view
          </button>
        </div>
      </div>
    );
  }

  const n = ep.beats.length;
  const beat = r.stage === "beat" ? ep.beats[r.beat] : null;
  const upcoming = target(r, ep);
  const live = s.scenes.find((x) => x.id === s.live.sceneId);
  const progress = r.stage === "start" ? 0 : r.stage === "end" ? 1 : (r.beat + 1) / Math.max(1, n);
  const position = r.stage === "start" ? "Check-in" : r.stage === "end" ? "Wrap-up" : `Beat ${r.beat + 1} of ${n}`;

  return (
    <div className="run-root">
      <header className="run-top">
        <button className="btn small" type="button" onClick={onExit}>
          ‹ <span className="run-exit-text">DM view</span>
        </button>
        <div className="run-head">
          <div className="run-ep">
            {ep.title} · {session.title}
          </div>
          <div className="run-pos" aria-live="polite">
            {position}
          </div>
        </div>
        <span className="spacer" />
        <span className="run-tv" title="What the TV shows">
          TV: {s.live.recapSessionId ? "Previously on…" : s.live.shopOpen ? "the shop" : (live?.label ?? "–")}
          {s.live.purseVisible ? " · purse" : ""}
        </span>
        <Inbox />
        {s.fight && onFight ? (
          <button className="btn small primary" type="button" onClick={onFight}>
            Back to the fight
          </button>
        ) : null}
        <button className="btn small" type="button" onClick={() => setBank(true)}>
          <span className="key">B</span> Bank
        </button>
        <button className="btn small run-jump-toggle" type="button" aria-expanded={drawer} onClick={() => setDrawer((v) => !v)}>
          Beats
        </button>
        <div className="run-progress" role="progressbar" aria-label={position} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
          <span style={{ width: `${progress * 100}%` }} />
        </div>
      </header>

      <div className="run-body">
        <main className="run-main">
          {r.stage === "start" ? <StartStep session={session} /> : null}
          {beat ? <BeatCard key={beat.id} beat={beat} scenes={s.scenes} /> : null}
          {r.stage === "end" ? <EndStep session={session} episode={ep} onBank={() => setBank(true)} onEnded={onExit} /> : null}

          {r.stage !== "end" ? (
            <section className="run-next" aria-label="Next beat">
              <div className="run-next-label">Next</div>
              {upcoming ? (
                <>
                  <div className="run-next-title">{upcoming.title}</div>
                  {beatFirstLine(upcoming) ? <div className="run-next-line">{beatFirstLine(upcoming)}</div> : null}
                  {upcoming.actions.length ? (
                    <ul className="run-actions">
                      {upcoming.actions.map((a, i) => {
                        const skipped = skip.includes(i);
                        return (
                          <li key={i} className={skipped ? "skipped" : ""}>
                            <span>{actionLabel(a, s.scenes)}</span>
                            <button className="btn small" type="button" aria-pressed={skipped} onClick={() => setSkip((xs) => (skipped ? xs.filter((x) => x !== i) : [...xs, i]))}>
                              {skipped ? "Skipped" : "Skip"}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </>
              ) : (
                <div className="run-next-title">Wrap-up: payday and the recap</div>
              )}
            </section>
          ) : null}

          {beat ? <QuickNotes key={`notes-${beat.id}`} beatId={beat.id} value={r.notes[beat.id] ?? ""} /> : null}
        </main>

        <nav className={`run-list${drawer ? " open" : ""}`} aria-label="Jump to a beat">
          <div className="run-list-head">
            <span>Jump to</span>
            <button className="btn small run-jump-toggle" type="button" onClick={() => setDrawer(false)}>
              Close
            </button>
          </div>
          <ol>
            <li>
              <button type="button" className={`run-li${r.stage === "start" ? " on" : ""}`} aria-current={r.stage === "start" ? "step" : undefined} onClick={() => jump("start")}>
                <span className="run-li-n">·</span> Check-in
              </button>
            </li>
            {ep.beats.map((b, i) => {
              const on = r.stage === "beat" && r.beat === i;
              return (
                <li key={b.id}>
                  <button type="button" className={`run-li${on ? " on" : ""}`} aria-current={on ? "step" : undefined} onClick={() => jump("beat", i)}>
                    <span className="run-li-n">{i + 1}</span> {b.title}
                    {r.notes[b.id] ? <span className="run-li-dot" title="Has quick notes" aria-label="has quick notes" /> : null}
                  </button>
                </li>
              );
            })}
            <li>
              <button type="button" className={`run-li${r.stage === "end" ? " on" : ""}`} aria-current={r.stage === "end" ? "step" : undefined} onClick={() => jump("end")}>
                <span className="run-li-n">·</span> Wrap-up
              </button>
            </li>
          </ol>
        </nav>
        {drawer ? <button className="run-scrim" type="button" aria-label="Close the beat list" onClick={() => setDrawer(false)} /> : null}
      </div>

      <footer className="run-foot">
        <button className="btn run-nav" type="button" onClick={back} disabled={r.stage === "start"}>
          ‹ Back
        </button>
        <button className="btn primary run-nav" type="button" onClick={next} disabled={r.stage === "end"}>
          {r.stage === "start" ? "Begin ›" : "Next ›"}
        </button>
      </footer>

      {bank ? (
        <div className="run-overlay" role="dialog" aria-modal="true" aria-label="Bank">
          <div className="run-overlay-head">
            <h2>Bank</h2>
            <button className="btn" type="button" onClick={() => setBank(false)}>
              Back to the run sheet
            </button>
          </div>
          <BankPanel />
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------

function BeatCard({ beat, scenes }: { beat: Beat; scenes: Scene[] }) {
  const { run } = useDm();
  const at = Math.min(beat.readAloudAt ?? 0, beat.notes.length);
  const read = beat.readAloud?.length ? (
    <blockquote className="run-read" key="read">
      {beat.readAloud.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </blockquote>
  ) : null;
  const before = beat.notes.slice(0, at);
  const after = beat.notes.slice(at);
  const notes = (xs: string[], key: string) =>
    xs.length ? (
      <ul className="run-notes" key={key}>
        {xs.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    ) : null;

  return (
    <article className="run-beat" aria-label={beat.title}>
      <h1 className="run-title">{beat.title}</h1>
      {beat.actions.length ? (
        <ul className="run-actions current">
          {beat.actions.map((a, i) => (
            <li key={i}>
              <span>{actionLabel(a, scenes)}</span>
              <button className="btn small" type="button" onClick={() => run({ type: "run.fire", beatId: beat.id, index: i })}>
                ↻ Again
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {notes(before, "before")}
      {read}
      {notes(after, "after")}
      {beat.checks.length ? (
        <table className="run-checks">
          <thead>
            <tr>
              <th scope="col">For</th>
              <th scope="col">Check</th>
              <th scope="col">DC</th>
              <th scope="col">On a fail</th>
              <th scope="col">On a success</th>
            </tr>
          </thead>
          <tbody>
            {beat.checks.map((c, i) => (
              <tr key={i}>
                <td data-label="For">{c.what || "–"}</td>
                <td data-label="Check">{c.skill}</td>
                <td data-label="DC" className="run-dc">
                  {c.dc}
                </td>
                <td data-label="On a fail">{c.fail || "–"}</td>
                <td data-label="On a success">{c.success || "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {beat.branches.length ? (
        <ul className="run-branches">
          {beat.branches.map((b, i) => (
            <li key={i}>
              <b>If {b.when}</b>
              {b.then ? <> → {b.then}</> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

/** Saves a while after you stop typing, and when you leave the box or the beat. */
function useAutosave(value: string, save: (v: string) => Promise<unknown>, delay = 800) {
  const [text, setText] = useState(value);
  const [state, setState] = useState<"saved" | "typing" | "saving">("saved");
  const latest = useRef({ text, value, save });
  latest.current = { text, value, save };
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (!dirty.current) return;
    dirty.current = false;
    setState("saving");
    await latest.current.save(latest.current.text);
    setState(dirty.current ? "typing" : "saved");
  }, []);

  // Follow the server (another device) while we have nothing unsaved.
  useEffect(() => {
    if (!dirty.current) setText(value);
  }, [value]);
  useEffect(() => () => void flush(), [flush]);

  const onChange = (v: string) => {
    setText(v);
    dirty.current = true;
    setState("typing");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), delay);
  };
  return { text, onChange, flush, state };
}

function QuickNotes({ beatId, value }: { beatId: string; value: string }) {
  const { run } = useDm();
  const a = useAutosave(value, (text) => run({ type: "run.note", beatId, text }));
  return (
    <section className="run-quick">
      <label>
        <span className="run-quick-label">
          Quick notes <span className="note">{a.state === "saved" ? "Saved" : a.state === "saving" ? "Saving…" : "…"}</span>
        </span>
        <textarea className="fld" rows={3} value={a.text} placeholder="What happened here, who did what, things to remember" onChange={(e) => a.onChange(e.target.value)} onBlur={() => void a.flush()} />
      </label>
    </section>
  );
}

function StartStep({ session }: { session: Session }) {
  const { view, run } = useDm();
  const s = view.state;
  const prev = previousRecap(s);
  const showing = !!prev && s.live.recapSessionId === prev.id;
  // Starred Chronicle notes from last time can go up with the recap.
  const starred = prev ? view.chronicle.notes.filter((n) => n.chapterId === prev.id && n.starred && !n.hidden) : [];
  const [unpicked, setUnpicked] = useState<Set<string>>(() => new Set());
  const picked = starred.filter((n) => !unpicked.has(n.id)).map((n) => n.id);
  const toggle = (id: string, on: boolean) => {
    const next = new Set(unpicked);
    if (on) next.delete(id);
    else next.add(id);
    setUnpicked(next);
    if (showing && prev) void run({ type: "live.recap", sessionId: prev.id, noteIds: starred.filter((n) => !next.has(n.id)).map((n) => n.id) });
  };
  const players = s.players.filter((p) => !p.archived);
  return (
    <article className="run-beat">
      <h1 className="run-title">Session start</h1>
      <section className="run-section">
        <h2>Who&rsquo;s here?</h2>
        <div className="checks run-attend">
          {players.map((p) => {
            const here = session.attendeeIds.includes(p.id) && !p.away;
            return (
              <label key={p.id} className="check">
                <input type="checkbox" checked={here} onChange={(e) => run({ type: "run.attend", playerId: p.id, here: e.target.checked })} />
                {p.name}
              </label>
            );
          })}
        </div>
        <p className="note">Anyone unticked is marked away: off the TV purse and out of &ldquo;pay everyone&rdquo;.</p>
      </section>
      {session.startLog?.length ? (
        <section className="run-section">
          <h2>Since last time</h2>
          <ul className="run-notelist">
            {session.startLog.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {prev ? (
        <section className="run-section">
          <h2>Previously on&hellip;</h2>
          <blockquote className="run-read small">
            <div className="run-read-kicker">{prev.title}</div>
            {prev
              .recap!.split(/\n\s*\n/)
              .filter((p) => p.trim())
              .map((p, i) => (
                <p key={i}>{p.trim()}</p>
              ))}
          </blockquote>
          {starred.length ? (
            <div className="run-starred">
              <div className="note">Starred notes from the Chronicle to show with it:</div>
              {starred.map((n) => (
                <label key={n.id} className="check run-starred-note">
                  <input type="checkbox" checked={!unpicked.has(n.id)} onChange={(e) => toggle(n.id, e.target.checked)} />
                  <span>
                    <span className="run-starred-text">{n.text}</span> <span className="note">&mdash; {n.author}</span>
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <p className="note">Star notes in the Chronicle to show them on the TV with the recap.</p>
          )}
          <button className={`btn${showing ? " on" : ""}`} type="button" aria-pressed={showing} onClick={() => run(showing ? { type: "live.recap", sessionId: null } : { type: "live.recap", sessionId: prev.id, noteIds: picked })}>
            {showing ? "Take it off the TV" : "Show it on the TV"}
          </button>
        </section>
      ) : null}
    </article>
  );
}

function EndStep({ session, episode, onBank, onEnded }: { session: Session; episode: Episode; onBank: () => void; onEnded: () => void }) {
  const { run } = useDm();
  const recap = useAutosave(session.recap ?? "", (text) => run({ type: "run.recap", sessionId: session.id, text }));
  const { view } = useDm();
  const tableNotes = view.chronicle.notes.filter((n) => n.chapterId === session.id).sort((a, b) => a.at - b.at);
  const notes = episode.beats.map((b, i) => ({ b, i, text: session.run?.notes[b.id] })).filter((x) => x.text?.trim());
  return (
    <article className="run-beat">
      <h1 className="run-title">Session end</h1>
      <section className="run-section">
        <h2>Rent and lessons due</h2>
        <Dues session={session} />
      </section>
      <section className="run-section run-payday">
        <h2>Payday</h2>
        <p>Pay out tonight&rsquo;s gold before everyone leaves.</p>
        <button className="btn primary" type="button" onClick={onBank}>
          Open the bank
        </button>
      </section>
      <section className="run-section">
        <h2>Recap</h2>
        <label>
          <span className="note">Saved with this session. Next time it&rsquo;s your &ldquo;Previously on&hellip;&rdquo; card. {recap.state === "saved" ? "Saved." : recap.state === "saving" ? "Saving…" : ""}</span>
          <textarea className="fld run-recap" rows={8} value={recap.text} onChange={(e) => recap.onChange(e.target.value)} onBlur={() => void recap.flush()} />
        </label>
      </section>
      <section className="run-section">
        <h2>The table&rsquo;s notes</h2>
        {tableNotes.length ? (
          <ol className="run-notelist">
            {tableNotes.map((n) => (
              <li key={n.id}>
                <b>
                  {n.starred ? "\u2605 " : ""}
                  {n.author}
                </b>
                {n.hidden ? <span className="tag wax">hidden</span> : null}
                <div className="run-notelist-text">{n.text}</div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="note">Nobody added to the Chronicle this session.</p>
        )}
      </section>
      <section className="run-section">
        <h2>Your quick notes</h2>
        {notes.length ? (
          <ol className="run-notelist">
            {notes.map(({ b, i, text }) => (
              <li key={b.id}>
                <b>
                  {i + 1}. {b.title}
                </b>
                <div className="run-notelist-text">{text}</div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="note">No quick notes this session.</p>
        )}
      </section>
      <button
        className="btn"
        type="button"
        onClick={async () => {
          await recap.flush();
          if (await run({ type: "session.end" }, `${session.title} ended.`)) onEnded();
        }}
      >
        End {session.title}
      </button>
    </article>
  );
}
